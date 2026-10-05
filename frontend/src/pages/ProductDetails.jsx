import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/products/${id}`);

      setProduct(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load product"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (event) => {
    const value = Number(event.target.value);

    if (value >= 1) {
      setQuantity(value);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) => current + 1);
  };

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    try {
      setAddingToCart(true);

      await api.post("/cart/items", {
        product_id: product.id,
        quantity,
      });

      toast.success(
        `${product.name} added to cart`
      );
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to add product to cart"
      );
    } finally {
      setAddingToCart(false);
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
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="store-page">
        <header className="navbar">
          <h1>Digital Product Store</h1>

          <nav>
            <Link to="/products">Products</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">Orders</Link>

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

        <main className="product-details-container">
          <div className="empty-box">
            <h2>Product not found</h2>

            <Link
              to="/products"
              className="view-button"
            >
              Back to Products
            </Link>
          </div>
        </main>
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

      <main className="product-details-container">
        <Link
          to="/products"
          className="back-link"
        >
          ← Back to Products
        </Link>

        <div className="product-details-card">
          <div className="product-details-image-section">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="product-details-image"
              />
            ) : (
              <div className="product-details-placeholder">
                Digital Product
              </div>
            )}
          </div>

          <div className="product-details-content">
            <span className="product-badge">
              Digital Product
            </span>

            <h2>{product.name}</h2>

            <p className="product-details-description">
              {product.description ||
                "No description available."}
            </p>

            <div className="product-details-price">
              ${Number(product.price).toFixed(2)}
            </div>

            <div className="quantity-section">
              <label htmlFor="quantity">
                Quantity
              </label>

              <div className="quantity-controls">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  −
                </button>

                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                />

                <button
                  type="button"
                  onClick={increaseQuantity}
                >
                  +
                </button>
              </div>
            </div>

            <div className="product-total">
              <span>Total</span>

              <strong>
                $
                {(
                  Number(product.price) * quantity
                ).toFixed(2)}
              </strong>
            </div>

            <button
              className="add-cart-button"
              onClick={handleAddToCart}
              disabled={addingToCart}
            >
              {addingToCart
                ? "Adding..."
                : "Add to Cart"}
            </button>

            <Link
              to="/cart"
              className="go-cart-button"
            >
              View Cart
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductDetails;