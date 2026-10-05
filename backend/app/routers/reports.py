

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_admin
from ..models import Order, OrderItem, Product, User

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/revenue")
def revenue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    rows = (
        db.query(
            func.date(Order.created_at).label("date"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .filter(Order.status == "PAID")
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )

    return [
        {
            "date": str(row.date),
            "revenue": float(row.revenue or 0),
            "orders": int(row.orders or 0),
        }
        for row in rows
    ]


@router.get("/product-sales")
def product_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    rows = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.sum(OrderItem.quantity).label("quantity_sold"),
            func.sum(OrderItem.quantity * OrderItem.price).label("revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status == "PAID")
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .all()
    )

    return [
        {
            "product_id": row.product_id,
            "product_name": row.product_name,
            "quantity_sold": int(row.quantity_sold or 0),
            "revenue": float(row.revenue or 0),
        }
        for row in rows
    ]


@router.get("/order-status")
def order_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    rows = (
        db.query(
            Order.status.label("status"),
            func.count(Order.id).label("count"),
        )
        .group_by(Order.status)
        .order_by(Order.status)
        .all()
    )

    return [
        {
            "status": row.status,
            "count": int(row.count or 0),
        }
        for row in rows
    ]


@router.get("/customers")
def customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    rows = (
        db.query(
            User.id.label("user_id"),
            User.name.label("name"),
            User.email.label("email"),
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.total_amount), 0).label(
                "total_spent"
            ),
        )
        .join(Order, Order.user_id == User.id)
        .filter(Order.status == "PAID")
        .group_by(User.id, User.name, User.email)
        .order_by(func.sum(Order.total_amount).desc())
        .all()
    )

    return [
        {
            "user_id": row.user_id,
            "name": row.name,
            "email": row.email,
            "orders": int(row.orders or 0),
            "total_spent": float(row.total_spent or 0),
        }
        for row in rows
    ]


@router.get("/summary")
def summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    total_users = db.query(User).count()

    total_products = (
        db.query(Product)
        .filter(Product.is_active.is_(True))
        .count()
    )

    total_orders = db.query(Order).count()

    paid_orders = (
        db.query(Order)
        .filter(Order.status == "PAID")
        .count()
    )

    pending_orders = (
        db.query(Order)
        .filter(Order.status == "PENDING")
        .count()
    )

    failed_orders = (
        db.query(Order)
        .filter(Order.status == "FAILED")
        .count()
    )

    cancelled_orders = (
        db.query(Order)
        .filter(Order.status == "CANCELLED")
        .count()
    )

    total_revenue = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0))
        .filter(Order.status == "PAID")
        .scalar()
    )

    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "pending_orders": pending_orders,
        "failed_orders": failed_orders,
        "cancelled_orders": cancelled_orders,
        "total_revenue": float(total_revenue or 0),
    }

