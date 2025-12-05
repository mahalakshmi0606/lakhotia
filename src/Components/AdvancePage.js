import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaEye } from "react-icons/fa";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_ADVANCE = "http://localhost:5000/api/advance";
const API_EMPLOYEE = "http://localhost:5000/api/employee/all";

const AdvancePage = () => {
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    department: "",
    amount: "",
    reason: "",
    date: "",
    time: "",
    status: "Pending",
  });

  useEffect(() => {
    fetchEmployees();
    fetchAdvances();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(API_EMPLOYEE);
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch employees");
    }
  };

  const fetchAdvances = async () => {
    try {
      const res = await axios.get(API_ADVANCE);
      setAdvances(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch advances");
    }
  };

  const handleEmailChange = (e) => {
    const selectedEmail = e.target.value;
    setFormData((prev) => ({ ...prev, email: selectedEmail }));

    const emp = employees.find((emp) => emp.email === selectedEmail);
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        name: emp.name,
        department: emp.department,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString(),
      }));
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString(),
      };

      if (editingId) {
        await axios.put(`${API_ADVANCE}/${editingId}`, payload);
        toast.success("Advance updated successfully");
      } else {
        await axios.post(API_ADVANCE, payload);
        toast.success("Advance request submitted successfully");
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        email: "",
        name: "",
        department: "",
        amount: "",
        reason: "",
        date: "",
        time: "",
        status: "Pending",
      });
      fetchAdvances();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit advance");
    }
  };

  const handleEdit = (advance) => {
    setFormData(advance);
    setEditingId(advance.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this advance?")) {
      try {
        await axios.delete(`${API_ADVANCE}/${id}`);
        toast.success("Advance deleted successfully");
        fetchAdvances();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete advance");
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API_ADVANCE}/${id}`, { status: newStatus });
      toast.success("Status updated successfully");
      fetchAdvances();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  return (
    <div style={styles.page}>
      <ToastContainer position="top-right" autoClose={2000} />

      <div style={styles.header}>
        <h2 style={styles.title}>💰 Employee Advance Request</h2>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>
          <FaPlus /> New Request
        </button>
      </div>

      {/* Table Section */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Department</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>Reason</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Time</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {advances.length > 0 ? (
            advances.map((a, index) => (
              <tr key={a.id}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{a.email}</td>
                <td style={styles.td}>{a.name}</td>
                <td style={styles.td}>{a.department}</td>
                <td style={styles.td}>₹{a.amount}</td>
                <td style={styles.td}>{a.reason}</td>
                <td style={styles.td}>{a.date}</td>
                <td style={styles.td}>{a.time}</td>
                <td style={styles.td}>
                  <select
                    value={a.status}
                    onChange={(e) =>
                      handleStatusChange(a.id, e.target.value)
                    }
                    style={{
                      padding: "5px 8px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      backgroundColor:
                        a.status === "Pending"
                          ? "#fff3cd"
                          : a.status === "Provided"
                          ? "#d4edda"
                          : "#f8d7da",
                      color:
                        a.status === "Pending"
                          ? "#856404"
                          : a.status === "Provided"
                          ? "#155724"
                          : "#721c24",
                      fontWeight: "bold",
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Provided">Provided</option>
                    <option value="Deducted">Deducted</option>
                  </select>
                </td>
                <td style={styles.td}>
                  {a.status === "Pending" ? (
                    <>
                      <FaEdit
                        style={{ ...styles.icon, color: "#007bff" }}
                        onClick={() => handleEdit(a)}
                      />
                      <FaTrash
                        style={{ ...styles.icon, color: "#dc3545" }}
                        onClick={() => handleDelete(a.id)}
                      />
                    </>
                  ) : (
                    <FaEye style={{ ...styles.icon, color: "#28a745" }} />
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" style={{ textAlign: "center", padding: "15px" }}>
                No advance requests found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Popup Modal Form */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ textAlign: "center", marginBottom: "15px" }}>
              {editingId ? "Edit Advance" : "New Advance Request"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Email</label>
                <select
                  name="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  required
                  style={styles.input}
                >
                  <option value="">Select Email</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.email}>
                      {emp.email}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  readOnly
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Department</label>
                <input
                  type="text"
                  value={formData.department}
                  readOnly
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Reason</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  style={styles.textarea}
                />
              </div>

              <div style={{ textAlign: "center", marginTop: "15px" }}>
                <button type="submit" style={styles.submitBtn}>
                  {editingId ? "Update" : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { padding: "20px", fontFamily: "Poppins, sans-serif" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#333" },
  addBtn: {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "8px 14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
  th: {
    border: "1px solid #ddd",
    padding: "10px",
    backgroundColor: "#f1f1f1",
  },
  td: {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "center",
  },
  icon: { margin: "0 5px", cursor: "pointer" },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    padding: "25px",
    borderRadius: "12px",
    width: "400px",
    boxShadow: "0 0 15px rgba(0,0,0,0.3)",
  },
  formGroup: { marginBottom: "10px" },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  textarea: {
    width: "100%",
    height: "80px",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  submitBtn: {
    backgroundColor: "#28a745",
    color: "#fff",
    padding: "8px 16px",
    border: "none",
    borderRadius: "8px",
    marginRight: "10px",
    cursor: "pointer",
  },
  cancelBtn: {
    backgroundColor: "#dc3545",
    color: "#fff",
    padding: "8px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default AdvancePage;
