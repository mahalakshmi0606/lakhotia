import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEye, FaTrash, FaEdit, FaSearch } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

const API_QUOTATIONS = "http://localhost:5000/api/quotations";

export default function QuotationReportPage() {
  const [quotations, setQuotations] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);

  // VIEW POPUP STATES
  const [viewData, setViewData] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("No");
  const [itemStatuses, setItemStatuses] = useState({});

  const userName = localStorage.getItem("user_name") || "Unknown User";

  // Fetch quotations
  const loadQuotations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_QUOTATIONS, {
        params: { status, page, per_page: perPage },
      });

      if (res.data.success) {
        setQuotations(res.data.data);
        setPagination(res.data.pagination);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast.error("Error loading quotations");
    }
  };

  // Search quotations
  const handleSearch = async () => {
    if (search.trim() === "") {
      loadQuotations();
      return;
    }
    try {
      const res = await axios.get(`${API_QUOTATIONS}/search?q=${search}`);
      if (res.data.success) {
        setQuotations(res.data.data);
        setPagination({});
      }
    } catch (err) {
      toast.error("Search failed");
    }
  };

  // Delete
  const deleteQuotation = async (id) => {
    if (!window.confirm("Delete this quotation?")) return;

    try {
      const res = await axios.delete(`${API_QUOTATIONS}/${id}`);
      if (res.data.success) {
        toast.success("Deleted successfully");
        loadQuotations();
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // View quotation
  const viewQuotation = async (id) => {
    try {
      const res = await axios.get(`${API_QUOTATIONS}/${id}`);
      if (res.data.success) {
        setViewData(res.data.data);

        // load current item statuses
        const itemState = {};
        res.data.data.items.forEach((it) => {
          itemState[it.id] = it.item_status === "approved";
        });

        setItemStatuses(itemState);

        setReviewStatus(res.data.data.review_status || "No");
      }
    } catch (err) {
      toast.error("Unable to load details");
    }
  };

  // Save updates
  const saveUpdates = async () => {
    try {
      const payload = {
        review_status: reviewStatus,
        items: Object.keys(itemStatuses).map((id) => ({
          id,
          item_status: itemStatuses[id] ? "approved" : "pending",
        })),
        updated_by: userName,
      };

      const res = await axios.put(
        `${API_QUOTATIONS}/${viewData.id}/review`,
        payload
      );

      if (res.data.success) {
        toast.success("Quotation updated!");
        setViewData(null);
        loadQuotations();
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [status, page]);

  return (
    <div className="container py-3">
      <ToastContainer />
      <h3 className="mb-3">Quotation Report</h3>

      {/* Filters */}
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search company / quote / item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={handleSearch}>
            <FaSearch /> Search
          </button>
        </div>

        <div className="col-md-3">
          <select
            className="form-select"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Quote No</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center">
                  Loading...
                </td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
                  No quotations found
                </td>
              </tr>
            ) : (
              quotations.map((q, idx) => (
                <tr key={q.id}>
                  <td>{(page - 1) * perPage + idx + 1}</td>
                  <td>{q.quote_number}</td>
                  <td>{q.company_name}</td>
                  <td>{q.contact_mobile}</td>
                  <td>₹{q.grand_total}</td>

                  <td>
                    <span
                      className={`badge bg-${
                        q.status === "accepted"
                          ? "success"
                          : q.status === "rejected"
                          ? "danger"
                          : q.status === "paid"
                          ? "primary"
                          : q.status === "sent"
                          ? "warning"
                          : "secondary"
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>

                  <td>{q.date}</td>

                  <td>
                    <button
                      className="btn btn-sm btn-info me-2"
                      onClick={() => viewQuotation(q.id)}
                    >
                      <FaEye />
                    </button>

                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() =>
                        (window.location.href = `/edit-quotation/${q.id}`)
                      }
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteQuotation(q.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination?.pages > 1 && (
        <div className="d-flex justify-content-between mt-3">
          <button
            className="btn btn-secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <span>
            Page {pagination.page} / {pagination.pages}
          </span>

          <button
            className="btn btn-secondary"
            disabled={page === pagination.pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* View Popup */}
      {viewData && (
        <div
          className="modal fade show d-block"
          style={{ background: "#00000090" }}
          onClick={() => setViewData(null)}
        >
          <div
            className="modal-dialog modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content p-3">
              <h4>Quotation Details</h4>

              <p>
                <strong>Quote No:</strong> {viewData.quote_number}
              </p>
              <p>
                <strong>Company:</strong> {viewData.company_name}
              </p>
              <p>
                <strong>Total:</strong> ₹{viewData.grand_total}
              </p>

              {/* Review Status */}
              <h5>Review Status</h5>
              <select
                className="form-select w-50 mb-3"
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
              >
                <option value="No">No</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <h5>Items</h5>
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>✓</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {viewData.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={itemStatuses[item.id] || false}
                          onChange={(e) =>
                            setItemStatuses({
                              ...itemStatuses,
                              [item.id]: e.target.checked,
                            })
                          }
                        />
                      </td>
                      <td>{item.item_name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.price_per_unit}</td>
                      <td>{item.item_total}</td>
                      <td>{item.item_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button className="btn btn-success" onClick={saveUpdates}>
                Save
              </button>

              <button
                className="btn btn-danger ms-2"
                onClick={() => setViewData(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
