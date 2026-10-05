
import stripe

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Order, Payment, User
from ..schemas import CheckoutResponse


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)

# ============================================================
# STRIPE CONFIGURATION
# ============================================================

stripe.api_key = settings.STRIPE_SECRET_KEY


# ============================================================
# CREATE CHECKOUT SESSION
# ============================================================

@router.post(
    "/checkout",
    response_model=CheckoutResponse,
)
def create_checkout(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Find user's order
    # --------------------------------------------------------

    order = (
        db.query(Order)
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

    # --------------------------------------------------------
    # Prevent paying an already-paid order
    # --------------------------------------------------------

    if order.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already paid",
        )

    # --------------------------------------------------------
    # Make sure order contains products
    # --------------------------------------------------------

    if not order.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order has no items",
        )

    # --------------------------------------------------------
    # Check Stripe configuration
    # --------------------------------------------------------

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe secret key is not configured",
        )

    # --------------------------------------------------------
    # Build Stripe line items
    # --------------------------------------------------------

    line_items = []

    for item in order.items:
        line_items.append(
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Digital Product #{item.product_id}",
                    },
                    "unit_amount": int(
                        round(float(item.price) * 100)
                    ),
                },
                "quantity": item.quantity,
            }
        )

    # --------------------------------------------------------
    # Stripe success/cancel URLs
    # --------------------------------------------------------

    success_url = (
        f"{settings.FRONTEND_URL}"
        "/payment-success"
        "?session_id={CHECKOUT_SESSION_ID}"
    )

    cancel_url = (
        f"{settings.FRONTEND_URL}"
        "/payment-cancelled"
    )

    # --------------------------------------------------------
    # Create Stripe Checkout Session
    # --------------------------------------------------------

    try:
        checkout_session = stripe.checkout.Session.create(
            mode="payment",
            line_items=line_items,
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=current_user.email,
            metadata={
                "order_id": str(order.id),
                "user_id": str(current_user.id),
            },
        )

    except stripe.error.StripeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(exc)}",
        )

    # --------------------------------------------------------
    # Create/update local payment record
    # --------------------------------------------------------

    payment = (
        db.query(Payment)
        .filter(
            Payment.order_id == order.id
        )
        .first()
    )

    if payment is None:
        payment = Payment(
            order_id=order.id,
            stripe_session_id=checkout_session.id,
            stripe_payment_intent_id=None,
            amount=order.total_amount,
            status="PENDING",
        )

        db.add(payment)

    else:
        payment.stripe_session_id = checkout_session.id
        payment.stripe_payment_intent_id = None
        payment.amount = order.total_amount
        payment.status = "PENDING"

    order.status = "PENDING"

    db.commit()

    return {
        "checkout_url": checkout_session.url,
        "session_id": checkout_session.id,
    }


# ============================================================
# CREATE CHECKOUT SESSION - ASSIGNMENT ENDPOINT
# ============================================================

@router.post(
    "/create-checkout-session",
    response_model=CheckoutResponse,
)
def create_checkout_session(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_checkout(
        order_id=order_id,
        db=db,
        current_user=current_user,
    )


# ============================================================
# STRIPE WEBHOOK
# ============================================================

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Read raw Stripe request body
    # --------------------------------------------------------

    payload = await request.body()

    # --------------------------------------------------------
    # Get Stripe signature
    # --------------------------------------------------------

    signature = request.headers.get("stripe-signature")

    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature",
        )

    # --------------------------------------------------------
    # Check webhook secret
    # --------------------------------------------------------

    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe webhook secret is not configured",
        )

    # --------------------------------------------------------
    # Validate Stripe webhook
    # --------------------------------------------------------

    try:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            settings.STRIPE_WEBHOOK_SECRET,
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook payload",
        )

    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook signature",
        )

    # --------------------------------------------------------
    # Get event type
    # --------------------------------------------------------

    event_type = event.get("type")

    print(
        f"Stripe webhook received: {event_type}"
    )

    # ========================================================
    # CHECKOUT SESSION COMPLETED
    # ========================================================

    if event_type == "checkout.session.completed":

        session = event["data"]["object"]

        # ----------------------------------------------------
        # Get metadata
        # ----------------------------------------------------

        metadata = session.get("metadata") or {}

        order_id_value = metadata.get("order_id")

        if not order_id_value:
            print(
                "Stripe webhook error: order_id missing"
            )

            return {
                "received": True,
                "message": "order_id missing",
            }

        # ----------------------------------------------------
        # Convert order ID to integer
        # ----------------------------------------------------

        try:
            order_id = int(order_id_value)

        except (ValueError, TypeError):
            print(
                f"Stripe webhook error: "
                f"invalid order_id {order_id_value}"
            )

            return {
                "received": True,
                "message": "invalid order_id",
            }

        # ----------------------------------------------------
        # Find order
        # ----------------------------------------------------

        order = (
            db.query(Order)
            .filter(
                Order.id == order_id
            )
            .first()
        )

        if order is None:
            print(
                f"Stripe webhook error: "
                f"Order {order_id} not found"
            )

            return {
                "received": True,
                "message": "order not found",
            }

        # ----------------------------------------------------
        # Get existing payment
        # ----------------------------------------------------

        payment = (
            db.query(Payment)
            .filter(
                Payment.order_id == order.id
            )
            .first()
        )

        # ----------------------------------------------------
        # Stripe session information
        # ----------------------------------------------------

        session_id = session.get("id")

        payment_intent_id = session.get(
            "payment_intent"
        )

        # ----------------------------------------------------
        # Update payment
        # ----------------------------------------------------

        if payment is None:

            payment = Payment(
                order_id=order.id,
                stripe_session_id=session_id,
                stripe_payment_intent_id=payment_intent_id,
                amount=order.total_amount,
                status="PAID",
            )

            db.add(payment)

        else:

            payment.stripe_session_id = session_id

            payment.stripe_payment_intent_id = (
                payment_intent_id
            )

            payment.amount = order.total_amount

            payment.status = "PAID"

        # ----------------------------------------------------
        # Update order
        # ----------------------------------------------------

        order.status = "PAID"

        # ----------------------------------------------------
        # Commit transaction
        # ----------------------------------------------------

        db.commit()

        print(
            f"Order {order.id} successfully "
            f"marked as PAID"
        )

        return {
            "received": True,
            "message": "Order marked as PAID",
            "order_id": order.id,
        }

    # ========================================================
    # CHECKOUT SESSION EXPIRED
    # ========================================================

    if event_type == "checkout.session.expired":

        session = event["data"]["object"]

        metadata = session.get("metadata") or {}

        order_id_value = metadata.get(
            "order_id"
        )

        if order_id_value:

            try:
                order_id = int(
                    order_id_value
                )

                order = (
                    db.query(Order)
                    .filter(
                        Order.id == order_id
                    )
                    .first()
                )

                if order and order.status != "PAID":

                    order.status = "CANCELLED"

                    payment = (
                        db.query(Payment)
                        .filter(
                            Payment.order_id
                            == order.id
                        )
                        .first()
                    )

                    if payment:

                        payment.status = "CANCELLED"

                    db.commit()

                    print(
                        f"Order {order.id} "
                        f"marked as CANCELLED"
                    )

            except (ValueError, TypeError):
                pass

        return {
            "received": True,
            "message": "Checkout session expired",
        }

    # ========================================================
    # ASYNC PAYMENT FAILED
    # ========================================================

    if (
        event_type
        == "checkout.session.async_payment_failed"
    ):

        session = event["data"]["object"]

        metadata = session.get("metadata") or {}

        order_id_value = metadata.get(
            "order_id"
        )

        if order_id_value:

            try:
                order_id = int(
                    order_id_value
                )

                order = (
                    db.query(Order)
                    .filter(
                        Order.id == order_id
                    )
                    .first()
                )

                if order:

                    order.status = "FAILED"

                    payment = (
                        db.query(Payment)
                        .filter(
                            Payment.order_id
                            == order.id
                        )
                        .first()
                    )

                    if payment:
                        payment.status = "FAILED"

                    db.commit()

                    print(
                        f"Order {order.id} "
                        f"marked as FAILED"
                    )

            except (ValueError, TypeError):
                pass

        return {
            "received": True,
            "message": "Payment failed",
        }

    # ========================================================
    # OTHER STRIPE EVENTS
    # ========================================================

    return {
        "received": True,
        "message": "Event received",
    }
