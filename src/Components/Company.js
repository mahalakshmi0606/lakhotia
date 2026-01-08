import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaEye, 
  FaFilePdf, 
  FaFileExcel, 
  FaSearch,
  FaChevronLeft,
  FaChevronRight 
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { Table, Button, Modal, Form, Row, Col, InputGroup, Pagination } from "react-bootstrap";
import * as XLSX from "xlsx";

// ✅ FIXED IMPORTS
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000/api";

const CompanyPage = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [paginatedCompanies, setPaginatedCompanies] = useState([]);

  const [industryOptions, setIndustryOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);

  const [search, setSearch] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    pinCode: "",
    industrySegment: "",
    customerName: "",
    customerMobile: "",
    customerEmail: "",
    department: "",
    personalMobile: "",
    personalEmail: "",
    // ✅ NEW FIELD
    gstNumber: "",
  });

  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
    fetchIndustrySegments();
    fetchDepartments();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [search, companies]);

  useEffect(() => {
    updatePagination();
  }, [filteredCompanies, currentPage]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/company`);
      const data = Array.isArray(res.data) ? res.data : [];
      setCompanies(data);
    } catch {
      toast.error("Failed to load companies");
    }
    setLoading(false);
  };

  const fetchIndustrySegments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/industrial_segmentation/all`);
      setIndustryOptions(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load Industry Segments");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/department/all`);
      setDepartmentOptions(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load Departments");
    }
  };

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const nextStep = () => setStep((s) => Math.min(2, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleSearch = () => {
    const value = search.toLowerCase().trim();
    
    if (!value) {
      setFilteredCompanies(companies);
      setCurrentPage(1);
      return;
    }

    const filtered = companies.filter((c) => {
      // Check all searchable fields including GST
      return (
        (c.companyName && c.companyName.toLowerCase().includes(value)) ||
        (c.customerName && c.customerName.toLowerCase().includes(value)) ||
        (c.industrySegment && c.industrySegment.toLowerCase().includes(value)) ||
        (c.pinCode && c.pinCode.toString().includes(value)) ||
        (c.companyAddress && c.companyAddress.toLowerCase().includes(value)) ||
        (c.customerMobile && c.customerMobile.includes(value)) ||
        (c.customerEmail && c.customerEmail.toLowerCase().includes(value)) ||
        (c.department && c.department.toLowerCase().includes(value)) ||
        (c.personalMobile && c.personalMobile.includes(value)) ||
        (c.personalEmail && c.personalEmail.toLowerCase().includes(value)) ||
        (c.gstNumber && c.gstNumber.toLowerCase().includes(value)) // ✅ NEW SEARCH FIELD
      );
    });
    
    setFilteredCompanies(filtered);
    setCurrentPage(1); // Reset to first page on search
  };

  const updatePagination = () => {
    const total = filteredCompanies.length;
    const pages = Math.ceil(total / itemsPerPage);
    setTotalPages(pages || 1);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredCompanies.slice(startIndex, endIndex);
    setPaginatedCompanies(paginatedData);
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      companyAddress: "",
      pinCode: "",
      industrySegment: "",
      customerName: "",
      customerMobile: "",
      customerEmail: "",
      department: "",
      personalMobile: "",
      personalEmail: "",
      // ✅ NEW FIELD
      gstNumber: "",
    });
    setEditId(null);
    setStep(1);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName || !formData.companyAddress) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      if (editId) {
        await axios.put(`${API_BASE}/company/${editId}`, formData);
        toast.success("Company updated");
      } else {
        await axios.post(`${API_BASE}/company`, formData);
        toast.success("Company added");
      }
      fetchCompanies();
      resetForm();
    } catch (err) {
      toast.error("Failed to save company");
    }
  };

  const handleEdit = (comp) => {
    setFormData({ ...comp });
    setEditId(comp.id);
    setStep(1);
    setFormOpen(true);
  };

  const handleDelete = async (comp) => {
    if (!window.confirm("Delete this company?")) return;

    try {
      await axios.delete(`${API_BASE}/company/${comp.id}`);
      toast.success("Company deleted");
      fetchCompanies();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleView = async (comp) => {
    try {
      const res = await axios.get(`${API_BASE}/company/${comp.id}`);
      setViewData(res.data);
      setViewOpen(true);
    } catch {
      toast.error("Failed to fetch details");
    }
  };

  // Handle Enter key press for search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearch("");
  };

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      />
    );

    // First page
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => goToPage(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === currentPage}
          onClick={() => goToPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" />);
      }
      items.push(
        <Pagination.Item 
          key={totalPages} 
          onClick={() => goToPage(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    );

    return items;
  };

  // ---------------------- EXPORTS --------------------------

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCompanies);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Companies");
    XLSX.writeFile(wb, "companies.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("Company List", 14, 15);

    const tableColumn = ["Company Name", "GST Number", "Industry", "Customer", "Mobile", "Department", "Pin Code", "Address"];

    const tableRows = filteredCompanies.map((c) => [
      c.companyName || "",
      c.gstNumber || "", // ✅ NEW COLUMN
      c.industrySegment || "",
      c.customerName || "",
      c.customerMobile || "",
      c.department || "",
      c.pinCode || "",
      c.companyAddress ? c.companyAddress.substring(0, 25) + "..." : "",
    ]);

    // ✅ FIXED PDF TABLE
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      headStyles: {
        fillColor: [255, 243, 205],
        textColor: [0, 0, 0],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 }, // GST column
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18 },
        5: { cellWidth: 22 },
        6: { cellWidth: 15 },
        7: { cellWidth: 35 },
      },
    });

    doc.save("companies.pdf");
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold">Company Management</h3>

        <Button variant="warning" onClick={() => setFormOpen(true)}>
          <FaPlus className="me-2" /> Add Company
        </Button>
      </div>

      <Row className="mb-3">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text style={{ background: "#fff3cd", borderColor: "#ffc107" }}>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search "
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ borderColor: "#ffc107" }}
            />
            {search && (
              <Button 
                variant="outline-secondary" 
                onClick={handleClearSearch}
                title="Clear search"
              >
                ✕
              </Button>
            )}
            <Button 
              variant="warning" 
              onClick={handleSearch}
              style={{ borderColor: "#ffc107" }}
            >
              Search
            </Button>
          </InputGroup>
        </Col>

        <Col md="auto" className="mt-2 mt-md-0">
          <Button variant="success" className="me-2" onClick={exportExcel}>
            <FaFileExcel className="me-1" /> Excel
          </Button>

          <Button variant="danger" onClick={exportPDF}>
            <FaFilePdf className="me-1" /> PDF
          </Button>
        </Col>
      </Row>

      {/* Search Results Info */}
      {search && (
        <div className="alert alert-warning py-2 mb-3" role="alert">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <FaSearch className="me-2" />
              Found <strong>{filteredCompanies.length}</strong> companies matching "<strong>{search}</strong>"
              {filteredCompanies.length === 0 && " - Try a different search term"}
            </div>
            {filteredCompanies.length > 0 && (
              <Button 
                variant="outline-warning" 
                size="sm" 
                onClick={handleClearSearch}
              >
                Clear Search
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="table-responsive">
        <Table bordered hover striped>
          <thead style={{ background: "#fff3cd" }}>
            <tr className="text-center">
              <th>Company</th>
              <th>GST Number</th> {/* ✅ NEW COLUMN */}
              <th>Industry</th>
              <th>Customer</th>
              <th>Mobile</th>
              <th>Department</th>
              <th>Pin Code</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center"> {/* ✅ Updated colspan */}
                  <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedCompanies.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4"> {/* ✅ Updated colspan */}
                  {search ? "No companies match your search criteria" : "No companies found"}
                </td>
              </tr>
            ) : (
              paginatedCompanies.map((c) => (
                <tr key={c.id} className="text-center">
                  <td>
                    <div className="fw-semibold">{c.companyName}</div>
                    <small className="text-muted">{c.companyAddress ? c.companyAddress.substring(0, 40) + "..." : ""}</small>
                  </td>
                  <td>
                    <span className="badge bg-info text-dark">{c.gstNumber || "N/A"}</span> {/* ✅ GST Display */}
                  </td>
                  <td>{c.industrySegment}</td>
                  <td>
                    <div>{c.customerName}</div>
                    <small className="text-muted">{c.customerEmail}</small>
                  </td>
                  <td>{c.customerMobile}</td>
                  <td>{c.department}</td>
                  <td>
                    <span className="badge bg-light text-dark">{c.pinCode}</span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-center">
                      <Button size="sm" variant="outline-info" className="me-2" onClick={() => handleView(c)} title="View Details">
                        <FaEye />
                      </Button>

                      <Button size="sm" variant="outline-warning" className="me-2" onClick={() => handleEdit(c)} title="Edit">
                        <FaEdit />
                      </Button>

                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete(c)} title="Delete">
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredCompanies.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCompanies.length)} of {filteredCompanies.length} entries
            {search && " (filtered)"}
          </div>
          <Pagination className="mb-0">
            {renderPaginationItems()}
          </Pagination>
        </div>
      )}

      {/* FORM MODAL */}
      <Modal show={formOpen} onHide={() => setFormOpen(false)} centered size="lg">
        <Modal.Header closeButton style={{ background: "#fff3cd" }}>
          <Modal.Title>{editId ? "Edit Company" : "Add Company"} — Step {step}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {step === 1 && (
            <>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Company Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      name="companyName" 
                      value={formData.companyName} 
                      onChange={handleChange} 
                      required 
                      placeholder="Enter company name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">GST Number</Form.Label>
                    <Form.Control 
                      name="gstNumber" // ✅ NEW FIELD
                      value={formData.gstNumber} 
                      onChange={handleChange} 
                      placeholder="Enter GST number (e.g., 27ABCDE1234F1Z5)"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Pin Code</Form.Label>
                    <Form.Control 
                      name="pinCode" 
                      value={formData.pinCode} 
                      onChange={handleChange} 
                      placeholder="Enter pin code"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Industry Segment</Form.Label>
                    <Form.Select name="industrySegment" value={formData.industrySegment} onChange={handleChange}>
                      <option value="">Select Industry Segment</option>
                      {industryOptions.map((i) => (
                        <option key={i.id} value={i.name}>
                          {i.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Company Address <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3}
                  name="companyAddress" 
                  value={formData.companyAddress} 
                  onChange={handleChange} 
                  required 
                  placeholder="Enter full address"
                />
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button className="px-4" variant="warning" onClick={nextStep}>
                  Next <FaChevronRight className="ms-1" />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h6 className="mb-3 fw-semibold">Customer Details</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Customer Name</Form.Label>
                    <Form.Control 
                      name="customerName" 
                      value={formData.customerName} 
                      onChange={handleChange} 
                      placeholder="Enter customer name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Customer Mobile</Form.Label>
                    <Form.Control 
                      name="customerMobile" 
                      value={formData.customerMobile} 
                      onChange={handleChange} 
                      placeholder="Enter mobile number"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Customer Email</Form.Label>
                <Form.Control 
                  type="email"
                  name="customerEmail" 
                  value={formData.customerEmail} 
                  onChange={handleChange} 
                  placeholder="Enter email address"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Department</Form.Label>
                <Form.Select name="department" value={formData.department} onChange={handleChange}>
                  <option value="">Select Department</option>
                  {departmentOptions.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <h6 className="mb-3 fw-semibold mt-4">Personal Details</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Personal Mobile</Form.Label>
                    <Form.Control 
                      name="personalMobile" 
                      value={formData.personalMobile} 
                      onChange={handleChange} 
                      placeholder="Enter personal mobile"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Personal Email</Form.Label>
                    <Form.Control 
                      type="email"
                      name="personalEmail" 
                      value={formData.personalEmail} 
                      onChange={handleChange} 
                      placeholder="Enter personal email"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={prevStep}>
                  <FaChevronLeft className="me-1" /> Previous
                </Button>

                <div>
                  <Button variant="outline-secondary" className="me-2" onClick={() => setFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="warning" onClick={handleSubmit}>
                    {editId ? "Update Company" : "Add Company"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* VIEW MODAL */}
      <Modal show={viewOpen} onHide={() => setViewOpen(false)} centered size="lg">
        <Modal.Header closeButton style={{ background: "#fff3cd" }}>
          <Modal.Title>Company Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {viewData && (
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <h6 className="fw-semibold text-warning">Company Information</h6>
                  <p><strong>Company Name:</strong> {viewData.companyName || "N/A"}</p>
                  <p><strong>GST Number:</strong> {viewData.gstNumber || "N/A"}</p> {/* ✅ NEW FIELD */}
                  <p><strong>Address:</strong> {viewData.companyAddress || "N/A"}</p>
                  <p><strong>Pin Code:</strong> {viewData.pinCode || "N/A"}</p>
                  <p><strong>Industry Segment:</strong> {viewData.industrySegment || "N/A"}</p>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <h6 className="fw-semibold text-warning">Customer Information</h6>
                  <p><strong>Customer Name:</strong> {viewData.customerName || "N/A"}</p>
                  <p><strong>Mobile:</strong> {viewData.customerMobile || "N/A"}</p>
                  <p><strong>Email:</strong> {viewData.customerEmail || "N/A"}</p>
                  <p><strong>Department:</strong> {viewData.department || "N/A"}</p>
                </div>
              </Col>
              <Col md={12}>
                <div className="mb-3">
                  <h6 className="fw-semibold text-warning">Personal Information</h6>
                  <p><strong>Personal Mobile:</strong> {viewData.personalMobile || "N/A"}</p>
                  <p><strong>Personal Email:</strong> {viewData.personalEmail || "N/A"}</p>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setViewOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default CompanyPage;