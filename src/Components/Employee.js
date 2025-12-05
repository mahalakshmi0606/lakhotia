import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaEye, FaPaperclip, FaDownload } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editId, setEditId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loggedUser, setLoggedUser] = useState("");
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [userTypes, setUserTypes] = useState([]);

  const API_URL = "http://localhost:5000/api/employee";

  // ESI/PF Status Options (Matches Backend)
  const esiPfOptions = [
    { value: "ESI/PF", label: "ESI/PF" },
    { value: "No ESI/PF", label: "No ESI/PF" },
    { value: "Casual Labour", label: "Casual Labour" }
  ];

  // ✅ Load user details from localStorage
  useEffect(() => {
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    const id = localStorage.getItem("user_id");

    const userDisplayName = username || email || "User";
    setLoggedUser(userDisplayName);

    // Fetch Departments
    fetch("http://localhost:5000/api/department/all")
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch(() => toast.error("Error fetching departments"));

    // Fetch Designations
    fetch("http://localhost:5000/api/designations")
      .then((res) => res.json())
      .then((data) => setDesignations(data))
      .catch(() => toast.error("Error fetching designations"));

    // Fetch User Types
    fetch("http://localhost:5000/api/usertype")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUserTypes(data.data);
      })
      .catch(() => toast.error("Error fetching user types"));

    // Fetch Employees
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [formData, setFormData] = useState({
    photo: null,
    photoPreview: null,
    name: "",
    dob: "",
    gender: "",
    email: "",
    address: "",
    department: "",
    designation: "",
    doj: "",
    userType: "",
    mobile: "",
    altContact: "",
    pan: "",
    aadhar: "",
    panAttachment: null,
    aadharAttachment: null,
    password: "",
    confirmPassword: "",
    esiPfStatus: "", // ✅ Updated to match backend field name and type
  });

  // Handle input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file)
      setFormData({
        ...formData,
        photo: file,
        photoPreview: URL.createObjectURL(file),
      });
  };

  const handlePanAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file)
      setFormData({
        ...formData,
        panAttachment: file,
      });
  };

  const handleAadharAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file)
      setFormData({
        ...formData,
        aadharAttachment: file,
      });
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // Submit Form to Backend (handles both add and update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only validate password match when creating or when password entered during edit
    if (!editId && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (editId && formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    const fd = new FormData();
    for (const key in formData) {
      if (formData[key] !== null && key !== "photoPreview" && key !== "confirmPassword") {
        // ✅ Only append fields that backend expects (exclude confirmPassword)
        fd.append(key, formData[key]);
      }
    }
    // ✅ Fixed: Use the loggedUser state which now properly gets from localStorage
    fd.append("createdBy", loggedUser);

    try {
      if (editId) {
        // Update existing
        const res = await fetch(`${API_URL}/update/${editId}`, {
          method: "PUT",
          body: fd,
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Employee updated successfully!");
          fetchEmployees();
          resetForm();
        } else {
          toast.error(data.message || "Update failed");
        }
      } else {
        // Add new
        const response = await fetch(`${API_URL}/add`, {
          method: "POST",
          body: fd,
        });
        const data = await response.json();
        if (data.success) {
          toast.success("Employee added successfully!");
          fetchEmployees(); // Refresh list
          resetForm();
        } else {
          toast.error(data.message || "Failed to add employee");
        }
      }
    } catch (err) {
      toast.error("Error connecting to server");
    }
  };

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      const res = await fetch(API_URL + "/all");
      const data = await res.json();
      setEmployees(data);
    } catch {
      toast.error("Error loading employees");
    }
  };

  // Delete employee
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("Employee deleted successfully!");
        fetchEmployees();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch {
      toast.error("Error deleting employee");
    }
  };

  // View employee (open card)
  const handleView = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSelectedEmployee(data);
      setViewOpen(true);
    } catch {
      toast.error("Error fetching employee details");
    }
  };

  // Edit employee - fetch data and populate form
  const handleEdit = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      // populate form fields
      setFormData({
        photo: null, // keep null until user selects new photo
        photoPreview: data.photo
          ? `http://localhost:5000/api/employee/uploads/${data.photo}`
          : null,
        name: data.name || "",
        dob: data.dob || "",
        gender: data.gender || "",
        email: data.email || "",
        address: data.address || "",
        department: data.department || "",
        designation: data.designation || "",
        doj: data.doj || "",
        userType: data.userType || "",
        mobile: data.mobile || "",
        altContact: data.altContact || "",
        pan: data.pan || "",
        aadhar: data.aadhar || "",
        panAttachment: null,
        aadharAttachment: null,
        password: "", // leave blank; user can enter new password to change
        confirmPassword: "",
        esiPfStatus: data.esiPfStatus || "", // ✅ Updated to match backend field
      });
      setEditId(id);
      setStep(1);
      setFormOpen(true);
    } catch {
      toast.error("Error loading employee for edit");
    }
  };

  // View attachment in new tab
  const handleViewAttachment = (attachmentName) => {
    if (attachmentName) {
      window.open(`http://localhost:5000/api/employee/uploads/${attachmentName}`, '_blank');
    }
  };

  // Download attachment
  const handleDownloadAttachment = (attachmentName, documentType) => {
    if (attachmentName) {
      const link = document.createElement('a');
      link.href = `http://localhost:5000/api/employee/uploads/${attachmentName}`;
      link.download = `${documentType}_${selectedEmployee?.name || 'document'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetForm = () => {
    setFormData({
      photo: null,
      photoPreview: null,
      name: "",
      dob: "",
      gender: "",
      email: "",
      address: "",
      department: "",
      designation: "",
      doj: "",
      userType: "",
      mobile: "",
      altContact: "",
      pan: "",
      aadhar: "",
      panAttachment: null,
      aadharAttachment: null,
      password: "",
      confirmPassword: "",
      esiPfStatus: "", // ✅ Reset to empty string
    });
    setStep(1);
    setFormOpen(false);
    setEditId(null);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Employee Management</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <button
          style={styles.addButton}
          onClick={() => {
            resetForm();
            setFormOpen(true);
          }}
        >
          <FaPlus style={{ marginRight: 6 }} /> Add Employee
        </button>
      </div>

      {/* Form Modal (Add / Edit) */}
      {formOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editId ? `Edit Employee (ID: ${editId}) - Step ${step}` : `Add Employee - Step ${step}`}
              </h3>
              <FaTimes
                onClick={() => {
                  resetForm();
                }}
                style={styles.closeIcon}
              />
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Step 1 */}
              {step === 1 && (
                <div style={styles.gridForm}>
                  <div style={styles.gridItemFull}>
                    <label style={styles.label}>Upload Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={styles.input}
                    />
                    {formData.photoPreview && (
                      <img
                        src={formData.photoPreview}
                        alt="Preview"
                        style={styles.previewPhoto}
                      />
                    )}
                  </div>
                  <div>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      style={styles.input}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div style={styles.buttonGroupStep}>
                    <button type="button" style={styles.nextButton} onClick={nextStep}>
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div style={styles.gridForm}>
                  <div>
                    <label style={styles.label}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Mobile</label>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Personal Contact</label>
                    <input
                      type="text"
                      name="altContact"
                      value={formData.altContact}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.gridItemFull}>
                    <label style={styles.label}>Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      style={styles.textarea}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Password {editId ? "(leave blank to keep)" : ""}</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      style={styles.input}
                      required={!editId}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      style={styles.input}
                      required={!editId}
                    />
                  </div>
                  <div style={styles.buttonGroupStep}>
                    <button type="button" style={styles.prevButton} onClick={prevStep}>
                      Previous
                    </button>
                    <button type="button" style={styles.nextButton} onClick={nextStep}>
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div style={styles.gridForm}>
                  <div>
                    <label style={styles.label}>Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      style={styles.input}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Designation</label>
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      style={styles.input}
                    >
                      <option value="">Select Designation</option>
                      {designations.map((des) => (
                        <option key={des.id} value={des.name}>
                          {des.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Date of Joining</label>
                    <input
                      type="date"
                      name="doj"
                      value={formData.doj}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>User Type</label>
                    <select
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      style={styles.input}
                    >
                      <option value="">Select User Type</option>
                      {userTypes.map((ut) => (
                        <option key={ut.id} value={ut.name}>
                          {ut.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>PAN Number</label>
                    <input
                      type="text"
                      name="pan"
                      value={formData.pan}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>PAN Attachment</label>
                    <div style={styles.fileInputContainer}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handlePanAttachmentChange}
                        style={styles.fileInput}
                      />
                      <FaPaperclip style={styles.attachmentIcon} />
                      <span style={styles.fileInputText}>
                        {formData.panAttachment ? formData.panAttachment.name : "Choose file"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={styles.label}>Aadhar Number</label>
                    <input
                      type="text"
                      name="aadhar"
                      value={formData.aadhar}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Aadhar Attachment</label>
                    <div style={styles.fileInputContainer}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleAadharAttachmentChange}
                        style={styles.fileInput}
                      />
                      <FaPaperclip style={styles.attachmentIcon} />
                      <span style={styles.fileInputText}>
                        {formData.aadharAttachment ? formData.aadharAttachment.name : "Choose file"}
                      </span>
                    </div>
                  </div>

                  {/* ✅ ESI/PF Dropdown (Updated) */}
                  <div>
                    <label style={styles.label}>ESI/PF Status</label>
                    <select
                      name="esiPfStatus"
                      value={formData.esiPfStatus}
                      onChange={handleChange}
                      style={styles.input}
                    >
                      <option value="">Select ESI/PF Status</option>
                      {esiPfOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.buttonGroupStep}>
                    <button type="button" style={styles.prevButton} onClick={prevStep}>
                      Previous
                    </button>
                    <button type="submit" style={styles.submitButton}>
                      {editId ? "Update" : "Submit"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* View Card Modal */}
      {viewOpen && selectedEmployee && (
        <div style={styles.modalOverlay}>
          <div style={styles.viewModal}>
            <div style={styles.viewHeader}>
              <h3 style={{ margin: 0 }}>{selectedEmployee.name}</h3>
              <FaTimes
                onClick={() => {
                  setViewOpen(false);
                  setSelectedEmployee(null);
                }}
                style={styles.closeIcon}
              />
            </div>

            <div style={styles.viewContent}>
              <div style={styles.viewLeft}>
                {selectedEmployee.photo ? (
                  <img
                    src={`http://localhost:5000/api/employee/uploads/${selectedEmployee.photo}`}
                    alt="emp"
                    style={styles.viewPhoto}
                  />
                ) : (
                  <div style={styles.noPhoto}>No Photo</div>
                )}
              </div>

              <div style={styles.viewRight}>
                <div style={styles.viewRow}>
                  <strong>Full Name:</strong> <span>{selectedEmployee.name}</span>
                </div>
                <div style={styles.viewRow}>
                  <strong>Email:</strong> <span>{selectedEmployee.email}</span>
                </div>
                <div style={styles.viewRow}>
                  <strong>Mobile:</strong> <span>{selectedEmployee.mobile}</span>
                </div>
                <div style={styles.viewRow}>
                  <strong>Department:</strong> <span>{selectedEmployee.department}</span>
                </div>
                <div style={styles.viewRow}>
                  <strong>Designation:</strong> <span>{selectedEmployee.designation}</span>
                </div>
                <div style={styles.viewRow}>
                  <strong>Gender:</strong> <span>{selectedEmployee.gender}</span>
                </div>
                <div style={styles.viewRow}>
                  <strong>DOB:</strong> <span>{selectedEmployee.dob}</span>
                </div>
                <div style={styles.viewRow}>
                  <strong>DOJ:</strong> <span>{selectedEmployee.doj}</span>
                </div>
                <div style={styles.viewRow}>
                  <strong>User Type:</strong> <span>{selectedEmployee.userType}</span>
                </div>
                <div style={styles.viewRow}>
                  <strong>ESI/PF Status:</strong> 
                  <span style={{ 
                    color: selectedEmployee.esiPfStatus && selectedEmployee.esiPfStatus !== "None" ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {selectedEmployee.esiPfStatus || "Not Specified"}
                  </span>
                </div>
                <div style={styles.viewRow}>
                  <strong>PAN:</strong> <span>{selectedEmployee.pan || "N/A"}</span>
                </div>
                
                {/* PAN Attachment Section */}
                {selectedEmployee.pan && (
                  <div style={styles.viewRow}>
                    <strong>PAN Attachment:</strong> 
                    <div style={styles.attachmentActions}>
                      <button
                        onClick={() => handleViewAttachment(selectedEmployee.panAttachment)}
                        style={styles.viewAttachmentButton}
                      >
                        <FaEye style={{ marginRight: 4 }} /> View
                      </button>
                      <button
                        onClick={() => handleDownloadAttachment(selectedEmployee.panAttachment, "PAN")}
                        style={styles.downloadAttachmentButton}
                      >
                        <FaDownload style={{ marginRight: 4 }} /> Download
                      </button>
                    </div>
                  </div>
                )}

                <div style={styles.viewRow}>
                  <strong>Aadhar:</strong> <span>{selectedEmployee.aadhar || "N/A"}</span>
                </div>
                
                {/* Aadhar Attachment Section */}
                {selectedEmployee.aadhar && (
                  <div style={styles.viewRow}>
                    <strong>Aadhar Attachment:</strong> 
                    <div style={styles.attachmentActions}>
                      <button
                        onClick={() => handleViewAttachment(selectedEmployee.aadharAttachment)}
                        style={styles.viewAttachmentButton}
                      >
                        <FaEye style={{ marginRight: 4 }} /> View
                      </button>
                      <button
                        onClick={() => handleDownloadAttachment(selectedEmployee.aadharAttachment, "Aadhar")}
                        style={styles.downloadAttachmentButton}
                      >
                        <FaDownload style={{ marginRight: 4 }} /> Download
                      </button>
                    </div>
                  </div>
                )}

                <div style={styles.viewRow}>
                  <strong>Address:</strong> <span>{selectedEmployee.address}</span>
                </div>
                <div style={styles.viewRow}>
                  <strong>Created By:</strong> <span>{selectedEmployee.createdBy}</span>
                </div>
                <div style={styles.viewRow}>
                  <strong>Created At:</strong> <span>{selectedEmployee.createdAt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Photo</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Designation</th>
              <th style={styles.th}>ESI/PF Status</th>
              <th style={styles.th}>Created By</th>
              <th style={styles.th}>Created At</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length ? (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={styles.td}>
                    {emp.photo ? (
                      <img
                        src={`http://localhost:5000/api/employee/uploads/${emp.photo}`}
                        alt="emp"
                        style={styles.tablePhoto}
                      />
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td style={styles.td}>{emp.name}</td>
                  <td style={styles.td}>{emp.department}</td>
                  <td style={styles.td}>{emp.designation}</td>
                  <td style={styles.td}>
                    <span style={{
                      color: emp.esiPfStatus && emp.esiPfStatus !== "None" ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {emp.esiPfStatus || "Not Specified"}
                    </span>
                  </td>
                  <td style={styles.td}>{emp.createdBy}</td>
                  <td style={styles.td}>{emp.createdAt}</td>
                  <td style={styles.td}>
                    <button
                      title="View"
                      onClick={() => handleView(emp.id)}
                      style={{ ...styles.actionButton, color: "#2b7cff", marginRight: 6 }}
                    >
                      <FaEye />
                    </button>

                    <button
                      title="Edit"
                      onClick={() => handleEdit(emp.id)}
                      style={{ ...styles.actionButton, color: "#ffa500", marginRight: 6 }}
                    >
                      <FaEdit />
                    </button>

                    <button
                      title="Delete"
                      onClick={() => handleDelete(emp.id)}
                      style={{ ...styles.actionButton, color: "#ff4d4d" }}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={styles.noData}>
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

// Styles
const styles = {
  container: { padding: "30px", fontFamily: "Poppins, sans-serif", background: "#fff" },
  heading: { marginBottom: "20px" },
  addButton: {
    background: "#f5c518",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#fff8d6", padding: "12px", borderBottom: "2px solid #f5c518" },
  td: { padding: "10px", textAlign: "center", borderBottom: "1px solid #eee" },
  tablePhoto: { width: "45px", height: "45px", borderRadius: "50%" },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: 16,
  },
  modal: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    width: "720px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
  },
  viewModal: {
    background: "#fff",
    padding: "18px",
    borderRadius: "12px",
    width: "760px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  },
  viewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewContent: {
    display: "flex",
    gap: 18,
  },
  viewLeft: { width: 160, display: "flex", justifyContent: "center", alignItems: "center" },
  viewRight: { flex: 1 },
  viewPhoto: { width: 140, height: 140, borderRadius: "12px", objectFit: "cover" },
  noPhoto: {
    width: 140,
    height: 140,
    borderRadius: 12,
    background: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#888",
  },
  viewRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px dashed #eee",
  },
  attachmentActions: {
    display: "flex",
    gap: "8px",
  },
  viewAttachmentButton: {
    background: "#2b7cff",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
  },
  downloadAttachmentButton: {
    background: "#4CAF50",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
  },
  gridForm: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px 20px",
  },
  gridItemFull: { gridColumn: "1 / span 2" },
  label: { fontWeight: "500", display: "block", marginBottom: 6 },
  input: { width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" },
  textarea: {
    width: "100%",
    borderRadius: "6px",
    border: "1px solid #ccc",
    padding: "8px",
    minHeight: 70,
  },
  fileInputContainer: {
    position: "relative",
    width: "100%",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "8px",
    background: "#f9f9f9",
    cursor: "pointer",
  },
  fileInput: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },
  fileInputText: {
    color: "#666",
    fontSize: "14px",
  },
  attachmentIcon: {
    marginRight: "8px",
    color: "#666",
  },
  previewPhoto: {
    width: "80px",
    height: "80px",
    borderRadius: "8px",
    marginTop: 10,
    objectFit: "cover",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  modalTitle: { margin: 0 },
  closeIcon: { cursor: "pointer", color: "#ff4d4d" },
  buttonGroupStep: {
    gridColumn: "1 / span 2",
    display: "flex",
    justifyContent: "space-between",
    marginTop: 6,
  },
  prevButton: {
    background: "#ccc",
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  nextButton: {
    background: "#f5c518",
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  submitButton: {
    background: "#4CAF50",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  noData: { textAlign: "center", padding: "20px", color: "#888" },
  actionButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "18px",
    margin: "0 5px",
  },
};

export default EmployeePage;