import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaEye, FaPaperclip, FaDownload, FaSearch, FaFileExcel, FaFilePdf, FaEyeSlash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editId, setEditId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loggedUser, setLoggedUser] = useState("");
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  
  // State for showing/hiding passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showViewPassword, setShowViewPassword] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const API_URL = "http://localhost:5000/api/employee";

  // ESI/PF Status Options (Matches Backend)
  const esiPfOptions = [
    { value: "ESI", label: "ESI" },
    { value: "PF", label: "PF" },
    { value: "Both", label: "Both" },
    { value: "None", label: "None" }
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

  // Filter employees based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(emp => 
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.mobile?.includes(searchTerm) ||
        emp.esiPfStatus?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, employees]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Pagination functions
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
    esiPfStatus: "",
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

  // Check for duplicate email
  const checkDuplicateEmail = async (email, excludeId = null) => {
    // Check locally first
    const duplicate = employees.find(emp => 
      emp.email.toLowerCase() === email.toLowerCase() && emp.id !== excludeId
    );
    
    if (duplicate) {
      toast.error(`Email ${email} already exists for employee: ${duplicate.name}`);
      return true;
    }
    
    // Also check with backend for additional safety
    try {
      const res = await fetch(`${API_URL}/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, excludeId })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          toast.error(`Email ${email} already exists in the system`);
          return true;
        }
      }
    } catch (error) {
      console.error("Error checking email:", error);
    }
    
    return false;
  };

  // Submit Form to Backend (handles both add and update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password match
    if (!editId && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (editId && formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    // Check for duplicate email before proceeding
    if (formData.email) {
      const isDuplicate = await checkDuplicateEmail(formData.email, editId);
      if (isDuplicate) {
        return; // Stop submission if duplicate found
      }
    }

    const fd = new FormData();
    for (const key in formData) {
      if (formData[key] !== null && key !== "photoPreview" && key !== "confirmPassword") {
        // Only append fields that backend expects
        if (key === "password" && editId && !formData.password) {
          // If editing and password is empty, skip sending it
          continue;
        }
        fd.append(key, formData[key]);
      }
    }
    
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
      setFilteredEmployees(data);
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

  // View employee (open card) - UPDATED with debug logs
  const handleView = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      // Debug logs
      console.log("✅ Employee data from backend:", data);
      console.log("✅ Password in response:", data.password);
      console.log("✅ Has password key:", 'password' in data);
      console.log("✅ All keys:", Object.keys(data));
      
      // Also test debug endpoint
      try {
        const debugRes = await fetch(`${API_URL}/debug/${id}`);
        const debugData = await debugRes.json();
        console.log("🔍 Debug endpoint result:", debugData);
      } catch (debugErr) {
        console.log("Debug endpoint not available");
      }
      
      setSelectedEmployee(data);
      setViewOpen(true);
    } catch {
      toast.error("Error fetching employee details");
    }
  };

  // Edit employee - fetch data and populate form - UPDATED
  const handleEdit = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      // Debug log
      console.log("Edit employee data:", data);

      // populate form fields - FIXED
      setFormData({
        photo: null,
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
        password: data.password || "", // ✅ Now includes actual password
        confirmPassword: data.password || "", // ✅ Auto-fill confirm password too
        esiPfStatus: data.esiPfStatus || "",
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

  // Export to Excel
  const exportToExcel = () => {
    if (filteredEmployees.length === 0) {
      toast.warning("No data to export!");
      return;
    }

    // Create CSV content
    const headers = ['ID', 'Name', 'Email', 'Mobile', 'Department', 'Designation', 'ESI/PF Status', 'DOJ', 'Created By', 'Created At'];
    const rows = filteredEmployees.map(emp => [
      emp.id,
      `"${emp.name}"`,
      `"${emp.email}"`,
      `"${emp.mobile}"`,
      `"${emp.department}"`,
      `"${emp.designation}"`,
      `"${emp.esiPfStatus || 'N/A'}"`,
      `"${emp.doj}"`,
      `"${emp.createdBy}"`,
      `"${emp.createdAt}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to Excel successfully!");
  };

  // Export to PDF
  const exportToPDF = () => {
    if (filteredEmployees.length === 0) {
      toast.warning("No data to export!");
      return;
    }

    // Create HTML content for PDF
    const htmlContent = `
      <html>
        <head>
          <title>Employee Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5c518; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .date { color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Employee Report</h1>
            <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Designation</th>
                <th>ESI/PF Status</th>
                <th>DOJ</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEmployees.map(emp => `
                <tr>
                  <td>${emp.id}</td>
                  <td>${emp.name || 'N/A'}</td>
                  <td>${emp.email || 'N/A'}</td>
                  <td>${emp.mobile || 'N/A'}</td>
                  <td>${emp.department || 'N/A'}</td>
                  <td>${emp.designation || 'N/A'}</td>
                  <td>${emp.esiPfStatus || 'N/A'}</td>
                  <td>${emp.doj || 'N/A'}</td>
                  <td>${emp.createdBy || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 20px; color: #666; font-size: 12px;">
            Total Employees: ${filteredEmployees.length}
          </div>
        </body>
      </html>
    `;

    // Open print dialog for PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    toast.success("PDF generated successfully!");
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
      esiPfStatus: "",
    });
    setStep(1);
    setFormOpen(false);
    setEditId(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Employee Management</h2>

      {/* Search and Export Section */}
      <div style={styles.toolbar}>
        <div style={styles.searchContainer}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, email, department, designation, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")} 
              style={styles.clearSearchButton}
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        <div style={styles.buttonGroup}>
          <button
            style={styles.excelButton}
            onClick={exportToExcel}
            title="Export to Excel"
          >
            <FaFileExcel style={{ marginRight: 6 }} /> Excel
          </button>
          
          <button
            style={styles.pdfButton}
            onClick={exportToPDF}
            title="Export to PDF"
          >
            <FaFilePdf style={{ marginRight: 6 }} /> PDF
          </button>
          
          <button
            style={styles.addButton}
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
            title="Add New Employee"
          >
            <FaPlus style={{ marginRight: 6 }} /> Add Employee
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div style={styles.resultsCount}>
        Showing {filteredEmployees.length} of {employees.length} employees
        {searchTerm && ` for "${searchTerm}"`}
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

              {/* Step 2 - UPDATED */}
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
                  
                  {/* Password Field with Eye Icon - UPDATED */}
                  <div>
                    <label style={styles.label}>
                      Password {editId ? "(leave blank to keep current)" : ""}
                      {editId && formData.password && (
                        <span style={{fontSize: "12px", color: "green", marginLeft: "8px"}}>
                          ✓ Current password loaded
                        </span>
                      )}
                    </label>
                    <div style={styles.passwordContainer}>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        style={{...styles.input, paddingRight: "40px"}}
                        required={!editId}
                        placeholder={editId ? "Enter new password or leave blank" : "Enter password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {editId && (
                      <div style={{fontSize: "12px", color: "#666", marginTop: "4px"}}>
                        Leave empty to keep current password: {formData.password ? "••••••••" : "Not loaded"}
                      </div>
                    )}
                  </div>
                  
                  {/* Confirm Password Field with Eye Icon */}
                  <div>
                    <label style={styles.label}>Confirm Password</label>
                    <div style={styles.passwordContainer}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        style={{...styles.input, paddingRight: "40px"}}
                        required={!editId}
                        placeholder={editId ? "Leave blank to keep current" : "Confirm password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeButton}
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
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

                  {/* ✅ ESI/PF Dropdown */}
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

      {/* View Card Modal - UPDATED */}
      {viewOpen && selectedEmployee && (
        <div style={styles.modalOverlay}>
          <div style={styles.viewModal}>
            <div style={styles.viewHeader}>
              <h3 style={{ margin: 0 }}>{selectedEmployee.name}</h3>
              <FaTimes
                onClick={() => {
                  setViewOpen(false);
                  setSelectedEmployee(null);
                  setShowViewPassword(false);
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
                
                {/* Password Row with Eye Icon - UPDATED */}
                <div style={styles.viewRow}>
                  <strong>Password:</strong> 
                  <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                    <span style={{fontFamily: "monospace"}}>
                      {showViewPassword ? 
                        (selectedEmployee?.password ? selectedEmployee.password : "Not set") 
                        : "••••••••"
                      }
                    </span>
                    {selectedEmployee?.password && (
                      <button
                        type="button"
                        onClick={() => setShowViewPassword(!showViewPassword)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#666",
                          fontSize: "16px",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        title={showViewPassword ? "Hide password" : "Show password"}
                      >
                        {showViewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    )}
                  </div>
                  {!selectedEmployee?.password && (
                    <div style={{fontSize: "12px", color: "red", marginTop: "4px"}}>
                      Password not loaded from backend
                    </div>
                  )}
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
              <th style={styles.th}>ID</th>
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
            {currentEmployees.length ? (
              currentEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td style={styles.td}>{emp.id}</td>
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
                <td colSpan="9" style={styles.noData}>
                  {searchTerm ? `No employees found for "${searchTerm}"` : "No employees found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredEmployees.length > itemsPerPage && (
        <div style={styles.paginationContainer}>
          <div style={styles.paginationInfo}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEmployees.length)} of {filteredEmployees.length} entries
          </div>
          
          <div style={styles.paginationControls}>
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              style={{
                ...styles.paginationButton,
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <FaChevronLeft />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return pageNumber <= totalPages ? (
                <button
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  style={{
                    ...styles.paginationButton,
                    backgroundColor: currentPage === pageNumber ? '#f5c518' : '#f0f0f0',
                    color: currentPage === pageNumber ? '#333' : '#666',
                    fontWeight: currentPage === pageNumber ? 'bold' : 'normal'
                  }}
                >
                  {pageNumber}
                </button>
              ) : null;
            })}
            
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              style={{
                ...styles.paginationButton,
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

// Updated Styles
const styles = {
  container: { padding: "30px", fontFamily: "Poppins, sans-serif", background: "#fff" },
  heading: { marginBottom: "20px" },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "15px"
  },
  searchContainer: {
    position: "relative",
    flex: 1,
    minWidth: "300px",
    maxWidth: "500px"
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#666",
    fontSize: "16px"
  },
  searchInput: {
    width: "100%",
    padding: "10px 40px 10px 40px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.3s"
  },
  clearSearchButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#999",
    fontSize: "14px",
    padding: "0"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  excelButton: {
    background: "#217346",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    fontSize: "14px"
  },
  pdfButton: {
    background: "#ff4d4d",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    fontSize: "14px"
  },
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
  resultsCount: {
    marginBottom: "15px",
    color: "#666",
    fontSize: "14px",
    fontStyle: "italic"
  },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "20px" },
  th: { 
    background: "#fff8d6", 
    padding: "12px", 
    borderBottom: "2px solid #f5c518",
    textAlign: "left",
    whiteSpace: "nowrap"
  },
  td: { 
    padding: "12px", 
    textAlign: "left", 
    borderBottom: "1px solid #eee",
    verticalAlign: "middle"
  },
  tablePhoto: { 
    width: "45px", 
    height: "45px", 
    borderRadius: "50%",
    objectFit: "cover"
  },
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
  viewLeft: { 
    width: 160, 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  viewRight: { 
    flex: 1 
  },
  viewPhoto: { 
    width: 140, 
    height: 140, 
    borderRadius: "12px", 
    objectFit: "cover" 
  },
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
  gridItemFull: { 
    gridColumn: "1 / span 2" 
  },
  label: { 
    fontWeight: "500", 
    display: "block", 
    marginBottom: 6,
    fontSize: "14px"
  },
  input: { 
    width: "100%", 
    padding: "10px", 
    borderRadius: "6px", 
    border: "1px solid #ddd",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  textarea: {
    width: "100%",
    borderRadius: "6px",
    border: "1px solid #ddd",
    padding: "10px",
    minHeight: 70,
    fontSize: "14px",
    boxSizing: "border-box",
    resize: "vertical"
  },
  fileInputContainer: {
    position: "relative",
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "10px",
    background: "#f9f9f9",
    cursor: "pointer",
    minHeight: "42px",
    display: "flex",
    alignItems: "center"
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
    marginLeft: "8px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
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
    border: "1px solid #ddd"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "10px",
    borderBottom: "1px solid #eee"
  },
  modalTitle: { 
    margin: 0,
    fontSize: "18px"
  },
  closeIcon: { 
    cursor: "pointer", 
    color: "#ff4d4d",
    fontSize: "20px"
  },
  buttonGroupStep: {
    gridColumn: "1 / span 2",
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px",
    paddingTop: "15px",
    borderTop: "1px solid #eee"
  },
  prevButton: {
    background: "#f0f0f0",
    border: "none",
    padding: "10px 25px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    color: "#333"
  },
  nextButton: {
    background: "#f5c518",
    border: "none",
    padding: "10px 25px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    color: "#333"
  },
  submitButton: {
    background: "#4CAF50",
    color: "#fff",
    border: "none",
    padding: "10px 25px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px"
  },
  noData: { 
    textAlign: "center", 
    padding: "30px", 
    color: "#888",
    fontSize: "16px"
  },
  actionButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "18px",
    margin: "0 5px",
    padding: "5px",
    borderRadius: "4px",
    transition: "background-color 0.2s"
  },
  // New styles for password fields with eye icons
  passwordContainer: {
    position: "relative",
    width: "100%"
  },
  eyeButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#666",
    fontSize: "16px",
    padding: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px"
  },
  // Pagination styles
  paginationContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    flexWrap: "wrap",
    gap: "10px"
  },
  paginationInfo: {
    color: "#666",
    fontSize: "14px"
  },
  paginationControls: {
    display: "flex",
    gap: "5px",
    alignItems: "center"
  },
  paginationButton: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#f0f0f0",
    color: "#666",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "36px",
    height: "36px",
    transition: "all 0.2s"
  }
};

export default EmployeePage;