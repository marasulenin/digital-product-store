
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Checkout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);

      const response = await api.get("/cart");

      setCart(response.data);

      if (!response.data.items?.length) {
        toast.info("Your cart is empty");
        navigate("/cart");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load cart"
      );

      navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!cart?.items?.length) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      setProcessing(true);

      /*
       * Step 1:
       * Create an order from the current cart.
       */
      const orderResponse = await api.post("/orders");

      const orderId = orderResponse.data.id;

      /*
       * Step 2:
       * Create Stripe Checkout Session.
       */
      const paymentResponse = await api.post(
        `/payments/checkout?order_id=${orderId}`
      );

      /*
       * Step 3:
       * Redirect user to Stripe Checkout.
       */
      const checkoutUrl =
        paymentResponse.data.checkout_url;

      if (!checkoutUrl) {
        throw new Error(
          "Stripe checkout URL was not returned"
        );
      }

      toast.success(
        "Redirecting to Stripe Checkout..."
      );

      window.location.href = checkoutUrl;
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          error.message ||
          "Checkout failed"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    logout();

    toast.success("Logged out successfully");

    navigate("/login");
  };

  if (loading) {
    return (
      <div className="loading">
        Loading checkout...
      </div>
    );
  }

  if (!cart?.items?.length) {
    return null;
  }

  return (
    <div className="store-page">
      <header className="navbar">
        <div>
          <h1>Digital Product Store</h1>
        </div>

        <nav>
          <Link to="/products">
            Products
          </Link>

          <Link to="/cart">
            Cart
          </Link>

          <Link to="/orders">
            Orders
          </Link>

          {user?.is_admin && (
            <Link to="/admin/products">
              Admin
            </Link>
          )}

          <button onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <main className="checkout-container">
        <div className="checkout-header">
          <div>
            <h2>Checkout</h2>

            <p>
              Review your order before payment.
            </p>
          </div>

          <Link
            to="/cart"
            className="continue-shopping"
          >
            ← Back to Cart
          </Link>
        </div>

        <div className="checkout-layout">
          <section className="checkout-items">
            <h3>Order Items</h3>

            {cart.items.map((item) => {
              const itemTotal =
                Number(item.product.price) *
                item.quantity;

              return (
                <div
                  className="checkout-item"
                  key={item.id}
                >
                  <div className="checkout-item-image">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                      />
                    ) : (
                      <div>
                        Digital Product
                      </div>
                    )}
                  </div>

                  <div className="checkout-item-info">
                    <h4>
                      {item.product.name}
                    </h4>

                    <p>
                      Quantity: {item.quantity}
                    </p>

                    <p>
                      $
                      {Number(
                        item.product.price
                      ).toFixed(2)}{" "}
                      each
                    </p>
                  </div>

                  <strong>
                    ${itemTotal.toFixed(2)}
                  </strong>
                </div>
              );
            })}
          </section>

          <aside className="checkout-summary">
            <h3>Order Summary</h3>

            <div className="summary-row">
              <span>Items</span>

              <span>
                {cart.items.reduce(
                  (total, item) =>
                    total + item.quantity,
                  0
                )}
              </span>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>

              <span>
                $
                {Number(
                  cart.total_amount
                ).toFixed(2)}
              </span>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Total</span>

              <strong>
                $
                {Number(
                  cart.total_amount
                ).toFixed(2)}
              </strong>
            </div>

            <button
              className="checkout-button"
              onClick={handleCheckout}
              disabled={processing}
            >
              {processing
                ? "Creating Checkout..."
                : "Pay with Stripe"}
            </button>

            <p className="secure-payment">
              🔒 Secure payment powered by Stripe
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default Checkout;
