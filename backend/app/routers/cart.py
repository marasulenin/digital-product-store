from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Cart, CartItem, Product, User
from ..schemas import (
    CartItemCreate,
    CartItemUpdate,
    CartResponse,
)


router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


# ============================================================
# GET CURRENT USER CART
# ============================================================

@router.get(
    "",
    response_model=CartResponse,
)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart = (
        db.query(Cart)
        .options(
            joinedload(Cart.items)
            .joinedload(CartItem.product)
        )
        .filter(Cart.user_id == current_user.id)
        .first()
    )

    if cart is None:
        cart = Cart(user_id=current_user.id)

        db.add(cart)
        db.commit()
        db.refresh(cart)

        cart.items = []

    total_amount = 0.0

    for item in cart.items:
        if item.product:
            total_amount += (
                item.product.price * item.quantity
            )

    return {
        "id": cart.id,
        "items": cart.items,
        "total_amount": round(total_amount, 2),
    }


# ============================================================
# ADD PRODUCT TO CART
# ============================================================

@router.post(
    "/items",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_to_cart(
    data: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find product
    product = (
        db.query(Product)
        .filter(
            Product.id == data.product_id,
            Product.is_active == True,
        )
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or inactive",
        )

    # Find user's cart
    cart = (
        db.query(Cart)
        .filter(Cart.user_id == current_user.id)
        .first()
    )

    if cart is None:
        cart = Cart(user_id=current_user.id)

        db.add(cart)
        db.commit()
        db.refresh(cart)

    # Check whether product is already in cart
    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == product.id,
        )
        .first()
    )

    if cart_item:
        cart_item.quantity += data.quantity
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=data.quantity,
        )

        db.add(cart_item)

    db.commit()

    return build_cart_response(
        db,
        cart.id,
    )


# ============================================================
# UPDATE CART ITEM
# ============================================================

@router.put(
    "/items/{item_id}",
    response_model=CartResponse,
)
def update_cart_item(
    item_id: int,
    data: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart = (
        db.query(Cart)
        .filter(Cart.user_id == current_user.id)
        .first()
    )

    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found",
        )

    item = (
        db.query(CartItem)
        .filter(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id,
        )
        .first()
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )

    item.quantity = data.quantity

    db.commit()

    return build_cart_response(
        db,
        cart.id,
    )


# ============================================================
# REMOVE CART ITEM
# ============================================================

@router.delete(
    "/items/{item_id}",
)
def remove_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart = (
        db.query(Cart)
        .filter(Cart.user_id == current_user.id)
        .first()
    )

    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found",
        )

    item = (
        db.query(CartItem)
        .filter(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id,
        )
        .first()
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )

    db.delete(item)
    db.commit()

    return {
        "message": "Cart item removed successfully",
    }


# ============================================================
# HELPER
# ============================================================

def build_cart_response(
    db: Session,
    cart_id: int,
):
    cart = (
        db.query(Cart)
        .options(
            joinedload(Cart.items)
            .joinedload(CartItem.product)
        )
        .filter(Cart.id == cart_id)
        .first()
    )

    total_amount = 0.0

    for item in cart.items:
        if item.product:
            total_amount += (
                item.product.price * item.quantity
            )

    return {
        "id": cart.id,
        "items": cart.items,
        "total_amount": round(total_amount, 2),
    }