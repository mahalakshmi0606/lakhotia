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
    status: "Provided", // DEFAULT STATUS
    deduct_month: "",   // NEW FIELD
    deducted_time: "",  // NEW FIELD
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
    const employee = employees.find((emp) => emp.email === selectedEmail);

    setFormData((prev) => ({
      ...prev,
      email: selectedEmail,
      name: employee?.name || "",
      department: employee?.department || "",
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString(),
    }));
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // ⭐ Status Change Update
  const handleStatusChange = async (id, newStatus) => {
    let payload = { status: newStatus };

    if (newStatus === "Deducted This Month") {
      const month = prompt("Enter deduction month (YYYY-MM):");

      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        toast.error("Invalid month format");
        return;
      }

      payload.deduct_month = month;
      payload.deducted_time = new Date().toLocaleString();
    }

    try {
      await axios.put(`${API_ADVANCE}/${id}`, payload);
      toast.success("Status updated successfully");
      fetchAdvances();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString(),
    };

    try {
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
        status: "Provided",
        deduct_month: "",
        deducted_time: "",
      });

      fetchAdvances();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit advance");
    }
  };

  const handleEdit = (advance) => {
    if (advance.status === "Deducted This Month") {
      toast.error("Deducted entries cannot be edited");
      return;
    }

    setEditingId(advance.id);
    setFormData(advance);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const adv = advances.find((a) => a.id === id);
    if (adv.status === "Deducted This Month") {
      toast.error("Deducted entries cannot be deleted");
      return;
    }

    if (window.confirm("Do you want to delete this entry?")) {
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

  return (
    <div style={styles.page}>
      <ToastContainer position="top-right" autoClose={2000} />

      <div style={styles.header}>
        <h2 style={styles.title}>💰 Employee Advance Request</h2>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>
          <FaPlus /> New Request
        </button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Email</th>
            <th>Name</th>
            <th>Dept</th>
            <th>Amount</th>
            <th>Reason</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Deduct Month</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {advances.map((a, index) => (
            <tr key={a.id}>
              <td>{index + 1}</td>
              <td>{a.email}</td>
              <td>{a.name}</td>
              <td>{a.department}</td>
              <td>₹{a.amount}</td>
              <td>{a.reason}</td>
              <td>{a.date}</td>
              <td>{a.time}</td>

              <td>
                <select
                  value={a.status}
                  onChange={(e) => handleStatusChange(a.id, e.target.value)}
                  disabled={a.status === "Deducted This Month"}
                  style={styles.status(a.status)}
                >
                  <option value="Provided">Provided</option>
                  <option value="Deducted This Month">Deducted This Month</option>
                  <option value="Deduct Next Month">Deduct Next Month</option>
                </select>
              </td>

              <td>{a.deduct_month || "-"}</td>

              <td>
                {a.status === "Deducted This Month" ? (
                  <FaEye style={styles.iconGreen} />
                ) : (
                  <>
                    <FaEdit
                      style={styles.iconBlue}
                      onClick={() => handleEdit(a)}
                    />
                    <FaTrash
                      style={styles.iconRed}
                      onClick={() => handleDelete(a.id)}
                    />
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ textAlign: "center" }}>
              {editingId ? "Edit Advance" : "New Advance"}
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
                <input type="text" value={formData.name} readOnly style={styles.input} />
              </div>

              <div style={styles.formGroup}>
                <label>Department</label>
                <input type="text" value={formData.department} readOnly style={styles.input} />
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
  page: { padding: "20px", fontFamily: "Poppins" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: "22px", fontWeight: "bold" },
  addBtn: {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    border: "none",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 20,
  },
  status: (status) => ({
    padding: "6px",
    borderRadius: 6,
    background:
      status === "Provided"
        ? "#d1ecf1"
        : status === "Deducted This Month"
        ? "#f8d7da"
        : "#fff3cd",
    color:
      status === "Provided"
        ? "#0c5460"
        : status === "Deducted This Month"
        ? "#721c24"
        : "#856404",
  }),
  iconBlue: { color: "#007bff", cursor: "pointer", marginRight: 8 },
  iconRed: { color: "#dc3545", cursor: "pointer" },
  iconGreen: { color: "#28a745", cursor: "pointer" },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "#fff",
    padding: 25,
    borderRadius: 12,
    width: 400,
  },
  input: {
    width: "100%",
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  textarea: {
    width: "100%",
    height: 80,
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  formGroup: { marginBottom: 12 },
  submitBtn: {
    backgroundColor: "#28a745",
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    color: "#fff",
    marginRight: 10,
  },
  cancelBtn: {
    backgroundColor: "#dc3545",
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    color: "#fff",
  },
};

export default AdvancePage;
