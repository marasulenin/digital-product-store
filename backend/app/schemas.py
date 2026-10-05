from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ============================================================
# AUTH
# ============================================================

class RegisterRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        min_length=6,
        max_length=100,
    )


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    is_admin: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# ============================================================
# PRODUCTS
# ============================================================

class ProductCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=200,
    )

    description: Optional[str] = None

    price: float = Field(
        gt=0,
    )

    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    description: Optional[str] = None

    price: Optional[float] = Field(
        default=None,
        gt=0,
    )

    image_url: Optional[str] = None

    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    price: float
    image_url: Optional[str]
    is_active: bool
    created_at: datetime


class ProductListResponse(BaseModel):
    items: list[ProductResponse]

    page: int
    limit: int
    total: int
    total_pages: int


# ============================================================
# CART
# ============================================================

class CartItemCreate(BaseModel):
    product_id: int

    quantity: int = Field(
        default=1,
        ge=1,
    )


class CartItemUpdate(BaseModel):
    quantity: int = Field(
        ge=1,
    )


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    product: ProductResponse


class CartResponse(BaseModel):
    id: int
    items: list[CartItemResponse]
    total_amount: float


# ============================================================
# ORDERS
# ============================================================

class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    price: float


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    total_amount: float
    status: str
    created_at: datetime


class OrderDetailResponse(OrderResponse):
    items: list[OrderItemResponse]


class OrderListResponse(BaseModel):
    items: list[OrderDetailResponse]

    page: int
    limit: int
    total: int
    total_pages: int


# ============================================================
# PAYMENTS / STRIPE
# ============================================================

class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


# ============================================================
# ADMIN
# ============================================================

class AdminStatsResponse(BaseModel):
    total_users: int
    total_products: int
    total_orders: int
    total_revenue: float