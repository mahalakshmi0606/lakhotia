import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/tasks";

const AdminTaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch all tasks from backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get(API_URL);
        setTasks(res.data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // ✅ Format date
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ✅ Filter tasks by search term
  const filteredTasks = tasks.filter((task) => {
    const term = searchTerm.toLowerCase();
    return (
      task.title?.toLowerCase().includes(term) ||
      task.assignedTo?.toLowerCase().includes(term) ||
      task.status?.toLowerCase().includes(term)
    );
  });

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Admin Task report</h2>

      {/* 🔍 Search Bar */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by title, assigned to, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {loading ? (
        <p style={styles.loading}>Loading tasks...</p>
      ) : filteredTasks.length === 0 ? (
        <p style={styles.noData}>No matching tasks found.</p>
      ) : (
        <table style={styles.table}>
          <thead style={styles.header}>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Status Check</th>
              <th>Product Code</th>
              <th>Length</th>
              <th>Width</th>
              <th>Qty</th>
              <th>Batch Code</th>
              <th>Assigned To</th>
              <th>Assigned By</th>
              <th>Assigned By Email</th>
              <th>Note</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id} style={styles.row}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>{task.description}</td>
                <td>{task.priority}</td>
                <td>{task.dueDate}</td>
                <td>{task.status}</td>
                <td>{task.status_check || "-"}</td>
                <td>{task.product_code}</td>
                <td>{task.length}</td>
                <td>{task.width}</td>
                <td>{task.qty}</td>
                <td>{task.batch_code}</td>
                <td>{task.assignedTo}</td>
                <td>{task.assignedBy}</td>
                <td>{task.assignedByEmail}</td>
                <td>{task.note || "-"}</td>
                <td>{formatDateTime(task.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ✅ Inline Styles
const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fafafa",
    minHeight: "100vh",
  },
  heading: {
    marginBottom: "15px",
    color: "#333",
  },
  searchContainer: {
    marginBottom: "15px",
    textAlign: "right",
  },
  searchInput: {
    padding: "8px 12px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    width: "300px",
    fontSize: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    boxShadow: "0 0 8px rgba(0,0,0,0.1)",
  },
  header: {
    backgroundColor: "#FFD700",
    color: "#000",
    textAlign: "center",
  },
  row: {
    borderBottom: "1px solid #ddd",
    textAlign: "center",
    backgroundColor: "#fff",
    transition: "background 0.2s",
  },
  loading: {
    textAlign: "center",
    color: "#555",
    fontSize: "18px",
  },
  noData: {
    textAlign: "center",
    color: "#777",
    fontSize: "16px",
  },
};

export default AdminTaskPage;
