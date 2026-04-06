import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Form, Spinner, Alert, Badge, Pagination, Card, Row, Col, Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { API_BASE } from "../config";

const API_URL = `${API_BASE}/tasks`;

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(10);
  
  // ✅ Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  
  // ✅ View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedViewTask, setSelectedViewTask] = useState(null);

  // ✅ Get logged-in user's email
  const loggedInEmail = localStorage.getItem("email");

  // ✅ Fetch tasks assigned to the logged-in user
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
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
        setFilteredTasks(userTasks);
        console.log("✅ Tasks loaded:", userTasks.length);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [loggedInEmail]);

  // ✅ Apply filters and search
  useEffect(() => {
    let filtered = [...tasks];
    
    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== "All") {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    
    // Apply date filter
    if (dateFilter !== "All") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        
        switch(dateFilter) {
          case "Today":
            return dueDate.toDateString() === today.toDateString();
          case "Tomorrow":
            return dueDate.toDateString() === tomorrow.toDateString();
          case "This Week":
            return dueDate >= today && dueDate <= weekFromNow;
          case "Overdue":
            return dueDate < today;
          default:
            return true;
        }
      });
    }
    
    // Apply search term - INCLUDES BRAND CODE AND BATCH NO
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.po_number?.toLowerCase().includes(searchLower) ||
        task.title?.toLowerCase().includes(searchLower) ||
        task.item_name?.toLowerCase().includes(searchLower) ||
        task.supplier_part_no?.toLowerCase().includes(searchLower) ||
        task.brand_code?.toLowerCase().includes(searchLower) ||
        task.batch_no?.toLowerCase().includes(searchLower) ||
        task.quotation_number?.toLowerCase().includes(searchLower) ||
        task.company_name?.toLowerCase().includes(searchLower) ||
        task.priority?.toLowerCase().includes(searchLower) ||
        task.status?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredTasks(filtered);
    setCurrentPage(1);
  }, [tasks, searchTerm, statusFilter, priorityFilter, dateFilter]);

  // ✅ Calculate statistics
  const taskStats = useMemo(() => {
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === "Pending").length,
      inProgress: tasks.filter(t => t.status === "In Progress").length,
      completed: tasks.filter(t => t.status === "Completed").length,
      highPriority: tasks.filter(t => t.priority === "High").length,
      overdue: tasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today && t.status !== "Completed";
      }).length
    };
    return stats;
  }, [tasks]);

  // ✅ Pagination calculations
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = useMemo(() => {
    return filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  }, [filteredTasks, indexOfFirstTask, indexOfLastTask]);
  
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

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
      
      // Update filtered tasks as well
      setFilteredTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: newStatus } : t
        )
      );
      
    } catch (err) {
      console.error("Error updating status:", err);
      setError("❌ Failed to update status.");
    }
  };

  // ✅ Handle View Task Details
  const handleViewTask = (task) => {
    console.log("View button clicked for task:", task);
    setSelectedViewTask(task);
    setShowViewModal(true);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ✅ Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // ✅ Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let number = 1; number <= totalPages; number++) {
        items.push(
          <Pagination.Item
            key={number}
            active={number === currentPage}
            onClick={() => handlePageChange(number)}
          >
            {number}
          </Pagination.Item>
        );
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) {
        items.push(
          <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
            1
          </Pagination.Item>
        );
        if (startPage > 2) {
          items.push(<Pagination.Ellipsis key="start-ellipsis" />);
        }
      }
      
      for (let number = startPage; number <= endPage; number++) {
        items.push(
          <Pagination.Item
            key={number}
            active={number === currentPage}
            onClick={() => handlePageChange(number)}
          >
            {number}
          </Pagination.Item>
        );
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          items.push(<Pagination.Ellipsis key="end-ellipsis" />);
        }
        items.push(
          <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </Pagination.Item>
        );
      }
    }
    
    return items;
  };

  // ✅ Reset all filters
  const resetFilters = () => {
    setStatusFilter("All");
    setPriorityFilter("All");
    setDateFilter("All");
    setSearchTerm("");
  };

  // ✅ Calculate the starting index for numbering
  const getTaskNumber = (index) => {
    return (currentPage - 1) * tasksPerPage + index + 1;
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>📋 My Assigned Tasks</h2>
        <Badge bg="info" className="p-2">
          {tasks.length} Active Tasks
        </Badge>
      </div>

      {/* ✅ Status Cards */}
      <Row className="mb-4">
        <Col md={2} sm={6} className="mb-3">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-primary fs-4">{taskStats.total}</Card.Title>
              <Card.Text className="text-muted mb-0">Total Tasks</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={6} className="mb-3">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-warning fs-4">{taskStats.pending}</Card.Title>
              <Card.Text className="text-muted mb-0">Pending</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={6} className="mb-3">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-info fs-4">{taskStats.inProgress}</Card.Title>
              <Card.Text className="text-muted mb-0">In Progress</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={6} className="mb-3">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-success fs-4">{taskStats.completed}</Card.Title>
              <Card.Text className="text-muted mb-0">Completed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={6} className="mb-3">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-danger fs-4">{taskStats.highPriority}</Card.Title>
              <Card.Text className="text-muted mb-0">High Priority</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={6} className="mb-3">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-danger fs-4">{taskStats.overdue}</Card.Title>
              <Card.Text className="text-muted mb-0">Overdue</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ✅ Search and Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            {/* Search Bar */}
            <Col md={4} className="mb-3">
              <Form.Group controlId="searchTasks">
                <Form.Label className="small fw-bold">Search Tasks</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by PO number, item, brand, batch, quotation, etc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            
            {/* Status Filter */}
            <Col md={2} className="mb-3">
              <Form.Group controlId="statusFilter">
                <Form.Label className="small fw-bold">Status</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            {/* Priority Filter */}
            <Col md={2} className="mb-3">
              <Form.Group controlId="priorityFilter">
                <Form.Label className="small fw-bold">Priority</Form.Label>
                <Form.Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="All">All Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            {/* Date Filter */}
            <Col md={2} className="mb-3">
              <Form.Group controlId="dateFilter">
                <Form.Label className="small fw-bold">Due Date</Form.Label>
                <Form.Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="All">All Dates</option>
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="This Week">This Week</option>
                  <option value="Overdue">Overdue</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            {/* Reset Button */}
            <Col md={2} className="mb-3 d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={resetFilters}
                className="w-100"
              >
                Reset Filters
              </Button>
            </Col>
          </Row>
          
          {/* Results Summary */}
          <div className="d-flex justify-content-between align-items-center mt-2">
            <Badge bg="info" className="p-2">
              Page {currentPage} of {totalPages} | Showing {currentTasks.length} of {filteredTasks.length} tasks
              {searchTerm && ` (filtered from ${tasks.length} total)`}
            </Badge>
            <small className="text-muted">
              {statusFilter !== "All" && <span className="me-2">Status: {statusFilter}</span>}
              {priorityFilter !== "All" && <span className="me-2">Priority: {priorityFilter}</span>}
              {dateFilter !== "All" && <span>Due: {dateFilter}</span>}
            </small>
          </div>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
          <p>Loading your tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <Card className="text-center shadow-sm">
          <Card.Body className="py-5">
            <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
            <h5 className="text-muted">No active tasks assigned to you</h5>
            <p className="text-muted">You'll see tasks here when they are assigned to you.</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* ✅ Updated Table with PO Number, Brand Code and Batch No columns */}
          <Table striped bordered hover responsive className="shadow-sm">
            <thead style={{ backgroundColor: "#ffeb99" }}>
              <tr>
                <th>#</th>
                <th>PO Number</th>
                <th>Item Name</th>
                <th>Brand Code</th>
                <th>Batch No</th>
                <th>Quotation No</th>
                <th>Company</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Quantity</th>
                <th>Assigned By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.length > 0 ? (
                currentTasks.map((task, index) => {
                  const isCompleted = task.status === "Completed";
                  return (
                    <tr
                      key={task.id}
                      style={
                        isCompleted
                          ? { backgroundColor: "#fff6b3" }
                          : {}
                      }
                    >
                      <td>{getTaskNumber(index)}</td>
                      <td>
                        <strong>{task.po_number || task.title}</strong>
                      </td>
                      <td>{task.item_name}</td>
                      <td>
                        {task.brand_code ? (
                          <Badge bg="primary">{task.brand_code}</Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {task.batch_no ? (
                          <Badge bg="secondary">{task.batch_no}</Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <Badge bg="info">
                          {task.quotation_number || "N/A"}
                        </Badge>
                      </td>
                      <td>{task.company_name || "N/A"}</td>
                      <td>
                        <Badge bg={
                          task.priority === "High" ? "danger" :
                          task.priority === "Medium" ? "warning" : "secondary"
                        }>
                          {task.priority || "Medium"}
                        </Badge>
                      </td>
                      <td>
                        {task.dueDate ? (
                          new Date(task.dueDate) < new Date() && task.status !== "Completed" ? (
                            <span className="text-danger fw-bold">{task.dueDate} ⚠️</span>
                          ) : (
                            task.dueDate
                          )
                        ) : "Not set"}
                      </td>
                      <td>
                        <Form.Select
                          value={task.status || "Pending"}
                          onChange={(e) => handleStatusChange(task, e.target.value)}
                          disabled={isCompleted}
                          size="sm"
                          style={{
                            minWidth: "120px",
                            ...(isCompleted ? { backgroundColor: "#e9ecef", cursor: "not-allowed" } : {})
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </Form.Select>
                      </td>
                      <td>{task.quantity || "N/A"}</td>
                      <td>
                        <div>
                          <div>{task.assignedBy || "N/A"}</div>
                          {task.assignedByEmail && (
                            <small className="text-muted">{task.assignedByEmail}</small>
                          )}
                        </div>
                      </td>
                      <td>{formatDateTime(task.createdAt)}</td>
                      <td>
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleViewTask(task)}
                          className="me-1"
                        >
                          👁️ View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="14" className="text-center py-4">
                    <div className="text-muted">
                      <i className="bi bi-inbox fs-1"></i>
                      <p className="mt-2">
                        {searchTerm || statusFilter !== "All" || priorityFilter !== "All" || dateFilter !== "All" 
                          ? "No tasks found matching your filters. Try adjusting your search criteria." 
                          : "No active tasks assigned to you."}
                      </p>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={resetFilters}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* ✅ Pagination - Fixed: Now properly displays when there are more than 10 tasks */}
          {filteredTasks.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div>
                <span className="text-muted">
                  Showing {currentTasks.length} of {filteredTasks.length} tasks
                  {searchTerm && ` (filtered from ${tasks.length} total)`}
                </span>
              </div>
              
              {filteredTasks.length > tasksPerPage && (
                <div>
                  <Pagination className="mb-0">
                    <Pagination.Prev
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                    {renderPaginationItems()}
                    <Pagination.Next
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
              
              <div>
                <span className="text-muted">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ✅ View Task Details Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>📋 Task Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedViewTask && (
            <div className="row">
              {/* Basic Information Card */}
              <div className="col-md-6 mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Header className="bg-primary text-white">
                    <h6 className="mb-0">Basic Information</h6>
                  </Card.Header>
                  <Card.Body>
                    <table className="table table-sm table-borderless mb-0">
                      <tbody>
                        <tr>
                          <th width="40%" className="text-muted">PO Number:</th>
                          <td><strong className="text-primary">{selectedViewTask.po_number || selectedViewTask.title}</strong></td>
                        </tr>
                        <tr>
                          <th className="text-muted">Description:</th>
                          <td>{selectedViewTask.description || "-"}</td>
                        </tr>
                        <tr>
                          <th className="text-muted">Status:</th>
                          <td>
                            <Badge bg={
                              selectedViewTask.status === "Pending" ? "warning" :
                              selectedViewTask.status === "In Progress" ? "info" : "success"
                            }>
                              {selectedViewTask.status}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <th className="text-muted">Priority:</th>
                          <td>
                            <Badge bg={
                              selectedViewTask.priority === "High" ? "danger" :
                              selectedViewTask.priority === "Medium" ? "warning" : "secondary"
                            }>
                              {selectedViewTask.priority}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <th className="text-muted">Due Date:</th>
                          <td>{selectedViewTask.dueDate || "-"}</td>
                        </tr>
                        <tr>
                          <th className="text-muted">Assigned To:</th>
                          <td>{selectedViewTask.assignedTo}</td>
                        </tr>
                        <tr>
                          <th className="text-muted">Assigned By:</th>
                          <td>{selectedViewTask.assignedBy}</td>
                        </tr>
                        <tr>
                          <th className="text-muted">Created At:</th>
                          <td>{formatDateTime(selectedViewTask.createdAt)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Quotation Details Card */}
              <div className="col-md-6 mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Header className="bg-info text-white">
                    <h6 className="mb-0">Quotation Details</h6>
                  </Card.Header>
                  <Card.Body>
                    <table className="table table-sm table-borderless mb-0">
                      <tbody>
                        <tr>
                          <th width="40%" className="text-muted">Quotation No:</th>
                          <td><Badge bg="info">{selectedViewTask.quotation_number || "N/A"}</Badge></td>
                        </tr>
                        <tr>
                          <th className="text-muted">Company:</th>
                          <td>{selectedViewTask.company_name || "N/A"}</td>
                        </tr>
                        {selectedViewTask.company_address && (
                          <tr>
                            <th className="text-muted">Company Address:</th>
                            <td className="small">{selectedViewTask.company_address}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Item Details Card with Brand/Batch */}
              <div className="col-md-6 mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Header className="bg-warning text-dark">
                    <h6 className="mb-0">Item Details</h6>
                  </Card.Header>
                  <Card.Body>
                    <table className="table table-sm table-borderless mb-0">
                      <tbody>
                        <tr>
                          <th width="40%" className="text-muted">Item Name:</th>
                          <td>{selectedViewTask.item_name}</td>
                        </tr>
                        <tr>
                          <th className="text-muted">Brand Code:</th>
                          <td>
                            {selectedViewTask.brand_code ? (
                              <Badge bg="primary">{selectedViewTask.brand_code}</Badge>
                            ) : "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="text-muted">Batch No:</th>
                          <td>
                            {selectedViewTask.batch_no ? (
                              <Badge bg="secondary">{selectedViewTask.batch_no}</Badge>
                            ) : "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="text-muted">Supplier Part No:</th>
                          <td>{selectedViewTask.supplier_part_no || "-"}</td>
                        </tr>
                        <tr>
                          <th className="text-muted">Cut Width:</th>
                          <td>{selectedViewTask.cut_width || "-"}</td>
                        </tr>
                        <tr>
                          <th className="text-muted">Length:</th>
                          <td>{selectedViewTask.length || "-"}</td>
                        </tr>
                        <tr>
                          <th className="text-muted">Quantity:</th>
                          <td>{selectedViewTask.quantity || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Additional Information Card */}
              <div className="col-md-6 mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Header className="bg-secondary text-white">
                    <h6 className="mb-0">Additional Information</h6>
                  </Card.Header>
                  <Card.Body>
                    <table className="table table-sm table-borderless mb-0">
                      <tbody>
                        <tr>
                          <th width="40%" className="text-muted">Note:</th>
                          <td>{selectedViewTask.note || "-"}</td>
                        </tr>
                        <tr>
                          <th className="text-muted">HSN/SAC:</th>
                          <td>{selectedViewTask.hsn_sac || "-"}</td>
                        </tr>
                        <tr>
                          <th className="text-muted">Unit:</th>
                          <td>{selectedViewTask.unit || "-"}</td>
                        </tr>
                        <tr>
                          <th className="text-muted">MRP:</th>
                          <td>{selectedViewTask.mrp ? `₹${selectedViewTask.mrp}` : "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TaskPage;