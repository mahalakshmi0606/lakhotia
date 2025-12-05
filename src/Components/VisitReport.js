// VisitReportPage.js
import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaPaperclip,
  FaFileExcel,
  FaFilePdf,
} from "react-icons/fa";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

// ⭐ Excel + PDF
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = "http://localhost:5000/api";

const VisitReportPage = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const username = localStorage.getItem("username") || "Admin";

  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchMobile, setSearchMobile] = useState("");

  const [formData, setFormData] = useState({
    company_name: "",
    company_address: "",
    pin_code: "",
    industry_segment: "",
    customer_name: "",
    customer_mobile: "",
    customer_email: "",
    department: "",
    notes: "",
    attachment: null,
    created_by: username,
  });

  // ============================
  // ⭐ FETCH REPORTS
  // ============================
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_BASE}/visitreport`);
      let all = res.data;

      if (username !== "Admin") {
        all = all.filter((r) => r.created_by === username);
      }

      setReports(all);
      setFilteredReports(all);
    } catch {
      toast.error("❌ Failed to fetch reports");
    }
  };

  // ============================
  // ⭐ SEARCH FILTERS
  // ============================
  useEffect(() => {
    let temp = reports;

    if (searchCustomer.trim()) {
      temp = temp.filter((r) =>
        (r.customer_name || "").toLowerCase().includes(searchCustomer.toLowerCase())
      );
    }

    if (searchCompany.trim()) {
      temp = temp.filter((r) =>
        (r.company_name || "").toLowerCase().includes(searchCompany.toLowerCase())
      );
    }

    if (searchMobile.trim()) {
      temp = temp.filter((r) => (r.customer_mobile || "").includes(searchMobile));
    }

    setFilteredReports(temp);
  }, [searchCustomer, searchCompany, searchMobile, reports]);

  // ============================
  // ⭐ HANDLE INPUT
  // ============================
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "attachment") {
      setFormData({ ...formData, attachment: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ⭐ FIXED — AUTO-FILL FROM COMPANY MOBILE API
  const handleMobileChange = async (e) => {
    const mobile = e.target.value;
    setFormData({ ...formData, customer_mobile: mobile });

    if (mobile.length !== 10) return;

    try {
      const res = await axios.get(`${API_BASE}/company/mobile/${mobile}`);
      const data = res.data;

      setFormData((prev) => ({
        ...prev,
        company_name: data.company_name || "",
        company_address: data.company_address || "",
        pin_code: data.pin_code || "",
        industry_segment: data.industry_segment || "",
        customer_name: data.customer_name || "",
        customer_email: data.customer_email || "",
        department: data.department || "",
      }));
    } catch (err) {
      console.log("Auto-fill failed:", err);
      toast.info("ℹ No company found for this number");
    }
  };

  // ============================
  // ⭐ MODAL CONTROL
  // ============================
  const openModal = (mode, report = null) => {
    setFormMode(mode);
    setSelectedReport(report);

    if (mode === "add") {
      resetForm();
    } else if (report) {
      setFormData({ ...report, created_by: username });
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      company_name: "",
      company_address: "",
      pin_code: "",
      industry_segment: "",
      customer_name: "",
      customer_mobile: "",
      customer_email: "",
      department: "",
      notes: "",
      attachment: null,
      created_by: username,
    });
  };

  // ============================
  // ⭐ SUBMIT FORM
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== null) form.append(k, v);
    });

    setLoading(true);

    try {
      if (formMode === "add") {
        await axios.post(`${API_BASE}/visitreport`, form);
      } else {
        await axios.put(`${API_BASE}/visitreport/${selectedReport.id}`, form);
      }

      fetchReports();
      closeModal();
      toast.success("✔ Saved successfully");
    } catch {
      toast.error("❌ Failed");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // ⭐ DELETE REPORT
  // ============================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;

    try {
      await axios.delete(`${API_BASE}/visitreport/${id}`);
      fetchReports();
    } catch {
      toast.error("❌ Delete failed");
    }
  };

  // ============================
  // ⭐ EXPORT TO EXCEL
  // ============================
  const exportToExcel = () => {
    if (!filteredReports.length) return toast.error("No data");

    const data = filteredReports.map((r) => ({
      "Customer Name": r.customer_name,
      "Company Name": r.company_name,
      Mobile: r.customer_mobile,
      Address: r.company_address,
      Industry: r.industry_segment,
      Email: r.customer_email,
      Department: r.department,
      Notes: r.notes,
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

  // ============================
  // ⭐ EXPORT TO PDF — FIXED FULL WIDTH
  // ============================
  const exportToPDF = () => {
    if (!filteredReports.length) return toast.error("No data");

    const doc = new jsPDF("landscape", "pt", "a4");

    const columns = [
      "Customer Name",
      "Company Name",
      "Mobile",
      "Address",
      "Industry",
      "Email",
      "Department",
      "Notes",
    ];

    const rows = filteredReports.map((item) => [
      item.customer_name,
      item.company_name,
      item.customer_mobile,
      item.company_address,
      item.industry_segment,
      item.customer_email,
      item.department,
      item.notes,
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      styles: { fontSize: 8, cellWidth: "wrap" },
      columnStyles: { 7: { cellWidth: 200 } },
      margin: { top: 20, left: 10, right: 10 },
      pageBreak: "auto",
    });

    doc.save("Visit_Reports.pdf");
  };

  // ======================================================
  // ⭐ UI RENDER
  // ======================================================
  return (
    <div className="container py-4">
      <ToastContainer />

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded-3 shadow-sm bg-warning-subtle">
        <h3 className="fw-bold text-dark">📋 Visit Reports</h3>

        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm" onClick={exportToExcel}>
            <FaFileExcel /> Excel
          </button>

          <button className="btn btn-danger btn-sm" onClick={exportToPDF}>
            <FaFilePdf /> PDF
          </button>

          <button className="btn btn-warning" onClick={() => openModal("add")}>
            <FaPlus /> Add Report
          </button>
        </div>
      </div>

      {/* SEARCH FILTERS */}
      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search Customer"
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
          />
        </div>

        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search Company"
            value={searchCompany}
            onChange={(e) => setSearchCompany(e.target.value)}
          />
        </div>

        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search Mobile"
            value={searchMobile}
            onChange={(e) => setSearchMobile(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow rounded-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="bg-warning">
              <tr>
                <th>Customer</th>
                <th>Company</th>
                <th>Mobile</th>
                <th>Attachment</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredReports.length ? (
                filteredReports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.customer_name}</td>
                    <td>{r.company_name}</td>
                    <td>{r.customer_mobile}</td>
                    <td>
                      {r.attachment ? (
                        <a
                          href={`${API_BASE}/visit_reports/${r.attachment}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FaPaperclip /> View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{r.notes}</td>

                    <td>
                      <FaEye
                        className="text-info mx-2"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal("view", r)}
                      />
                      <FaEdit
                        className="text-warning mx-2"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal("edit", r)}
                      />
                      <FaTrash
                        className="text-danger mx-2"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleDelete(r.id)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="text-center text-muted" colSpan="6">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4">
              <div className="modal-header bg-warning">
                <h5 className="modal-title">
                  {formMode === "add"
                    ? "Add Visit Report"
                    : formMode === "edit"
                    ? "Edit Visit Report"
                    : "View Visit Report"}
                </h5>
                <button className="btn-close" onClick={closeModal}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        name="customer_mobile"
                        className="form-control"
                        value={formData.customer_mobile}
                        onChange={handleMobileChange}
                        disabled={formMode === "view"}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Company Name
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        className="form-control"
                        value={formData.company_name}
                        onChange={handleChange}
                        disabled={formMode === "view"}
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Notes</label>
                      <textarea
                        name="notes"
                        className="form-control"
                        rows="3"
                        value={formData.notes}
                        onChange={handleChange}
                        disabled={formMode === "view"}
                      ></textarea>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-semibold">
                        Attachment
                      </label>
                      <input
                        type="file"
                        name="attachment"
                        className="form-control"
                        onChange={handleChange}
                        disabled={formMode === "view"}
                      />
                    </div>
                  </div>
                </div>

                {formMode !== "view" && (
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button className="btn btn-warning" disabled={loading}>
                      {loading ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitReportPage;
