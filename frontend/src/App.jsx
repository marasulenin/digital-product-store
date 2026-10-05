
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Link,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";

import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ============================================================
// HOME REDIRECT
// ============================================================

function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/products" replace />;
  }

  return <Navigate to="/login" replace />;
}

// ============================================================
// PAYMENT SUCCESS
// ============================================================

function PaymentSuccess() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

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

      <main className="payment-result-container">

        <div className="payment-result-card">

          <div className="payment-success-icon">
            ✓
          </div>

          <h2>
            Payment Successful!
          </h2>

          <p>
            Your payment was completed successfully.
          </p>

          <p>
            Your order status will be updated automatically
            after Stripe confirms the payment.
          </p>

          <div className="payment-result-actions">

            <Link
              to="/orders"
              className="view-button"
            >
              View My Orders
            </Link>

            <Link
              to="/products"
              className="continue-shopping"
            >
              Continue Shopping
            </Link>

          </div>

        </div>

      </main>

    </div>
  );
}

// ============================================================
// PAYMENT CANCELLED
// ============================================================

function PaymentCancelled() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

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

      <main className="payment-result-container">

        <div className="payment-result-card">

          <div className="payment-cancelled-icon">
            ×
          </div>

          <h2>
            Payment Cancelled
          </h2>

          <p>
            Your Stripe payment was cancelled.
          </p>

          <p>
            Your order remains pending and can be
            paid again.
          </p>

          <div className="payment-result-actions">

            <Link
              to="/orders"
              className="view-button"
            >
              View My Orders
            </Link>

            <Link
              to="/products"
              className="continue-shopping"
            >
              Continue Shopping
            </Link>

          </div>

        </div>

      </main>

    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

function App() {
  return (
    <>
      <BrowserRouter>

        <Routes>

          {/* HOME */}
          <Route
            path="/"
            element={<HomeRedirect />}
          />

          {/* AUTH */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* PRODUCTS */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />

          <Route
            path="/products/:id"
            element={
              <ProtectedRoute>
                <ProductDetails />
              </ProtectedRoute>
            }
          />

          {/* CART */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          {/* CHECKOUT */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          {/* ORDERS */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          {/* ORDER DETAILS */}
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            }
          />

          {/* STRIPE SUCCESS */}
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />

          {/* STRIPE CANCEL */}
          <Route
            path="/payment-cancelled"
            element={
              <ProtectedRoute>
                <PaymentCancelled />
              </ProtectedRoute>
            }
          />

          {/* UNKNOWN ROUTE */}
          <Route
            path="*"
            element={<HomeRedirect />}
          />

        </Routes>

      </BrowserRouter>

      {/* TOAST NOTIFICATIONS */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </>
  );
}

export default App;
