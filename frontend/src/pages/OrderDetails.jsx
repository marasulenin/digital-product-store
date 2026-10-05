
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // FETCH ORDER
  // ============================================================

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/orders/${id}`);

      setOrder(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load order"
      );

      if (error.response?.status === 404) {
        navigate("/orders");
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    logout();

    toast.success(
      "Logged out successfully"
    );

    navigate("/login");
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "PAID":
        return "status-paid";

      case "CANCELLED":
        return "status-cancelled";

      case "FAILED":
        return "status-failed";

      default:
        return "status-pending";
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="loading">
        Loading order...
      </div>
    );
  }

  // ============================================================
  // ORDER NOT FOUND
  // ============================================================

  if (!order) {
    return (
      <div className="store-page">

        <header className="navbar">

          <div>
            <h1>
              Digital Product Store
            </h1>
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

        <main className="order-details-container">

          <div className="empty-box">

            <h2>
              Order not found
            </h2>

            <p>
              The requested order could not be found.
            </p>

            <Link
              to="/orders"
              className="view-button"
            >
              Back to Orders
            </Link>

          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // ORDER DETAILS
  // ============================================================

  return (
    <div className="store-page">

      {/* ====================================================== */}
      {/* NAVBAR */}
      {/* ====================================================== */}

      <header className="navbar">

        <div>
          <h1>
            Digital Product Store
          </h1>
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


      {/* ====================================================== */}
      {/* MAIN */}
      {/* ====================================================== */}

      <main className="order-details-container">

        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

        <div className="order-details-header">

          <div>

            <Link
              to="/orders"
              className="back-link"
            >
              ← Back to Orders
            </Link>

            <h2>
              Order #{order.id}
            </h2>

            <p>
              Placed on{" "}
              {new Date(
                order.created_at
              ).toLocaleString()}
            </p>

          </div>


          <span
            className={`order-status ${getStatusClass(
              order.status
            )}`}
          >
            {order.status}
          </span>

        </div>


        {/* ==================================================== */}
        {/* ORDER INFORMATION */}
        {/* ==================================================== */}

        <div className="order-details-layout">

          {/* ================================================== */}
          {/* ITEMS */}
          {/* ================================================== */}

          <section className="order-details-card">

            <h3>
              Order Items
            </h3>

            <div className="order-detail-items">

              {order.items?.map((item) => {

                const itemTotal =
                  Number(item.price) *
                  item.quantity;

                return (
                  <div
                    className="order-detail-item"
                    key={item.id}
                  >

                    <div className="order-detail-item-image">
                      <div>
                        Digital Product
                      </div>
                    </div>


                    <div className="order-detail-item-info">

                      <h4>
                        Product #{item.product_id}
                      </h4>

                      <p>
                        Quantity: {item.quantity}
                      </p>

                      <p>
                        Unit price: $
                        {Number(
                          item.price
                        ).toFixed(2)}
                      </p>

                    </div>


                    <strong>
                      $
                      {itemTotal.toFixed(2)}
                    </strong>

                  </div>
                );
              })}

            </div>

          </section>


          {/* ================================================== */}
          {/* SUMMARY */}
          {/* ================================================== */}

          <aside className="order-summary-card">

            <h3>
              Order Summary
            </h3>


            <div className="summary-row">

              <span>
                Order ID
              </span>

              <strong>
                #{order.id}
              </strong>

            </div>


            <div className="summary-row">

              <span>
                Items
              </span>

              <span>
                {order.items?.reduce(
                  (total, item) =>
                    total + item.quantity,
                  0
                )}
              </span>

            </div>


            <div className="summary-row">

              <span>
                Status
              </span>

              <span
                className={`order-status ${getStatusClass(
                  order.status
                )}`}
              >
                {order.status}
              </span>

            </div>


            <div className="summary-divider" />


            <div className="summary-total">

              <span>
                Total
              </span>

              <strong>
                $
                {Number(
                  order.total_amount
                ).toFixed(2)}
              </strong>

            </div>


            {/* ============================================== */}
            {/* PENDING MESSAGE */}
            {/* ============================================== */}

            {order.status === "PENDING" && (
              <div className="order-pending-message">

                <strong>
                  Payment Pending
                </strong>

                <p>
                  Your payment has not been
                  confirmed yet.
                </p>

              </div>
            )}


            {/* ============================================== */}
            {/* PAID MESSAGE */}
            {/* ============================================== */}

            {order.status === "PAID" && (
              <div className="order-paid-message">

                <strong>
                  Payment Successful
                </strong>

                <p>
                  Your payment has been
                  successfully confirmed.
                </p>

              </div>
            )}


            {/* ============================================== */}
            {/* CANCELLED MESSAGE */}
            {/* ============================================== */}

            {order.status === "CANCELLED" && (
              <div className="order-cancelled-message">

                <strong>
                  Order Cancelled
                </strong>

                <p>
                  This order has been cancelled.
                </p>

              </div>
            )}


            {/* ============================================== */}
            {/* ACTIONS */}
            {/* ============================================== */}

            <div className="order-actions">

              <Link
                to="/orders"
                className="view-button"
              >
                ← All Orders
              </Link>

              <Link
                to="/products"
                className="continue-shopping"
              >
                Continue Shopping
              </Link>

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}

export default OrderDetails;
