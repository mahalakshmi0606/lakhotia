// src/components/InvoiceModal.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function InvoiceModal() {
  const idRef = useRef(1000);

  // Helper to create item
  function createEmptyItem(seq) {
    idRef.current += 1;
    return {
      id: idRef.current,
      itemName: "",
      hsnSac: "",
      supplierPartNo: "",
      custDescription: "",
      cutWidth: 1,
      length: 1,
      batchNo: `B-${Date.now().toString().slice(-6)}-${seq}`,
      mrp: 0,
      quantity: 1,
      unit: "pcs",
      discount: 0,
    };
  }

  // Quote metadata
  const [quoteNo] = useState(() => `Q-${Date.now().toString().slice(-8)}`);
  const [date] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [time] = useState(() => dayjs().format("HH:mm:ss"));

  // Issuer static details
  const issuer = {
    name: "Lakhotia",
    address: "64/3A Sidco Industrial Estate, Ambatur, Chennai",
    phone: "7845663338",
    email: "vivek@lakhotia.net",
    gstin: "33AABFL9981E1Z7",
    stateCode: "33-Tamil Nadu",
    placeOfSupply: "33-Tamil Nadu",
  };

  // State variables
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companyError, setCompanyError] = useState(null);
  
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [billTo, setBillTo] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactMob, setContactMob] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactEmailSame, setContactEmailSame] = useState(false);

  // Items state
  const [items, setItems] = useState(() => [createEmptyItem(1)]);

  // Modal open
  const [modalOpen, setModalOpen] = useState(false);

  // Saved invoices state
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [saving, setSaving] = useState(false);

  // DOM ref for invoice content
  const invoiceRef = useRef(null);

  // Load saved invoices from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("savedInvoices");
    if (saved) {
      try {
        setSavedInvoices(JSON.parse(saved));
      } catch (err) {
        console.error("Error loading saved invoices:", err);
      }
    }
  }, []);

  // Fetch companies with error handling
  useEffect(() => {
    if (!modalOpen) return;
    
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      setCompanyError(null);
      try {
        console.log("📡 Fetching companies from API...");
        
        // Try with different endpoints to see what works
        const endpoints = [
          "http://127.0.0.1:5000/api/company",
          "http://localhost:5000/api/company",
          "http://127.0.0.1:5000/company"
        ];
        
        let response = null;
        let lastError = null;
        
        // Try each endpoint
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            response = await axios.get(endpoint, {
              timeout: 5000,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            console.log(`✅ Success with endpoint: ${endpoint}`);
            break;
          } catch (err) {
            lastError = err;
            console.log(`❌ Failed with endpoint: ${endpoint}`, err.message);
          }
        }
        
        if (!response) {
          throw new Error(lastError?.message || "All endpoints failed");
        }
        
        console.log("📦 Raw API response:", response);
        console.log("📊 Response data:", response.data);
        console.log("📊 Response status:", response.status);
        
        // Handle different response formats
        let companiesData = [];
        
        if (Array.isArray(response.data)) {
          companiesData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // If it's an object with a data property
          if (Array.isArray(response.data.data)) {
            companiesData = response.data.data;
          } else if (response.data.companies) {
            companiesData = response.data.companies;
          } else {
            // Try to convert object to array
            companiesData = Object.values(response.data);
          }
        }
        
        console.log("🏢 Processed companies data:", companiesData);
        
        if (companiesData.length > 0) {
          // Log first company to see structure
          console.log("🔍 First company structure:", companiesData[0]);
          console.log("🔍 Company keys:", Object.keys(companiesData[0]));
          
          setCompanies(companiesData);
          setCompanyError(null);
          
          // If only one company, auto-select it
          if (companiesData.length === 1) {
            const company = companiesData[0];
            setSelectedCompanyId(company.id || company.ID || "");
            setBillTo(company.company_name || company.companyName || "");
            setContactPerson(company.customer_name || company.customerName || "");
            setContactMob(company.customer_mobile || company.customerMobile || "");
            setContactEmail(company.customer_email || company.customerEmail || "");
          }
        } else {
          setCompanies([]);
          setCompanyError("No companies found in database.");
        }
        
      } catch (err) {
        console.error("❌ Fetch companies failed:", err);
        console.error("Error details:", err.response || err.message);
        
        // Provide mock data for testing if API fails
        const mockCompanies = [
          {
            id: 1,
            company_name: "ABC Corporation",
            company_address: "123 Main St, Chennai",
            customer_name: "John Doe",
            customer_mobile: "9876543210",
            customer_email: "john@abccorp.com"
          },
          {
            id: 2,
            company_name: "XYZ Industries",
            company_address: "456 Park Ave, Bangalore",
            customer_name: "Jane Smith",
            customer_mobile: "9876543211",
            customer_email: "jane@xyzind.com"
          }
        ];
        
        setCompanies(mockCompanies);
        setCompanyError("Using mock data. API Error: " + (err.message || "Connection failed"));
      } finally {
        setLoadingCompanies(false);
      }
    };
    
    fetchCompanies();
  }, [modalOpen]);

  // When company selected, autofill data
  useEffect(() => {
    if (!selectedCompanyId) return;
    
    console.log("🔄 Company selected:", selectedCompanyId);
    console.log("🏢 Available companies:", companies);
    
    const company = companies.find(c => {
      // Try different ID field names
      const id = c.id || c.ID || c.Id;
      return id && id.toString() === selectedCompanyId.toString();
    });
    
    console.log("🔍 Found company:", company);
    
    if (!company) {
      console.log("⚠️ Company not found with ID:", selectedCompanyId);
      return;
    }
    
    // Extract values with fallbacks for different field names
    const companyName = company.company_name || company.companyName || "";
    const customerName = company.customer_name || company.customerName || "";
    const customerMobile = company.customer_mobile || company.customerMobile || "";
    const customerEmail = company.customer_email || company.customerEmail || "";
    
    console.log("📝 Extracted values:", { companyName, customerName, customerMobile, customerEmail });
    
    setBillTo(companyName);
    setContactPerson(customerName);
    setContactMob(customerMobile);
    if (!contactEmailSame) {
      setContactEmail(customerEmail);
    }
    
  }, [selectedCompanyId, companies, contactEmailSame]);

  // Handle contact email same toggle
  useEffect(() => {
    if (contactEmailSame) {
      setContactEmail(issuer.email);
    }
  }, [contactEmailSame]);

  // Reset form when modal opens
  useEffect(() => {
    if (modalOpen) {
      // Reset to initial state but keep new quote number
      setItems([createEmptyItem(1)]);
      setSelectedCompanyId("");
      setBillTo("");
      setContactPerson("");
      setContactMob("");
      setContactEmail("");
      setContactEmailSame(false);
    }
  }, [modalOpen]);

  // Auto-fill MRP based on supplier part number
  function autoMrp(partNo) {
    const lookup = { 
      "SP-001": 120.0, 
      "SP-002": 250.0,
      "SP-003": 180.0,
      "SP-004": 320.0
    };
    
    const cleanPartNo = partNo ? partNo.trim().toUpperCase() : "";
    
    if (cleanPartNo && lookup[cleanPartNo]) {
      return lookup[cleanPartNo];
    }
    
    return parseFloat((Math.random() * 200 + 20).toFixed(2));
  }

  // Handle item field changes
  function handleItemChange(index, field, value) {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      let newValue = value;
      
      if (["cutWidth", "length", "mrp", "quantity", "discount"].includes(field)) {
        newValue = parseFloat(value) || 0;
      }
      
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: newValue
      };
      
      if (field === "supplierPartNo") {
        updatedItems[index].mrp = autoMrp(newValue);
      }
      
      return updatedItems;
    });
  }

  // Add new item
  function addItem() {
    setItems(prevItems => [...prevItems, createEmptyItem(prevItems.length + 1)]);
  }

  // Remove item
  function removeItem(index) {
    if (items.length > 1) {
      setItems(prevItems => prevItems.filter((_, i) => i !== index));
    } else {
      setItems([createEmptyItem(1)]);
    }
  }

  // Calculate price per unit (MRP × Cut Width)
  const pricePerUnit = (item) => {
    const mrp = parseFloat(item.mrp) || 0;
    const cutWidth = parseFloat(item.cutWidth) || 0;
    const price = mrp * cutWidth;
    return parseFloat(price.toFixed(2)) || 0;
  };

  // Calculate amount before discount
  const amountBeforeDiscount = (item) => {
    const price = pricePerUnit(item);
    const quantity = parseFloat(item.quantity) || 0;
    const amount = price * quantity;
    return parseFloat(amount.toFixed(2)) || 0;
  };

  // Calculate discount amount (assuming discount is in rupees, not percentage)
  const discountAmount = (item) => {
    return parseFloat(item.discount) || 0;
  };

  // Calculate amount after discount
  const amountAfterDiscount = (item) => {
    const amount = amountBeforeDiscount(item);
    const discount = discountAmount(item);
    const finalAmount = amount - discount;
    return parseFloat(finalAmount.toFixed(2)) || 0;
  };

  // Calculate GST amount (18% of amount after discount)
  const gstAmount = (item) => {
    const amount = amountAfterDiscount(item);
    const gst = amount * 0.18;
    return parseFloat(gst.toFixed(2));
  };

  // Calculate item total (amount after discount + GST)
  const itemTotal = (item) => {
    const amount = amountAfterDiscount(item);
    const gst = gstAmount(item);
    return parseFloat((amount + gst).toFixed(2));
  };

  // Calculate all totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + amountBeforeDiscount(item), 0);
    const totalDiscount = items.reduce((sum, item) => sum + discountAmount(item), 0);
    const totalGST = items.reduce((sum, item) => sum + gstAmount(item), 0);
    const grandTotal = items.reduce((sum, item) => sum + itemTotal(item), 0);
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      totalGST: parseFloat(totalGST.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
  };

  // Export to PDF
  async function exportPdf() {
    if (!invoiceRef.current) {
      alert("Invoice content not found!");
      return;
    }
    
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${quoteNo}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. See console for details.");
    }
  }

  // Save invoice
  async function saveInvoice() {
    if (!selectedCompanyId) {
      alert("Please select a company first!");
      return;
    }
    
    if (!billTo.trim()) {
      alert("Please enter Bill To information!");
      return;
    }
    
    setSaving(true);
    
    const totals = calculateTotals();
    const invoiceData = {
      id: Date.now(),
      quoteNo,
      date,
      time,
      issuer,
      companyId: selectedCompanyId,
      billTo,
      contactPerson,
      contactMob,
      contactEmail,
      items: items.map(item => ({
        ...item,
        pricePerUnit: pricePerUnit(item),
        amountBeforeDiscount: amountBeforeDiscount(item),
        discountAmount: discountAmount(item),
        amountAfterDiscount: amountAfterDiscount(item),
        gstAmount: gstAmount(item),
        itemTotal: itemTotal(item)
      })),
      totals,
      createdAt: new Date().toISOString(),
      status: "Draft"
    };
    
    console.log("💾 Saving invoice:", invoiceData);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add to saved invoices
      const updatedInvoices = [invoiceData, ...savedInvoices];
      setSavedInvoices(updatedInvoices);
      
      // Save to localStorage
      localStorage.setItem("savedInvoices", JSON.stringify(updatedInvoices));
      
      // Show success message
      alert(`✅ Invoice saved successfully!\n\nQuote: ${quoteNo}\nCompany: ${billTo}\nGrand Total: ₹${totals.grandTotal}`);
      
      // Close modal
      setModalOpen(false);
      
    } catch (err) {
      console.error("Save invoice failed:", err);
      alert("Save failed - see console.");
    } finally {
      setSaving(false);
    }
  }

  // Delete saved invoice
  function deleteInvoice(id) {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      const updatedInvoices = savedInvoices.filter(invoice => invoice.id !== id);
      setSavedInvoices(updatedInvoices);
      localStorage.setItem("savedInvoices", JSON.stringify(updatedInvoices));
    }
  }

  // View invoice details
  function viewInvoiceDetails(invoice) {
    alert(`Invoice Details:\n\n` +
          `Quote No: ${invoice.quoteNo}\n` +
          `Date: ${invoice.date}\n` +
          `Time: ${invoice.time}\n` +
          `Company: ${invoice.billTo}\n` +
          `Contact: ${invoice.contactPerson} (${invoice.contactMob})\n` +
          `Items: ${invoice.items.length}\n` +
          `Subtotal: ₹${invoice.totals.subtotal}\n` +
          `Discount: ₹${invoice.totals.totalDiscount}\n` +
          `GST: ₹${invoice.totals.totalGST}\n` +
          `Grand Total: ₹${invoice.totals.grandTotal}\n` +
          `Status: ${invoice.status}`);
  }

  // Export saved invoice as PDF
  async function exportSavedInvoice(invoice) {
    alert(`Exporting ${invoice.quoteNo} as PDF...\n\nNote: This would generate a PDF from the saved data.`);
    // You could implement PDF generation from saved data here
  }

  // STYLES
  const styles = {
    root: { fontFamily: "Arial, Helvetica, sans-serif", padding: 18, color: "#222" },
    topActions: { 
      display: "flex", 
      gap: 8, 
      marginBottom: 12,
      alignItems: "center"
    },
    btn: { 
      background: "#f0f0f0", 
      border: "1px solid #ccc", 
      padding: "8px 12px", 
      borderRadius: 4, 
      cursor: "pointer", 
      fontSize: 14,
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: 6
    },
    primaryBtn: { background: "#1f6feb", color: "#fff", borderColor: "#165ec7" },
    dangerBtn: { background: "#e74c3c", color: "#fff", borderColor: "#c0392b" },
    successBtn: { background: "#2ecc71", color: "#fff", borderColor: "#27ae60" },
    infoBtn: { background: "#3498db", color: "#fff", borderColor: "#2980b9" },
    modalBackdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    },
    modal: {
      width: "94%",
      maxWidth: 1120,
      maxHeight: "92vh",
      overflow: "auto",
      background: "#fff",
      borderRadius: 8,
      boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
      padding: 18,
    },
    modalHeader: { 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      marginBottom: 12,
      paddingBottom: 12,
      borderBottom: "2px solid #eee"
    },
    modalBody: { padding: "6px 0" },
    card: { border: "1px solid #e6e6e6", padding: 12, borderRadius: 6, background: "#fafafa", marginBottom: 12 },
    label: { display: "block", marginTop: 8, marginBottom: 6, fontWeight: 600, fontSize: 13 },
    input: { 
      width: "100%", 
      boxSizing: "border-box", 
      padding: 8, 
      border: "1px solid #d6d6d6", 
      borderRadius: 4, 
      fontSize: 14, 
      marginBottom: 6 
    },
    select: {
      width: "100%",
      boxSizing: "border-box",
      padding: 8,
      border: "1px solid #d6d6d6",
      borderRadius: 4,
      fontSize: 14,
      marginBottom: 6,
      background: "#fff"
    },
    textarea: { width: "100%", boxSizing: "border-box", padding: 8, border: "1px solid #d6d6d6", borderRadius: 4, fontSize: 14 },
    itemsTable: { 
      width: "100%", 
      borderCollapse: "collapse", 
      fontSize: 13,
      tableLayout: "fixed"
    },
    thtd: { 
      border: "1px solid #ddd", 
      padding: 6, 
      verticalAlign: "middle", 
      textAlign: "left",
      minWidth: "80px"
    },
    totalsBox: { 
      width: 320, 
      border: "1px solid #e3e3e3", 
      padding: 12, 
      borderRadius: 6, 
      background: "#fff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    },
    small: { fontSize: 12, color: "#444" },
    note: { marginTop: 14, color: "#666", fontSize: 14 },
    error: { color: "#e74c3c", fontSize: 12, marginTop: 4, padding: 8, background: "#ffe6e6", borderRadius: 4 },
    success: { color: "#2ecc71", fontSize: 12, marginTop: 4, padding: 8, background: "#e6ffe6", borderRadius: 4 },
    loading: { color: "#3498db", fontSize: 12, marginTop: 4, padding: 8, background: "#e6f3ff", borderRadius: 4 },
    sectionTitle: { 
      fontSize: 16, 
      fontWeight: "bold", 
      marginBottom: 12, 
      color: "#2c3e50",
      borderBottom: "2px solid #3498db",
      paddingBottom: 4
    },
    amountCell: { textAlign: "right", fontFamily: "'Courier New', monospace", fontWeight: "bold" },
    deleteBtn: { 
      padding: "4px 8px", 
      fontSize: 12,
      background: "#e74c3c",
      color: "white",
      border: "none",
      borderRadius: 3,
      cursor: "pointer"
    },
    actionBtn: {
      padding: "4px 8px",
      fontSize: 12,
      background: "#3498db",
      color: "white",
      border: "none",
      borderRadius: 3,
      cursor: "pointer",
      margin: "0 2px"
    },
    savedInvoicesTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      fontSize: 14
    },
    tableHeader: {
      background: "#2c3e50",
      color: "white",
      fontWeight: "bold",
      padding: "10px",
      textAlign: "left"
    },
    tableRow: {
      borderBottom: "1px solid #ddd",
      transition: "background 0.2s"
    },
    tableCell: {
      padding: "10px",
      verticalAlign: "middle"
    },
    emptyState: {
      textAlign: "center",
      padding: "40px 20px",
      color: "#7f8c8d",
      fontSize: 16
    },
    statusBadge: {
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: 12,
      fontSize: 12,
      fontWeight: "bold"
    },
    statusDraft: {
      background: "#f39c12",
      color: "white"
    },
    statusPaid: {
      background: "#27ae60",
      color: "white"
    },
    statusPending: {
      background: "#3498db",
      color: "white"
    }
  };

  const totals = calculateTotals();

  // Helper function to get display text for company
  const getCompanyDisplayText = (company) => {
    if (!company) return "";
    
    const name = company.company_name || company.companyName || "Unnamed Company";
    const customer = company.customer_name || company.customerName || "Unknown Contact";
    const mobile = company.customer_mobile || company.customerMobile || "No Mobile";
    
    return `${name} (${customer}) - ${mobile}`;
  };

  return (
    <div style={styles.root}>
      <div style={styles.topActions}>
        <button
          style={{ ...styles.btn, ...styles.primaryBtn }}
          onClick={() => setModalOpen(true)}
        >
          <span>📄</span> New Quote / Invoice
        </button>
        
        <div style={{ marginLeft: "auto", fontSize: 14, color: "#666" }}>
          {savedInvoices.length > 0 ? (
            <span>📋 {savedInvoices.length} saved invoice(s)</span>
          ) : (
            <span>No saved invoices yet</span>
          )}
        </div>
      </div>

      {!modalOpen && (
        <div style={styles.note}>
          Click <strong>New Quote / Invoice</strong> to create a new invoice. Saved invoices will appear below.
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, color: "#2c3e50" }}>Create Quote / Invoice</h2>
              <div>
                <button
                  style={{ ...styles.btn, ...styles.primaryBtn }}
                  onClick={exportPdf}
                >
                  Export PDF
                </button>
                <button
                  style={styles.btn}
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={styles.modalBody} ref={invoiceRef}>
              {/* Issuer + Meta Section */}
              <div style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ maxWidth: 520 }}>
                    <h2 style={{ margin: 0, color: "#2980b9" }}>{issuer.name}</h2>
                    <div style={styles.small}>{issuer.address}</div>
                    <div style={styles.small}>Phone: {issuer.phone} | Email: {issuer.email}</div>
                    <div style={styles.small}>GSTIN: {issuer.gstin}</div>
                    <div style={styles.small}>State: {issuer.stateCode}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div><strong>Quote No:</strong> {quoteNo}</div>
                    <div><strong>Date:</strong> {date}</div>
                    <div><strong>Time:</strong> {time}</div>
                    <div><strong>Place of Supply:</strong> {issuer.placeOfSupply}</div>
                  </div>
                </div>
              </div>

              {/* Company & Contact Section */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Company & Contact Details</div>
                
                <div style={{ display: "flex", gap: 18 }}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Select Company</label>
                    <select
                      style={styles.select}
                      value={selectedCompanyId}
                      onChange={(e) => {
                        console.log("Dropdown changed to:", e.target.value);
                        setSelectedCompanyId(e.target.value);
                      }}
                    >
                      <option value="">-- Choose company --</option>
                      {loadingCompanies && <option disabled>Loading companies...</option>}
                      {companies.map((company, index) => {
                        const companyId = company.id || company.ID || index + 1;
                        return (
                          <option key={companyId} value={companyId}>
                            {getCompanyDisplayText(company)}
                          </option>
                        );
                      })}
                    </select>

                    {loadingCompanies && <div style={styles.loading}>⏳ Loading companies from database...</div>}
                    {companyError && <div style={styles.error}>⚠️ {companyError}</div>}
                    {!loadingCompanies && !companyError && companies.length === 0 && (
                      <div style={styles.error}>❌ No companies found. Please add companies first.</div>
                    )}
                    {!loadingCompanies && !companyError && companies.length > 0 && (
                      <div style={styles.success}>✅ {companies.length} company(s) loaded</div>
                    )}

                    <label style={styles.label}>Contact Person</label>
                    <input 
                      style={styles.input} 
                      value={contactPerson} 
                      onChange={(e) => setContactPerson(e.target.value)}
                    />

                    <label style={styles.label}>Contact Mobile</label>
                    <input 
                      style={styles.input} 
                      value={contactMob} 
                      onChange={(e) => setContactMob(e.target.value)}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <input 
                        type="checkbox" 
                        id="sameEmail" 
                        checked={contactEmailSame} 
                        onChange={(e) => setContactEmailSame(e.target.checked)}
                      />
                      <label htmlFor="sameEmail" style={styles.small}>
                        Use issuer email for contact
                      </label>
                    </div>

                    <label style={styles.label}>Contact Email</label>
                    <input 
                      style={styles.input} 
                      value={contactEmail} 
                      onChange={(e) => {
                        setContactEmail(e.target.value);
                        if (e.target.value !== issuer.email) {
                          setContactEmailSame(false);
                        }
                      }}
                      type="email"
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Bill To (Company)</label>
                    <input 
                      style={styles.input} 
                      value={billTo} 
                      onChange={(e) => setBillTo(e.target.value)}
                    />

                    <label style={styles.label}>Billing Contact No</label>
                    <input 
                      style={{ ...styles.input, background: "#f6f6f6" }} 
                      value={contactMob} 
                      readOnly 
                    />

                    <label style={styles.label}>Notes</label>
                    <textarea 
                      style={{ ...styles.textarea, height: 96 }} 
                      defaultValue={`Please process this quote as per the terms mentioned.\nAll prices are in INR and inclusive of GST.\nDelivery within 7-10 business days.\n\nGSTIN: ${issuer.gstin}\nPlace of Supply: ${issuer.placeOfSupply}`}
                    />
                  </div>
                </div>
              </div>

              {/* Items Table Section */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Items & Pricing</div>
                
                <div style={{ overflowX: "auto", marginTop: 6 }}>
                  <table style={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th style={{...styles.thtd, width: "30px"}}>#</th>
                        <th style={styles.thtd}>Item Name</th>
                        <th style={styles.thtd}>HSN/SAC</th>
                        <th style={styles.thtd}>Supplier Part No</th>
                        <th style={styles.thtd}>Description</th>
                        <th style={styles.thtd}>Cut Width</th>
                        <th style={styles.thtd}>Length</th>
                        <th style={styles.thtd}>MRP</th>
                        <th style={styles.thtd}>Qty</th>
                        <th style={styles.thtd}>Price/Unit</th>
                        <th style={styles.thtd}>Discount</th>
                        <th style={styles.thtd}>Amount</th>
                        <th style={styles.thtd}>GST(18%)</th>
                        <th style={styles.thtd}>Total</th>
                        <th style={{...styles.thtd, width: "70px"}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td style={styles.thtd}>{index + 1}</td>
                          
                          <td style={styles.thtd}>
                            <input 
                              style={styles.input} 
                              value={item.itemName} 
                              onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                              placeholder="Enter item name"
                            />
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              style={styles.input} 
                              value={item.hsnSac} 
                              onChange={(e) => handleItemChange(index, "hsnSac", e.target.value)}
                              placeholder="Enter HSN/SAC"
                            />
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              style={styles.input} 
                              value={item.supplierPartNo} 
                              onChange={(e) => handleItemChange(index, "supplierPartNo", e.target.value)}
                              placeholder="Enter part no"
                            />
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              style={styles.input} 
                              value={item.custDescription} 
                              onChange={(e) => handleItemChange(index, "custDescription", e.target.value)}
                              placeholder="Enter description"
                            />
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              type="number" 
                              min="0.1"
                              step="0.1"
                              style={styles.input} 
                              value={item.cutWidth} 
                              onChange={(e) => handleItemChange(index, "cutWidth", e.target.value)}
                            />
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              type="number" 
                              min="1"
                              style={styles.input} 
                              value={item.length} 
                              onChange={(e) => handleItemChange(index, "length", e.target.value)}
                            />
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              type="number" 
                              min="0"
                              step="0.01"
                              style={styles.input} 
                              value={item.mrp} 
                              onChange={(e) => handleItemChange(index, "mrp", e.target.value)}
                            />
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              type="number" 
                              min="1"
                              style={styles.input} 
                              value={item.quantity} 
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            />
                          </td>

                          <td style={styles.amountCell}>
                            ₹{pricePerUnit(item).toFixed(2)}
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              type="number" 
                              min="0"
                              step="0.01"
                              style={styles.input} 
                              value={item.discount} 
                              onChange={(e) => handleItemChange(index, "discount", e.target.value)}
                              placeholder="Discount"
                            />
                          </td>

                          <td style={styles.amountCell}>
                            ₹{amountAfterDiscount(item).toFixed(2)}
                          </td>

                          <td style={styles.amountCell}>
                            ₹{gstAmount(item).toFixed(2)}
                          </td>

                          <td style={styles.amountCell}>
                            <strong>₹{itemTotal(item).toFixed(2)}</strong>
                          </td>

                          <td style={styles.thtd}>
                            <button 
                              style={styles.deleteBtn}
                              onClick={() => removeItem(index)}
                              title="Delete item"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "flex-start" }}>
                  <div>
                    <button 
                      style={{ ...styles.btn, ...styles.successBtn }}
                      onClick={addItem}
                    >
                      + Add Item
                    </button>
                  </div>

                  <div style={styles.totalsBox}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span>Subtotal:</span>
                      <strong>₹{totals.subtotal.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span>Total Discount:</span>
                      <strong style={{ color: "#e74c3c" }}>- ₹{totals.totalDiscount.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span>Total GST (18%):</span>
                      <strong>₹{totals.totalGST.toFixed(2)}</strong>
                    </div>
                    <hr style={{ border: "none", borderTop: "2px solid #eee", margin: "10px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: "bold" }}>
                      <span>Grand Total:</span>
                      <strong style={{ color: "#2980b9" }}>₹{totals.grandTotal.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button 
                  style={{ ...styles.btn, ...styles.primaryBtn }} 
                  onClick={exportPdf}
                >
                  Export PDF
                </button>
                <button 
                  style={{ ...styles.btn, ...styles.successBtn }} 
                  onClick={saveInvoice}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Invoice"}
                </button>
                <button 
                  style={styles.btn} 
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Invoices Table */}
      {savedInvoices.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3 style={styles.sectionTitle}>Saved Invoices</h3>
          
          <div style={{ overflowX: "auto" }}>
            <table style={styles.savedInvoicesTable}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Quote No</th>
                  <th style={styles.tableHeader}>Date</th>
                  <th style={styles.tableHeader}>Company</th>
                  <th style={styles.tableHeader}>Contact Person</th>
                  <th style={styles.tableHeader}>Items</th>
                  <th style={styles.tableHeader}>Grand Total</th>
                  <th style={styles.tableHeader}>Status</th>
                  <th style={styles.tableHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedInvoices.map((invoice) => (
                  <tr key={invoice.id} style={styles.tableRow}>
                    <td style={styles.tableCell}>
                      <strong>{invoice.quoteNo}</strong>
                    </td>
                    <td style={styles.tableCell}>
                      {invoice.date}<br/>
                      <span style={styles.small}>{invoice.time}</span>
                    </td>
                    <td style={styles.tableCell}>
                      {invoice.billTo}<br/>
                      <span style={styles.small}>{invoice.contactEmail}</span>
                    </td>
                    <td style={styles.tableCell}>
                      {invoice.contactPerson}<br/>
                      <span style={styles.small}>{invoice.contactMob}</span>
                    </td>
                    <td style={styles.tableCell}>
                      {invoice.items.length} items
                    </td>
                    <td style={styles.tableCell}>
                      <strong style={{ color: "#2980b9" }}>
                        ₹{invoice.totals.grandTotal.toFixed(2)}
                      </strong>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{ ...styles.statusBadge, ...styles.statusDraft }}>
                        {invoice.status}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <button 
                        style={styles.actionBtn}
                        onClick={() => viewInvoiceDetails(invoice)}
                        title="View Details"
                      >
                        👁️ View
                      </button>
                      <button 
                        style={{ ...styles.actionBtn, ...styles.primaryBtn }}
                        onClick={() => exportSavedInvoice(invoice)}
                        title="Export PDF"
                      >
                        📄 PDF
                      </button>
                      <button 
                        style={{ ...styles.actionBtn, ...styles.dangerBtn }}
                        onClick={() => deleteInvoice(invoice.id)}
                        title="Delete"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {savedInvoices.length === 0 && !modalOpen && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ marginBottom: 8 }}>No saved invoices yet</div>
          <div style={styles.small}>Create and save your first invoice to see it here</div>
        </div>
      )}
    </div>
  );
}