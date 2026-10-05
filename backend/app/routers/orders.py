
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Cart, CartItem, Order, OrderItem, User
from ..schemas import (
    OrderDetailResponse,
    OrderListResponse,
)


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


# ============================================================
# CREATE ORDER FROM CART
# ============================================================

@router.post(
    "",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
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

    if cart is None or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    # --------------------------------------------------------
    # Check that all products are still active
    # --------------------------------------------------------

    for cart_item in cart.items:
        if (
            cart_item.product is None
            or not cart_item.product.is_active
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Product {cart_item.product_id} "
                    "is unavailable"
                ),
            )

    # --------------------------------------------------------
    # Calculate total
    # --------------------------------------------------------

    total_amount = 0.0

    for cart_item in cart.items:
        total_amount += (
            cart_item.product.price
            * cart_item.quantity
        )

    total_amount = round(total_amount, 2)

    # --------------------------------------------------------
    # Create order
    # --------------------------------------------------------

    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="PENDING",
    )

    db.add(order)
    db.flush()

    # --------------------------------------------------------
    # Create order items
    # --------------------------------------------------------

    for cart_item in cart.items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            price=cart_item.product.price,
        )

        db.add(order_item)

    # --------------------------------------------------------
    # Clear cart
    # --------------------------------------------------------

    for cart_item in cart.items:
        db.delete(cart_item)

    db.commit()

    # --------------------------------------------------------
    # Reload order with items
    # --------------------------------------------------------

    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order.id)
        .first()
    )

    return order


# ============================================================
# GET MY ORDERS
# ============================================================

@router.get(
    "",
    response_model=OrderListResponse,
)
def get_my_orders(
    page: int = Query(
        default=1,
        ge=1,
        description="Page number",
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
        description="Number of orders per page",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(
            Order.user_id == current_user.id
        )
    )

    # --------------------------------------------------------
    # Total number of orders
    # --------------------------------------------------------

    total = query.count()

    # --------------------------------------------------------
    # Pagination
    # --------------------------------------------------------

    orders = (
        query
        .order_by(Order.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    # --------------------------------------------------------
    # Calculate total pages
    # --------------------------------------------------------

    total_pages = (
        ceil(total / limit)
        if total > 0
        else 0
    )

    return {
        "items": orders,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


# ============================================================
# GET ORDER DETAILS
# ============================================================

@router.get(
    "/{order_id}",
    response_model=OrderDetailResponse,
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return order
