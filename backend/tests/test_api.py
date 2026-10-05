
import uuid

from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models import User, Product
from app.security import hash_password


client = TestClient(app)


def unique_email():
    return f"test_{uuid.uuid4().hex[:10]}@example.com"


def create_user(name="Test User", is_admin=False):
    email = unique_email()
    password = "Test@123456"

    db = SessionLocal()

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        is_admin=is_admin,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    user_id = user.id
    db.close()

    return {
        "id": user_id,
        "name": name,
        "email": email,
        "password": password,
    }


def login(email, password):
    response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def auth_headers(token):
    return {
        "Authorization": f"Bearer {token}"
    }


# ============================================================
# 1. REGISTRATION
# ============================================================

def test_user_registration():
    email = unique_email()

    response = client.post(
        "/auth/register",
        json={
            "name": "Registration Test",
            "email": email,
            "password": "Test@123456",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["email"] == email
    assert data["name"] == "Registration Test"
    assert "id" in data


# ============================================================
# 2. LOGIN
# ============================================================

def test_user_login():
    user = create_user()

    response = client.post(
        "/auth/login",
        json={
            "email": user["email"],
            "password": user["password"],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


# ============================================================
# 3. INVALID LOGIN
# ============================================================

def test_invalid_login():
    user = create_user()

    response = client.post(
        "/auth/login",
        json={
            "email": user["email"],
            "password": "WrongPassword123",
        },
    )

    assert response.status_code == 401


# ============================================================
# 4. UNAUTHORIZED PROTECTED API
# ============================================================

def test_unauthorized_profile():
    response = client.get("/auth/me")

    assert response.status_code in (401, 403)


# ============================================================
# 5. AUTHENTICATED PROFILE
# ============================================================

def test_authenticated_profile():
    user = create_user()

    token = login(
        user["email"],
        user["password"],
    )

    response = client.get(
        "/auth/me",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == user["email"]
    assert data["name"] == user["name"]


# ============================================================
# 6. PRODUCT LISTING + PAGINATION
# ============================================================

def test_product_listing_pagination():
    response = client.get(
        "/products?page=1&limit=5"
    )

    assert response.status_code == 200

    data = response.json()

    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data
    assert "total_pages" in data

    assert data["page"] == 1
    assert data["limit"] == 5
    assert len(data["items"]) <= 5


# ============================================================
# 7. PRODUCT SEARCH
# ============================================================

def test_product_search():
    response = client.get(
        "/products?page=1&limit=10&search=python"
    )

    assert response.status_code == 200

    data = response.json()

    assert "items" in data
    assert "total" in data


# ============================================================
# 8. ADMIN PRODUCT CREATION
# ============================================================

def test_admin_product_creation():
    admin = create_user(
        name="Admin Test",
        is_admin=True,
    )

    token = login(
        admin["email"],
        admin["password"],
    )

    product_name = f"Test Digital Product {uuid.uuid4().hex[:6]}"

    response = client.post(
        "/admin/products",
        headers=auth_headers(token),
        json={
            "name": product_name,
            "description": "Automated test product",
            "price": 19.99,
            "image_url": None,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == product_name
    assert float(data["price"]) == 19.99


# ============================================================
# 9. NON-ADMIN CANNOT CREATE PRODUCT
# ============================================================

def test_non_admin_cannot_create_product():
    user = create_user()

    token = login(
        user["email"],
        user["password"],
    )

    response = client.post(
        "/admin/products",
        headers=auth_headers(token),
        json={
            "name": "Unauthorized Product",
            "description": "Should not be created",
            "price": 10.00,
        },
    )

    assert response.status_code == 403


# ============================================================
# 10. CART ADD + VIEW
# ============================================================

def test_cart_add_and_view():
    user = create_user()

    token = login(
        user["email"],
        user["password"],
    )

    product_response = client.get(
        "/products?page=1&limit=1"
    )

    assert product_response.status_code == 200

    products = product_response.json()["items"]

    if not products:
        # Create a product directly for the test.
        db = SessionLocal()

        product = Product(
            name=f"Cart Test Product {uuid.uuid4().hex[:6]}",
            description="Cart testing product",
            price=9.99,
            is_active=True,
        )

        db.add(product)
        db.commit()
        db.refresh(product)

        product_id = product.id

        db.close()
    else:
        product_id = products[0]["id"]

    response = client.post(
        "/cart/items",
        headers=auth_headers(token),
        json={
            "product_id": product_id,
            "quantity": 2,
        },
    )

    assert response.status_code in (200, 201)

    cart_response = client.get(
        "/cart",
        headers=auth_headers(token),
    )

    assert cart_response.status_code == 200

    cart = cart_response.json()

    assert "items" in cart
    assert "total_amount" in cart


# ============================================================
# 11. ORDER CREATION
# ============================================================

def test_order_creation_from_cart():
    user = create_user()

    token = login(
        user["email"],
        user["password"],
    )

    db = SessionLocal()

    product = Product(
        name=f"Order Test Product {uuid.uuid4().hex[:6]}",
        description="Order testing product",
        price=12.99,
        is_active=True,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    product_id = product.id

    db.close()

    cart_response = client.post(
        "/cart/items",
        headers=auth_headers(token),
        json={
            "product_id": product_id,
            "quantity": 1,
        },
    )

    assert cart_response.status_code in (200, 201)

    order_response = client.post(
        "/orders",
        headers=auth_headers(token),
    )

    assert order_response.status_code in (200, 201)

    order = order_response.json()

    assert "id" in order
    assert order["user_id"] == user["id"]
    assert float(order["total_amount"]) == 12.99
    assert order["status"] == "PENDING"


# ============================================================
# 12. USER CAN ONLY SEE OWN ORDERS
# ============================================================

def test_user_order_access():
    user = create_user()

    token = login(
        user["email"],
        user["password"],
    )

    response = client.get(
        "/orders?page=1&limit=10",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.json()

    assert "items" in data
    assert "total" in data

    for order in data["items"]:
        assert order["user_id"] == user["id"]


# ============================================================
# 13. ADMIN STATS
# ============================================================

def test_admin_stats():
    admin = create_user(
        name="Stats Admin",
        is_admin=True,
    )

    token = login(
        admin["email"],
        admin["password"],
    )

    response = client.get(
        "/admin/stats",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.json()

    assert "total_users" in data
    assert "total_products" in data
    assert "total_orders" in data
    assert "total_revenue" in data


# ============================================================
# 14. REPORTS REQUIRE ADMIN
# ============================================================

def test_reports_require_admin():
    user = create_user()

    token = login(
        user["email"],
        user["password"],
    )

    response = client.get(
        "/reports/summary",
        headers=auth_headers(token),
    )

    assert response.status_code == 403


# ============================================================
# 15. ADMIN REPORT
# ============================================================

def test_admin_revenue_report():
    admin = create_user(
        name="Report Admin",
        is_admin=True,
    )

    token = login(
        admin["email"],
        admin["password"],
    )

    response = client.get(
        "/reports/revenue",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    assert isinstance(response.json(), list)
