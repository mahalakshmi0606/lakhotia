import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/tasks";

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Get logged-in user's email
  const loggedInEmail = localStorage.getItem("email");

  // ✅ Fetch tasks assigned to the logged-in user
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get(API_URL);
        const allTasks = res.data;

        // ✅ Filter: only show tasks assigned to user and not completed (status_check)
        const userTasks = allTasks.filter(
          (task) =>
            task.assignedTo &&
            loggedInEmail &&
            task.assignedTo.toLowerCase() === loggedInEmail.toLowerCase() &&
            task.status_check !== "Completed" // 👈 hide completed ones
        );

        setTasks(userTasks);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [loggedInEmail]);

  // ✅ Allowed forward status transitions
  const nextAllowedStatus = {
    Pending: ["Pending", "In Progress"],
    "In Progress": ["In Progress", "Completed"],
    Completed: ["Completed"], // freeze once completed
  };

  // ✅ Handle status change
  const handleStatusChange = async (task, newStatus) => {
    const allowedStatuses = nextAllowedStatus[task.status] || [];

    if (!allowedStatuses.includes(newStatus)) {
      alert("⚠️ You cannot move the task back to a previous stage.");
      return;
    }

    if (task.status === "Completed") {
      alert("✅ Task already completed and frozen.");
      return;
    }

    try {
      await axios.put(`${API_URL}/${task.id}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert("❌ Failed to update status.");
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📋 My Assigned Tasks</h2>

      {loading ? (
        <p style={styles.loading}>Loading your tasks...</p>
      ) : tasks.length === 0 ? (
        <p style={styles.noTasks}>No active tasks assigned to you.</p>
      ) : (
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Status</th>
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
            {tasks.map((task) => {
              const isCompleted = task.status === "Completed";
              return (
                <tr
                  key={task.id}
                  style={{
                    ...styles.row,
                    ...(isCompleted ? styles.completedRow : {}),
                  }}
                >
                  <td>{task.id}</td>
                  <td>{task.title}</td>
                  <td>{task.description}</td>
                  <td>{task.priority}</td>
                  <td>{task.dueDate}</td>
                  <td>
                    <select
                      value={task.status || "Pending"}
                      onChange={(e) =>
                        handleStatusChange(task, e.target.value)
                      }
                      disabled={isCompleted}
                      style={{
                        ...styles.select,
                        ...(isCompleted ? styles.disabledSelect : {}),
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
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
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ✅ Inline CSS styles
const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    marginBottom: "20px",
    color: "#333",
  },
  loading: {
    textAlign: "center",
    fontSize: "18px",
    color: "#555",
  },
  noTasks: {
    textAlign: "center",
    fontSize: "18px",
    color: "#777",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "center",
    boxShadow: "0 0 8px rgba(0, 0, 0, 0.1)",
  },
  tableHeader: {
    backgroundColor: "#FFD700",
    color: "#000",
  },
  row: {
    borderBottom: "1px solid #ddd",
    transition: "background 0.3s",
  },
  completedRow: {
    backgroundColor: "#e6e6e6",
    color: "#777",
    pointerEvents: "none",
    opacity: 0.7,
  },
  select: {
    padding: "5px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  disabledSelect: {
    backgroundColor: "#f0f0f0",
    color: "#888",
    cursor: "not-allowed",
  },
};

export default TaskPage;
