import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const API_URL = "http://localhost:5000/api/tasks";
const API_EMPLOYEES = "http://localhost:5000/api/employee/all";

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showReworkModal, setShowReworkModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reworkNote, setReworkNote] = useState("");

  const batchOptions = [
    { value: "BATCH001", label: "Batch 001" },
    { value: "BATCH002", label: "Batch 002" },
    { value: "BATCH003", label: "Batch 003" },
    { value: "BATCH004", label: "Batch 004" },
  ];

  // ✅ Logged in user info
  const loggedInUser = localStorage.getItem("username") || "Admin User";
  const loggedInEmail = localStorage.getItem("email") || "admin@example.com";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    assignedTo: "",
    product_code: "",
    length: "",
    width: "",
    qty: "",
    batch_code: "",
    status: "Pending",
    note: "",
  });

  // ✅ Fetch Employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(API_EMPLOYEES);
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  // ✅ Fetch Tasks (Filtered by logged-in email)
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get(API_URL);
        // 🔍 Filter tasks only assigned by current user
        const filtered = res.data.filter(
          (task) => task.assignedByEmail === loggedInEmail
        );
        setTasks(filtered);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [loggedInEmail]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ Create new Task
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newTask = {
        ...formData,
        assignedBy: loggedInUser,
        assignedByEmail: loggedInEmail,
      };
      await axios.post(API_URL, newTask);
      alert("✅ Task created successfully!");
      setShowModal(false);
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        dueDate: "",
        assignedTo: "",
        product_code: "",
        length: "",
        width: "",
        qty: "",
        batch_code: "",
        status: "Pending",
        note: "",
      });
      // Refresh tasks and filter again
      const res = await axios.get(API_URL);
      const filtered = res.data.filter(
        (task) => task.assignedByEmail === loggedInEmail
      );
      setTasks(filtered);
    } catch (err) {
      console.error("Error saving task:", err);
      alert("❌ Failed to save task!");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Handle Rework Selection
  const handleStatusCheckChange = async (task, value) => {
    if (value === "Rework") {
      setSelectedTask(task);
      setShowReworkModal(true);
    } else if (value === "Completed") {
      try {
        await axios.put(`${API_URL}/${task.id}`, {
          status_check: "Completed",
        });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status_check: "Completed" } : t
          )
        );
        alert("✅ Task marked as completed and frozen.");
      } catch (err) {
        console.error("Error updating status_check:", err);
      }
    }
  };

  // ✅ Handle Rework Submit
  const handleReworkSubmit = async () => {
    try {
      if (!reworkNote.trim()) {
        alert("Please enter a rework note!");
        return;
      }

      await axios.put(`${API_URL}/${selectedTask.id}`, {
        status: "Pending",
        note: reworkNote,
        status_check: "Rework",
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id
            ? { ...task, status: "Pending", note: reworkNote, status_check: "Rework" }
            : task
        )
      );

      setShowReworkModal(false);
      setReworkNote("");
      setSelectedTask(null);
      alert("🔁 Task moved to Pending with Rework note.");
    } catch (err) {
      console.error("Error updating task for rework:", err);
      alert("❌ Failed to mark as Rework!");
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
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>📋 Task Management</h2>
        <Button onClick={() => setShowModal(true)} variant="warning">
          + Create Task
        </Button>
      </div>

      {loading ? (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
          <p>Loading tasks...</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead style={{ backgroundColor: "#ffeb99" }}> {/* 🟡 Yellow Header */}
            <tr>
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
              <th>Note</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  style={
                    task.status_check === "Completed"
                      ? { backgroundColor: "#fff6b3", pointerEvents: "none" } // 🟡 Freeze row + yellow
                      : {}
                  }
                >
                  <td>{task.title}</td>
                  <td>{task.description}</td>
                  <td>{task.priority}</td>
                  <td>{task.dueDate}</td>
                  <td>
                    <span
                      className={`badge ${
                        task.status === "Pending"
                          ? "bg-warning text-dark"
                          : "bg-success"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td>
                    {task.status === "Completed" ? (
                      <Form.Select
                        onChange={(e) =>
                          handleStatusCheckChange(task, e.target.value)
                        }
                        defaultValue={task.status_check || ""}
                        disabled={task.status_check === "Completed"} // 🟡 Disable select when completed
                      >
                        <option value="">-- Select --</option>
                        <option value="Completed">Completed</option>
                        <option value="Rework">Rework</option>
                      </Form.Select>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{task.product_code}</td>
                  <td>{task.length}</td>
                  <td>{task.width}</td>
                  <td>{task.qty}</td>
                  <td>{task.batch_code}</td>
                  <td>{task.assignedTo}</td>
                  <td>{task.assignedBy}</td>
                  <td>{task.note || "-"}</td>
                  <td>{formatDateTime(task.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="15" className="text-center">
                  No tasks found for your account.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* ✅ Create Task Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-3 mb-3">
                <Form.Label>Product Code</Form.Label>
                <Form.Control
                  name="product_code"
                  value={formData.product_code}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-2 mb-3">
                <Form.Label>Length</Form.Label>
                <Form.Control
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-2 mb-3">
                <Form.Label>Width</Form.Label>
                <Form.Control
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-2 mb-3">
                <Form.Label>Qty</Form.Label>
                <Form.Control
                  type="number"
                  name="qty"
                  value={formData.qty}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-3 mb-3">
                <Form.Label>Batch Code</Form.Label>
                <Form.Select
                  name="batch_code"
                  value={formData.batch_code}
                  onChange={handleChange}
                >
                  <option value="">-- Select Batch --</option>
                  {batchOptions.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Assign To</Form.Label>
              <Form.Select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Employee --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Note (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Add any initial note if needed..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Assigned By</Form.Label>
              <Form.Control type="text" value={loggedInUser} readOnly />
            </Form.Group>

            <Button type="submit" variant="warning" disabled={saving}>
              {saving ? <Spinner animation="border" size="sm" /> : "Save Task"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ✅ Rework Modal */}
      <Modal show={showReworkModal} onHide={() => setShowReworkModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🔁 Rework Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Enter Rework Note</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reworkNote}
              onChange={(e) => setReworkNote(e.target.value)}
              placeholder="Describe what needs to be reworked..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReworkModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleReworkSubmit}>
            Submit Rework
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TaskPage;
