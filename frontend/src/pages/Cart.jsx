import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Cart() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);

      const response = await api.get("/cart");

      setCart(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load cart"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      return;
    }

    try {
      setUpdatingItem(itemId);

      const response = await api.put(
        `/cart/items/${itemId}`,
        {
          quantity,
        }
      );

      setCart(response.data);

      toast.success("Cart updated");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to update cart"
      );
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setRemovingItem(itemId);

      await api.delete(
        `/cart/items/${itemId}`
      );

      toast.success("Item removed from cart");

      await fetchCart();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to remove item"
      );
    } finally {
      setRemovingItem(null);
    }
  };

  const clearCart = async () => {
    if (!cart?.items?.length) {
      return;
    }

    try {
      setClearing(true);

      /*
       * The current backend does not have
       * DELETE /cart.
       *
       * Therefore remove each item individually.
       */
      for (const item of cart.items) {
        await api.delete(
          `/cart/items/${item.id}`
        );
      }

      setCart({
        ...cart,
        items: [],
        total_amount: 0,
      });

      toast.success("Cart cleared");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to clear cart"
      );

      await fetchCart();
    } finally {
      setClearing(false);
    }
  };

  const handleLogout = () => {
    logout();

    toast.success(
      "Logged out successfully"
    );

    navigate("/login");
  };

  if (loading) {
    return (
      <div className="loading">
        Loading cart...
      </div>
    );
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

      <main className="cart-container">
        <div className="cart-header">
          <div>
            <h2>Shopping Cart</h2>

            <p>
              {cart?.items?.length || 0} item
              {(cart?.items?.length || 0) !== 1
                ? "s"
                : ""}
            </p>
          </div>

          <Link
            to="/products"
            className="continue-shopping"
          >
            ← Continue Shopping
          </Link>
        </div>

        {!cart?.items?.length ? (
          <div className="empty-cart">
            <h2>Your cart is empty</h2>

            <p>
              Add some digital products to
              continue.
            </p>

            <Link
              to="/products"
              className="shop-button"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              {cart.items.map((item) => {
                const itemTotal =
                  Number(item.product.price) *
                  item.quantity;

                const isUpdating =
                  updatingItem === item.id;

                const isRemoving =
                  removingItem === item.id;

                return (
                  <div
                    className="cart-item"
                    key={item.id}
                  >
                    <div className="cart-item-image">
                      {item.product.image_url ? (
                        <img
                          src={
                            item.product.image_url
                          }
                          alt={
                            item.product.name
                          }
                        />
                      ) : (
                        <div>
                          Digital Product
                        </div>
                      )}
                    </div>

                    <div className="cart-item-info">
                      <h3>
                        {item.product.name}
                      </h3>

                      <p>
                        $
                        {Number(
                          item.product.price
                        ).toFixed(2)}{" "}
                        each
                      </p>

                      <div className="cart-quantity">
                        <button
                          disabled={
                            isUpdating ||
                            item.quantity <= 1
                          }
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1
                            )
                          }
                        >
                          −
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          disabled={isUpdating}
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-right">
                      <strong>
                        $
                        {itemTotal.toFixed(2)}
                      </strong>

                      <button
                        className="remove-button"
                        disabled={
                          isRemoving ||
                          isUpdating
                        }
                        onClick={() =>
                          removeItem(item.id)
                        }
                      >
                        {isRemoving
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>

            <aside className="cart-summary">
              <h2>Order Summary</h2>

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
                onClick={() =>
                  navigate("/checkout")
                }
              >
                Proceed to Checkout
              </button>

              <button
                className="clear-cart-button"
                onClick={clearCart}
                disabled={clearing}
              >
                {clearing
                  ? "Clearing..."
                  : "Clear Cart"}
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default Cart;