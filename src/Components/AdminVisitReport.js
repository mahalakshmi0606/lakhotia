import React, { useState, useEffect } from "react";
import {
  FaEye,
  FaPaperclip,
  FaStickyNote,
  FaSearch,
  FaFileExcel,
  FaFilePdf,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

// Excel + PDF
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = "http://localhost:5000/api";

const VisitReportPage = () => {
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
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

  // ✅ Export to Excel
  const exportToExcel = () => {
    if (!reports.length) return toast.error("No data to export");

    const data = reports.map((r) => ({
      "Customer Name": r.customer_name,
      "Company Name": r.company_name,
      "Mobile": r.customer_mobile,
      "Notes": r.notes,
      "Created By": r.created_by,
      "Created At": new Date(r.created_at).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VisitReports");

    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Visit_Reports.xlsx"
    );
  };

  // ✅ Export to PDF
  const exportToPDF = () => {
    if (!reports.length) return toast.error("No data to export");

    const doc = new jsPDF("landscape", "pt", "a4");

    const columns = [
      "Customer Name",
      "Company Name", 
      "Mobile",
      "Notes",
      "Created By",
      "Created At"
    ];

    const rows = reports.map((item) => [
      item.customer_name,
      item.company_name,
      item.customer_mobile,
      item.notes,
      item.created_by,
      new Date(item.created_at).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      styles: { fontSize: 8 },
      margin: { top: 20, left: 10, right: 10 },
    });

    doc.save("Visit_Reports.pdf");
  };

  const openModal = (report = null) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
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

        <div className="d-flex flex-wrap gap-2 align-items-center">
          {/* Export Buttons */}
          <button className="btn btn-success btn-sm" onClick={exportToExcel}>
            <FaFileExcel /> Excel
          </button>

          <button className="btn btn-danger btn-sm" onClick={exportToPDF}>
            <FaFilePdf /> PDF
          </button>

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
                <th>Customer</th>
                <th>Company</th>
                <th>Mobile</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Attachment</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length > 0 ? (
                reports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.customer_name}</td>
                    <td>{r.company_name}</td>
                    <td>{r.customer_mobile}</td>
                    <td>{r.created_by}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
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
                          {r.notes.slice(0, 30)}...
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center">
                        <FaEye
                          className="text-info mx-2"
                          title="View Details"
                          style={{ cursor: "pointer" }}
                          onClick={() => openModal(r)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-3 text-muted">
                    No visit reports available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
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
                <h5 className="modal-title fw-bold">View Visit Report</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>

              <div className="modal-body p-3">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between">
                    <strong>Customer Name:</strong> 
                    <span>{selectedReport.customer_name || "-"}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <strong>Company Name:</strong> 
                    <span>{selectedReport.company_name || "-"}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <strong>Mobile:</strong> 
                    <span>{selectedReport.customer_mobile || "-"}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <strong>Created By:</strong> 
                    <span>{selectedReport.created_by || "-"}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <strong>Created At:</strong> 
                    <span>
                      {selectedReport.created_at 
                        ? new Date(selectedReport.created_at).toLocaleString() 
                        : "-"
                      }
                    </span>
                  </li>
                  <li className="list-group-item">
                    <strong>Notes:</strong>
                    <div className="mt-1 p-2 bg-light rounded">
                      {selectedReport.notes || "-"}
                    </div>
                  </li>
                  <li className="list-group-item">
                    <strong>Attachment:</strong>
                    <div className="mt-1">
                      {selectedReport.attachment ? (
                        <a
                          href={`${API_BASE}/visit_reports/${selectedReport.attachment}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <FaPaperclip className="me-1" />
                          View Attachment
                        </a>
                      ) : (
                        <span className="text-muted">No attachment</span>
                      )}
                    </div>
                  </li>
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