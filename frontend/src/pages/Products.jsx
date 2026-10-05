import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Products() {
  const { user, logout } = useAuth();

  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(6);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await api.get("/products", {
        params: {
          page,
          limit,
          search: search || undefined,
        },
      });

      setProducts(response.data.items);
      setTotal(response.data.total);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <div className="store-page">

      {/* ================= NAVBAR ================= */}

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

      {/* ================= PRODUCTS ================= */}

      <main className="products-container">

        <div className="products-header">

          <div>
            <h2>Digital Products</h2>

            <p>
              {total} product
              {total !== 1 ? "s" : ""} available
            </p>
          </div>

          {/* ================= SEARCH ================= */}

          <form
            className="search-form"
            onSubmit={handleSearch}
          >
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
            />

            <button type="submit">
              Search
            </button>

            {search && (
              <button
                type="button"
                className="secondary-button"
                onClick={clearSearch}
              >
                Clear
              </button>
            )}
          </form>

        </div>

        {/* ================= LOADING ================= */}

        {loading && (
          <div className="loading-box">
            <h3>Loading products...</h3>
          </div>
        )}

        {/* ================= EMPTY ================= */}

        {!loading && products.length === 0 && (
          <div className="empty-box">
            <h3>No products found</h3>

            {search && (
              <button onClick={clearSearch}>
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* ================= PRODUCT GRID ================= */}

        {!loading && products.length > 0 && (
          <>
            <div className="products-grid">

              {products.map((product) => (
                <div
                  className="product-card"
                  key={product.id}
                >

                  {/* Product image */}

                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="product-image"
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      Digital Product
                    </div>
                  )}

                  <div className="product-content">

                    <h3>
                      {product.name}
                    </h3>

                    <p className="product-description">
                      {product.description ||
                        "No description available."}
                    </p>

                    <div className="product-footer">

                      <strong>
                        $
                        {Number(product.price).toFixed(2)}
                      </strong>

                      <Link
                        to={`/products/${product.id}`}
                        className="view-button"
                      >
                        View
                      </Link>

                    </div>

                  </div>

                </div>
              ))}

            </div>

            {/* ================= PAGINATION ================= */}

            {totalPages > 1 && (
              <div className="pagination">

                <button
                  disabled={page === 1}
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={
                      pageNumber === page
                        ? "active-page"
                        : ""
                    }
                    onClick={() =>
                      setPage(pageNumber)
                    }
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                >
                  Next
                </button>

              </div>
            )}

          </>
        )}

      </main>

    </div>
  );
}

export default Products;