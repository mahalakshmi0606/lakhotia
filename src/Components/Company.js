// CompanyPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlus, FaEye, FaFilePdf, FaFileExcel } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { Table, Button, Modal, Form, Row, Col, InputGroup } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ✅ FIXED IMPORTS
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000/api";

const CompanyPage = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);

  const [industryOptions, setIndustryOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);

  const [search, setSearch] = useState("");

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
    const value = search.toLowerCase();
    const filtered = companies.filter(
      (c) =>
        c.companyName?.toLowerCase().includes(value) ||
        c.customerName?.toLowerCase().includes(value) ||
        c.industrySegment?.toLowerCase().includes(value)
    );
    setFilteredCompanies(filtered);
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

    const tableColumn = ["Company Name", "Industry", "Customer", "Mobile", "Department"];

    const tableRows = filteredCompanies.map((c) => [
      c.companyName,
      c.industrySegment,
      c.customerName,
      c.customerMobile,
      c.department,
    ]);

    // ✅ FIXED PDF TABLE
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
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
        <Col md={4}>
          <InputGroup>
            <Form.Control
              placeholder="Search companies..."
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
              <th>Company</th>
              <th>Industry</th>
              <th>Customer</th>
              <th>Mobile</th>
              <th>Department</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredCompanies.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No companies found
                </td>
              </tr>
            )}

            {filteredCompanies.map((c) => (
              <tr key={c.id} className="text-center">
                <td>{c.companyName}</td>
                <td>{c.industrySegment}</td>
                <td>{c.customerName}</td>
                <td>{c.customerMobile}</td>
                <td>{c.department}</td>
                <td>
                  <Button size="sm" variant="info" className="me-2" onClick={() => handleView(c)}>
                    <FaEye />
                  </Button>

                  <Button size="sm" variant="warning" className="me-2" onClick={() => handleEdit(c)}>
                    <FaEdit />
                  </Button>

                  <Button size="sm" variant="danger" onClick={() => handleDelete(c)}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* FORM MODAL */}
      <Modal show={formOpen} onHide={() => setFormOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editId ? "Edit Company" : "Add Company"} — Step {step}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {step === 1 && (
            <>
              <Form.Group className="mb-2">
                <Form.Label>Company Name</Form.Label>
                <Form.Control name="companyName" value={formData.companyName} onChange={handleChange} required />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Company Address</Form.Label>
                <Form.Control name="companyAddress" value={formData.companyAddress} onChange={handleChange} required />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Pin Code</Form.Label>
                <Form.Control name="pinCode" value={formData.pinCode} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Industry Segment</Form.Label>
                <Form.Select name="industrySegment" value={formData.industrySegment} onChange={handleChange}>
                  <option value="">Select</option>
                  {industryOptions.map((i) => (
                    <option key={i.id} value={i.name}>
                      {i.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button className="mt-3" variant="warning" onClick={nextStep}>
                Next
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Form.Group className="mb-2">
                <Form.Label>Customer Name</Form.Label>
                <Form.Control name="customerName" value={formData.customerName} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Customer Mobile</Form.Label>
                <Form.Control name="customerMobile" value={formData.customerMobile} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Customer Email</Form.Label>
                <Form.Control name="customerEmail" value={formData.customerEmail} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Department</Form.Label>
                <Form.Select name="department" value={formData.department} onChange={handleChange}>
                  <option value="">Select</option>
                  {departmentOptions.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Personal Mobile</Form.Label>
                <Form.Control name="personalMobile" value={formData.personalMobile} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Personal Email</Form.Label>
                <Form.Control name="personalEmail" value={formData.personalEmail} onChange={handleChange} />
              </Form.Group>

              <div className="d-flex justify-content-between mt-3">
                <Button variant="secondary" onClick={prevStep}>
                  Previous
                </Button>

                <Button variant="warning" onClick={handleSubmit}>
                  {editId ? "Update" : "Add"}
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* VIEW MODAL */}
      <Modal show={viewOpen} onHide={() => setViewOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Company Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {viewData && (
            <>
              <p>
                <b>Company:</b> {viewData.companyName}
              </p>
              <p>
                <b>Address:</b> {viewData.companyAddress}
              </p>
              <p>
                <b>Industry:</b> {viewData.industrySegment}
              </p>
              <p>
                <b>Customer:</b> {viewData.customerName}
              </p>
              <p>
                <b>Mobile:</b> {viewData.customerMobile}
              </p>
              <p>
                <b>Email:</b> {viewData.customerEmail}
              </p>
              <p>
                <b>Department:</b> {viewData.department}
              </p>
              <p>
                <b>Personal Mobile:</b> {viewData.personalMobile}
              </p>
              <p>
                <b>Personal Email:</b> {viewData.personalEmail}
              </p>
            </>
          )}
        </Modal.Body>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default CompanyPage;
