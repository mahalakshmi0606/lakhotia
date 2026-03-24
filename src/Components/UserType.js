import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlus, FaFilePdf, FaFileExcel } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { Table, Button, Modal, Form, Row, Col, InputGroup, Pagination, Badge } from "react-bootstrap";
import * as XLSX from "xlsx";

// ✅ FIXED IMPORTS
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000/api";
const DEFAULT_USER_TYPE = "Customer";

const UserTypePage = () => {
  const [userTypes, setUserTypes] = useState([]);
  const [filteredUserTypes, setFilteredUserTypes] = useState([]);
  const [paginatedUserTypes, setPaginatedUserTypes] = useState([]);

  const [search, setSearch] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [editId, setEditId] = useState(null);

  const [loading, setLoading] = useState(false);

  // ✅ Fetch all user types on mount
  useEffect(() => {
    fetchUserTypes();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [search, userTypes]);

  useEffect(() => {
    updatePagination();
  }, [filteredUserTypes, currentPage]);

  const fetchUserTypes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/usertype`);
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setUserTypes(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load user types!");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ name: e.target.value });
  };

  const handleSearch = () => {
    const value = search.toLowerCase();
    const filtered = userTypes.filter(
      (ut) =>
        ut.name?.toLowerCase().includes(value) ||
        ut.id?.toString().includes(value)
    );
    setFilteredUserTypes(filtered);
    setCurrentPage(1);
  };

  const updatePagination = () => {
    const total = filteredUserTypes.length;
    const pages = Math.ceil(total / itemsPerPage);
    setTotalPages(pages || 1);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedUserTypes(filteredUserTypes.slice(startIndex, endIndex));
  };

  const resetForm = () => {
    setFormData({ name: "" });
    setEditId(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter user type name");
      return;
    }

    try {
      let res;
      if (editId !== null) {
        res = await axios.put(`${API_BASE}/usertype/${editId}`, formData);
      } else {
        res = await axios.post(`${API_BASE}/usertype`, formData);
      }

      if (res.data.success) {
        toast.success(res.data.message);
        fetchUserTypes();
        resetForm();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting data!");
    }
  };

  const handleDelete = async (ut) => {
    if (ut.name === DEFAULT_USER_TYPE) {
      toast.warning("Default user type cannot be deleted");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user type?")) return;

    try {
      const res = await axios.delete(`${API_BASE}/usertype/${ut.id}`);
      if (res.data.success) {
        toast.success("User type deleted!");
        fetchUserTypes();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting user type!");
    }
  };

  const handleEdit = (ut) => {
    if (ut.name === DEFAULT_USER_TYPE) {
      toast.info("Default user type cannot be edited");
      return;
    }
    setFormData({ name: ut.name });
    setEditId(ut.id);
    setFormOpen(true);
  };

  // ---------------------- EXPORTS --------------------------

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredUserTypes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User Types");
    XLSX.writeFile(wb, "user_types.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("User Types List", 14, 15);

    autoTable(doc, {
      head: [["ID", "User Type Name"]],
      body: filteredUserTypes.map((ut) => [ut.id, ut.name]),
      startY: 25,
    });

    doc.save("user_types.pdf");
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold">User Types Management</h3>

        <Button variant="warning" onClick={() => setFormOpen(true)}>
          <FaPlus className="me-2" /> Add User Type
        </Button>
      </div>

      <Row className="mb-3">
        <Col md={4}>
          <InputGroup>
            <Form.Control
              placeholder="Search user types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Col>

        <Col md="auto">
          <Button variant="success" className="me-2" onClick={exportExcel}>
            <FaFileExcel className="me-1" /> Excel
          </Button>

          <Button variant="danger" onClick={exportPDF}>
            <FaFilePdf className="me-1" /> PDF
          </Button>
        </Col>
      </Row>

      <div className="table-responsive">
        <Table bordered hover striped>
          <thead style={{ background: "#fff3cd" }}>
            <tr className="text-center">
              <th>ID</th>
              <th>User Type Name</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUserTypes.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center text-muted">
                  No user types found
                </td>
              </tr>
            )}

            {paginatedUserTypes.map((ut) => (
              <tr key={ut.id} className="text-center">
                <td>{ut.id}</td>
                <td>
                  {ut.name}
                  {ut.name === DEFAULT_USER_TYPE && (
                    <Badge bg="secondary" className="ms-2">Default</Badge>
                  )}
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="warning"
                    className="me-2"
                    disabled={ut.name === DEFAULT_USER_TYPE}
                    onClick={() => handleEdit(ut)}
                  >
                    <FaEdit />
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    disabled={ut.name === DEFAULT_USER_TYPE}
                    onClick={() => handleDelete(ut)}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredUserTypes.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredUserTypes.length)} of{" "}
            {filteredUserTypes.length} entries
          </div>
          <Pagination className="mb-0">
            {[...Array(totalPages)].map((_, i) => (
              <Pagination.Item
                key={i}
                active={i + 1 === currentPage}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </div>
      )}

      {/* FORM MODAL */}
      <Modal show={formOpen} onHide={resetForm} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editId ? "Edit User Type" : "Add User Type"}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>User Type Name</Form.Label>
            <Form.Control
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter user type name"
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-between mt-3">
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>

            <Button variant="warning" onClick={handleSubmit}>
              {editId ? "Update" : "Add"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default UserTypePage;
