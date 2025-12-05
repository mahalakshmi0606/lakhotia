import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaPaperclip,
  FaStickyNote,
  FaSearch,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const VisitReportPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState("view");
  const [selectedReport, setSelectedReport] = useState(null);

  // ✅ Search filters
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ Fetch all reports initially
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_BASE}/visitreport`);
      setReports(res.data);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to fetch reports");
    }
  };

  // ✅ Search by date range
  const handleDateSearch = async () => {
    if (!startDate || !endDate) {
      toast.warning("⚠️ Please select both dates");
      return;
    }
    try {
      const res = await axios.get(
        `${API_BASE}/visitreport/search?start_date=${startDate}&end_date=${endDate}`
      );
      setReports(res.data);
      if (res.data.length === 0) toast.info("ℹ️ No records found in this date range");
    } catch (err) {
      console.error(err);
      toast.error("❌ Error searching by date");
    }
  };

  // ✅ Search by name or keyword
  const handleNameSearch = async () => {
    if (!searchTerm.trim()) {
      toast.warning("⚠️ Please enter a name or keyword");
      return;
    }
    try {
      const res = await axios.get(
        `${API_BASE}/visitreport/searchname?term=${encodeURIComponent(searchTerm)}`
      );
      setReports(res.data);
      if (res.data.length === 0) toast.info("ℹ️ No records found for this name");
    } catch (err) {
      console.error(err);
      toast.error("❌ Error searching by name");
    }
  };

  const openModal = (mode, report = null) => {
    setFormMode(mode);
    setSelectedReport(report);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  // ✅ Delete Report
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await axios.delete(`${API_BASE}/visitreport/${id}`);
      toast.info("🗑️ Visit Report Deleted");
      fetchReports();
    } catch {
      toast.error("❌ Failed to delete");
    }
  };

  return (
    <div className="container py-4">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header Section */}
      <div
        className="d-flex flex-wrap justify-content-between align-items-center mb-3 p-3 rounded-3 shadow-sm"
        style={{ backgroundColor: "#fff9c4" }}
      >
        <h3 className="fw-bold text-dark mb-2 mb-md-0">📋 Visit Report</h3>

        {/* ✅ Search Section */}
        <div className="d-flex flex-wrap align-items-end gap-2">
          {/* 🔍 Search by Name */}
          <div className="d-flex align-items-center gap-2">
            <input
              type="text"
              className="form-control border-warning"
              placeholder="Search by name / keyword"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: "220px" }}
            />
            <button
              className="btn btn-warning text-dark fw-semibold d-flex align-items-center gap-2 shadow-sm"
              onClick={handleNameSearch}
            >
              <FaSearch /> Search
            </button>
          </div>

          {/* 📅 Date range search */}
          <div className="d-flex align-items-center gap-2">
            <div>
              <label className="form-label mb-0 small fw-semibold">From</label>
              <input
                type="date"
                className="form-control border-warning"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label mb-0 small fw-semibold">To</label>
              <input
                type="date"
                className="form-control border-warning"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              className="btn btn-warning text-dark fw-semibold d-flex align-items-center gap-2 shadow-sm"
              onClick={handleDateSearch}
            >
              <FaSearch /> Filter
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-lg rounded-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: "#fff59d" }}>
              <tr>
                <th>ID</th>
                <th>Company</th>
                <th>Industry</th>
                <th>Customer</th>
                <th>Department</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Attachment</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length > 0 ? (
                reports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.company_name}</td>
                    <td>{r.industry_segment}</td>
                    <td>{r.customer_name}</td>
                    <td>{r.department}</td>
                    <td>{r.created_by}</td>
                    <td>{r.created_at}</td>
                    <td>
                      {r.attachment ? (
                        <a
                          href={`${API_BASE}/visit_reports/${r.attachment}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary d-flex align-items-center gap-1 text-decoration-none"
                        >
                          <FaPaperclip /> View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {r.notes ? (
                        <span className="text-muted">
                          <FaStickyNote className="me-1 text-warning" />
                          {r.notes.slice(0, 15)}...
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="text-center">
                      <FaEye
                        className="text-info mx-2"
                        title="View"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal("view", r)}
                      />
                      <FaEdit
                        className="text-warning mx-2"
                        title="Edit"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal("edit", r)}
                      />
                      <FaTrash
                        className="text-danger mx-2"
                        title="Delete"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleDelete(r.id)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-3 text-muted">
                    No visit reports available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View/Edit Modal */}
      {showModal && selectedReport && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <div className="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
            <div
              className="modal-content border-0 shadow-lg rounded-4"
              style={{ backgroundColor: "#fffde7" }}
            >
              <div className="modal-header bg-warning text-dark py-2">
                <h5 className="modal-title fw-bold">
                  {formMode === "view" ? "View Visit Report" : "Edit Visit Report"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>

              <div className="modal-body p-3">
                <ul className="list-group list-group-flush">
                  {Object.entries(selectedReport).map(([key, value]) => (
                    <li key={key} className="list-group-item">
                      <strong>{key.replace(/_/g, " ")}:</strong> {String(value)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="modal-footer bg-light py-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitReportPage;
