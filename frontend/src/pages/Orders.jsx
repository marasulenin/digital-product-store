
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Orders() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);

  // ======================================
  // ======================
  // FETCH ORDERS
  // ============================================================

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await api.get("/orders", {
        params: {
          page,
          limit,
        },
      });

      setOrders(response.data.items || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.total_pages || 0);
    } catch (error) {
      console.error("Failed to fetch orders:", error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to load orders"
      );

      if (error.response?.status === 401) {
        logout();
        navigate("/login");
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
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "PAID":
        return "status-paid";

      case "FAILED":
        return "status-failed";

      case "CANCELLED":
        return "status-cancelled";

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
        Loading orders...
      </div>
    );
  }

  // ============================================================
  // PAGE
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

      <main className="orders-container">

        <div className="orders-header">

          <div>

            <h2>
              My Orders
            </h2>

            <p>
              View your order history and payment status.
            </p>

          </div>

          <Link
            to="/products"
            className="continue-shopping"
          >
            Continue Shopping
          </Link>

        </div>


        {/* ==================================================== */}
        {/* EMPTY ORDERS */}
        {/* ==================================================== */}

        {orders.length === 0 ? (

          <div className="empty-box">

            <h3>
              No orders found
            </h3>

            <p>
              You have not placed any orders yet.
            </p>

            <Link
              to="/products"
              className="view-button"
            >
              Browse Products
            </Link>

          </div>

        ) : (

          <>

            {/* ================================================= */}
            {/* ORDER LIST */}
            {/* ================================================= */}

            <div className="orders-list">

              {orders.map((order) => (

                <div
                  className="order-card"
                  key={order.id}
                >

                  {/* =========================================== */}
                  {/* ORDER HEADER */}
                  {/* =========================================== */}

                  <div className="order-card-header">

                    <div>

                      <h3>
                        Order #{order.id}
                      </h3>

                      <p>
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


                  {/* =========================================== */}
                  {/* ORDER ITEMS */}
                  {/* =========================================== */}

                  <div className="order-card-items">

                    {order.items?.map((item) => (

                      <div
                        className="order-card-item"
                        key={item.id}
                      >

                        <div>

                          <strong>
                            Product #{item.product_id}
                          </strong>

                          <p>
                            Quantity: {item.quantity}
                          </p>

                        </div>

                        <strong>
                          $
                          {(
                            Number(item.price) *
                            item.quantity
                          ).toFixed(2)}
                        </strong>

                      </div>

                    ))}

                  </div>


                  {/* =========================================== */}
                  {/* ORDER FOOTER */}
                  {/* =========================================== */}

                  <div className="order-card-footer">

                    <div>

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

                    <Link
                      to={`/orders/${order.id}`}
                      className="view-button"
                    >
                      View Details
                    </Link>

                  </div>

                </div>

              ))}

            </div>


            {/* ================================================= */}
            {/* PAGINATION */}
            {/* ================================================= */}

            {totalPages > 1 && (

              <div className="pagination">

                <button
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.max(
                        currentPage - 1,
                        1
                      )
                    )
                  }
                  disabled={page === 1}
                >
                  ← Previous
                </button>


                <span>
                  Page {page} of {totalPages}
                </span>


                <button
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.min(
                        currentPage + 1,
                        totalPages
                      )
                    )
                  }
                  disabled={page === totalPages}
                >
                  Next →
                </button>

              </div>

            )}

          </>

        )}

        {/* ==================================================== */}
        {/* TOTAL */}
        {/* ==================================================== */}

        {total > 0 && (
          <p className="orders-total">
            Total orders: {total}
          </p>
        )}

      </main>

    </div>
  );
}

export default Orders;

