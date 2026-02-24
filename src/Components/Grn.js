import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { 
  FaEye, FaSearch, FaFileInvoice, FaBuilding, FaUser, 
  FaBox, FaTag, FaBarcode, FaRulerCombined, FaRupeeSign,
  FaHashtag, FaReceipt, FaCopy, FaCalendarAlt,
  FaCheckCircle, FaFileAlt, FaClipboardCheck, FaExternalLinkAlt
} from "react-icons/fa";

const GRNPage = () => {
  const todayDate = new Date().toISOString().slice(0, 10);
  
  const [poNumber, setPoNumber] = useState("");
  const [poDetails, setPoDetails] = useState(null);
  const [grnList, setGrnList] = useState([]);
  const [openPopup, setOpenPopup] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInvoice, setFilterInvoice] = useState("");
  const [mobileView, setMobileView] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  
  // New state for completed POs
  const [completedPOs, setCompletedPOs] = useState([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  
  // Check if mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Fetch completed POs and GRN list on component mount
  useEffect(() => {
    fetchCompletedPOs();
    fetchGRN();
  }, []);
  
  // Fetch completed purchase orders
  const fetchCompletedPOs = async () => {
    setLoadingPOs(true);
    try {
      const res = await axios.get("http://localhost:5000/api/grn/completed-po");
      if (res.data.success) {
        setCompletedPOs(res.data.data);
      }
    } catch (err) {
      console.log("Error loading completed POs", err);
      toast.error("Error loading completed purchase orders");
    } finally {
      setLoadingPOs(false);
    }
  };
  
  // Fetch GRN records
  const fetchGRN = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/grn/all");
      if (res.data.success) setGrnList(res.data.data);
    } catch (err) {
      console.log("Error loading GRN", err);
      toast.error("Error loading GRN records");
    }
  };
  
  // Handle PO selection from buttons
  const handlePOSelect = (poNumber) => {
    setPoNumber(poNumber);
    fetchPODetails(poNumber);
  };
  
  // Fetch PO details by PO number
  const fetchPODetails = async (poNum = null) => {
    const poToFetch = poNum || poNumber;
    
    if (!poToFetch.trim()) {
      toast.error("Please enter or select a PO Number");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/grn/get-po/${poToFetch}`);
      
      if (res.data.success) {
        const poData = res.data.data;
        setPoDetails(poData);
        toast.success("PO details loaded successfully!");
        
        // Initialize selected items (all items selected by default) with batch codes
        if (poData.items && poData.items.length > 0) {
          const itemsWithBatch = poData.items.map((item, index) => ({
            ...item,
            selected: true,
            batch_code: "",
            hsn_code: item.hsn_code || "",
            brand_description: item.brand_description || "",
            buy_price: item.buy_price || 0,
            brand: item.brand || "",
            brand_code: item.brand_code || "",
            index: index
          }));
          setSelectedItems(itemsWithBatch);
        }
        
        // Open the popup
        setOpenPopup(true);
      } else {
        toast.error(res.data.message || "PO not found or not completed");
        setPoDetails(null);
      }
    } catch (err) {
      toast.error("Error fetching PO details");
      console.error("Error fetching PO:", err);
      setPoDetails(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate batch code
  const generateBatchCode = (brand, date, index) => {
    // Get first 3 letters of brand (uppercase)
    const brandPrefix = (brand || "GEN").substring(0, 3).toUpperCase();
    
    // Format date as YYYYMMDD
    const formattedDate = date.replace(/-/g, "");
    
    // Generate sequence number with leading zeros
    const sequence = String(index + 1).padStart(3, '0');
    
    // Combine: BRAND-YYYYMMDD-001
    return `${brandPrefix}-${formattedDate}-${sequence}`;
  };
  
  // Generate batch codes for all selected items
  const generateBatchCodes = () => {
    const today = todayDate;
    
    // Count items per brand for the day
    const brandCounts = {};
    
    const updatedItems = selectedItems.map((item, index) => {
      const brand = item.brand || "GENERIC";
      const brandKey = `${brand}_${today}`;
      
      if (!brandCounts[brandKey]) {
        brandCounts[brandKey] = 0;
      }
      brandCounts[brandKey]++;
      
      const batchNumber = brandCounts[brandKey];
      const batchCode = generateBatchCode(brand, today, batchNumber - 1);
      
      return {
        ...item,
        batch_code: batchCode
      };
    });
    
    setSelectedItems(updatedItems);
    toast.success("Batch codes generated successfully!");
  };
  
  // Generate batch code for specific item
  const generateItemBatchCode = (index) => {
    const item = selectedItems[index];
    if (!item.brand) {
      toast.error("Please enter brand name for this item first");
      return;
    }
    
    const today = todayDate;
    
    // Count how many items have the same brand today
    const sameBrandItems = selectedItems.filter((it, idx) => 
      it.brand === item.brand && idx <= index
    );
    
    const batchNumber = sameBrandItems.length;
    const batchCode = generateBatchCode(item.brand, today, batchNumber - 1);
    
    const updatedItems = [...selectedItems];
    updatedItems[index].batch_code = batchCode;
    setSelectedItems(updatedItems);
  };
  
  // Toggle item selection
  const toggleItemSelection = (index) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].selected = !updatedItems[index].selected;
    setSelectedItems(updatedItems);
  };
  
  // Select all items
  const selectAllItems = () => {
    const updatedItems = selectedItems.map(item => ({
      ...item,
      selected: true
    }));
    setSelectedItems(updatedItems);
  };
  
  // Deselect all items
  const deselectAllItems = () => {
    const updatedItems = selectedItems.map(item => ({
      ...item,
      selected: false
    }));
    setSelectedItems(updatedItems);
  };
  
  // Handle item field changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...selectedItems];
    updatedItems[index][field] = value;
    setSelectedItems(updatedItems);
  };
  
  // Copy batch code to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Batch code copied to clipboard!"))
      .catch(() => toast.error("Failed to copy"));
  };
  
  // Submit GRN from PO
  const handleSubmitGRN = async () => {
    // Filter selected items
    const itemsToSubmit = selectedItems
      .filter(item => item.selected)
      .map(item => {
        const { selected, index, ...itemData } = item;
        return {
          ...itemData,
          batch_code: item.batch_code || generateBatchCode(item.brand || "GEN", todayDate, 0),
          hsn_code: item.hsn_code || "",
          brand_description: item.brand_description || "",
          buy_price: parseFloat(item.buy_price) || 0,
          length: item.length || "",
          width: item.width || ""
        };
      });
    
    if (itemsToSubmit.length === 0) {
      toast.error("Please select at least one item");
      return;
    }
    
    // Validate batch codes
    const batchCodes = itemsToSubmit.map(item => item.batch_code);
    const uniqueBatchCodes = new Set(batchCodes);
    
    if (batchCodes.length !== uniqueBatchCodes.size) {
      toast.error("Duplicate batch codes detected! Please regenerate unique codes.");
      return;
    }
    
    try {
      const payload = {
        po_number: poNumber,
        items: itemsToSubmit
      };
      
      const res = await axios.post("http://localhost:5000/api/grn/save-from-po", payload);
      
      if (res.data.success) {
        toast.success(res.data.message);
        setInvoiceNumber(res.data.invoice_number);
        
        // Update completed POs list
        await fetchCompletedPOs();
        
        // Reset and close
        setTimeout(() => {
          setOpenPopup(false);
          setPoDetails(null);
          setPoNumber("");
          setSelectedItems([]);
          setInvoiceNumber("");
          fetchGRN(); // Refresh GRN list
        }, 2000);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Error creating GRN");
      console.error("Error submitting GRN:", err);
    }
  };
  
  // View GRN details by invoice
  const viewGRNByInvoice = async (invoiceNumber) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/grn/invoice/${invoiceNumber}`);
      
      if (res.data.success) {
        setViewData(res.data.data);
      }
    } catch (err) {
      toast.error("Error loading GRN details");
      console.error(err);
    }
  };
  
  // Filter GRN list
  const filteredGRNList = grnList.filter(item => {
    const matchesSearch = searchTerm ? 
      item.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hsn_code?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    const matchesInvoice = filterInvoice ? 
      item.invoice_number === filterInvoice : true;
    
    return matchesSearch && matchesInvoice;
  });
  
  // Get unique invoice numbers
  const uniqueInvoices = [...new Set(grnList.map(item => item.invoice_number))].sort();
  
  // Group GRN by invoice
  const groupedGRN = filteredGRNList.reduce((acc, item) => {
    if (!acc[item.invoice_number]) {
      acc[item.invoice_number] = {
        invoice_number: item.invoice_number,
        invoice_date: item.invoice_date,
        po_number: item.po_number,
        company_name: item.company_name,
        customer_name: item.customer_name,
        gst_number: item.gst_number,
        items: [],
        total_amount: 0,
        item_count: 0
      };
    }
    acc[item.invoice_number].items.push(item);
    acc[item.invoice_number].total_amount += (item.quantity * item.buy_price);
    acc[item.invoice_number].item_count++;
    return acc;
  }, {});
  
  // Mobile Card View for GRN List
  const MobileGRNCard = ({ invoice }) => {
    const isExpanded = expandedInvoice === invoice.invoice_number;
    
    return (
      <div className="card mb-3 border-primary">
        <div className="card-header bg-light py-2 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <FaFileInvoice className="text-primary" />
            <span className="fw-bold text-primary">{invoice.invoice_number}</span>
          </div>
          <span className="badge bg-secondary">{invoice.item_count} items</span>
        </div>
        
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-6">
              <small className="text-muted d-block">
                <FaCalendarAlt className="me-1" size={12} />
                {invoice.invoice_date}
              </small>
            </div>
            <div className="col-6">
              <small className="text-muted d-block">
                <FaReceipt className="me-1" size={12} />
                {invoice.po_number}
              </small>
            </div>
            <div className="col-12">
              <small className="text-muted d-block">
                <FaBuilding className="me-1" size={12} />
                {invoice.company_name}
              </small>
            </div>
            <div className="col-12">
              <small className="text-muted d-block">
                <FaUser className="me-1" size={12} />
                {invoice.customer_name}
              </small>
            </div>
            <div className="col-8">
              <small className="fw-bold text-success">
                <FaRupeeSign className="me-1" />
                {parseFloat(invoice.total_amount).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </small>
            </div>
            <div className="col-4 text-end">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => viewGRNByInvoice(invoice.invoice_number)}
              >
                <FaEye /> View
              </button>
            </div>
          </div>
          
          <button
            className="btn btn-link btn-sm text-decoration-none p-0 mt-2"
            onClick={() => setExpandedInvoice(isExpanded ? null : invoice.invoice_number)}
          >
            {isExpanded ? '▲ Show less' : '▼ Show items'}
          </button>
          
          {isExpanded && (
            <div className="mt-2 border-top pt-2">
              {invoice.items.map((item, idx) => (
                <div key={idx} className="mb-2 pb-2 border-bottom">
                  <div className="fw-bold small">{item.item_name}</div>
                  <div className="row g-1 mt-1">
                    <div className="col-6">
                      <small className="text-muted d-block">
                        <FaTag className="me-1" size={10} />
                        {item.brand || 'N/A'}
                      </small>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">
                        <FaHashtag className="me-1" size={10} />
                        {item.hsn_code || 'N/A'}
                      </small>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">
                        Qty: {item.quantity}
                      </small>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">
                        <FaRupeeSign className="me-1" size={10} />
                        {(item.quantity * item.buy_price).toFixed(2)}
                      </small>
                    </div>
                    <div className="col-12">
                      <small className="badge bg-dark text-white">
                        Batch: {item.batch_code}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="container-fluid mt-2 mt-md-4 px-2 px-md-3">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="card shadow border-0">
        <div className="card-header bg-primary text-white py-2 py-md-3">
          <h3 className="mb-0 fs-5 fs-md-3">
            <FaFileInvoice className="me-2" />
            {mobileView ? "GRN Management" : "GRN (Goods Receipt Note) Management"}
          </h3>
        </div>
        
        <div className="card-body p-2 p-md-3">
          {/* PO Search Section */}
          <div className="row mb-3">
            <div className="col-12">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={mobileView ? "Enter PO Number" : "Enter PO Number (e.g., PO-202401-001)"}
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && fetchPODetails()}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => fetchPODetails()}
                  disabled={loading || !poNumber.trim()}
                  style={{ whiteSpace: mobileView ? 'nowrap' : 'normal' }}
                >
                  {loading ? "..." : mobileView ? "Fetch" : "Fetch PO"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Completed Purchase Orders Section */}
          <div className="card mb-4 border-primary">
            <div className="card-header bg-light py-2 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-primary fs-6">
                <FaCheckCircle className="me-2" />
                {mobileView ? "Completed POs" : "Completed Purchase Orders Ready for GRN"}
              </h5>
              <span className="badge bg-primary">
                {completedPOs.length}
              </span>
            </div>
            <div className="card-body p-2">
              {loadingPOs ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 small">Loading...</p>
                </div>
              ) : completedPOs.length === 0 ? (
                <div className="text-center py-4">
                  <FaFileAlt className="text-muted mb-2" size={32} />
                  <h6 className="text-muted small">No completed POs found</h6>
                </div>
              ) : (
                <div className="row g-2">
                  {completedPOs.map((po) => (
                    <div key={po.id} className="col-12 col-md-4 mb-2">
                      <div className={`card h-100 ${po.has_grn ? 'border-success' : 'border-warning'}`}>
                        <div className="card-body p-2">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="card-title fw-bold small text-truncate mb-0">
                              <FaReceipt className="me-1" />
                              {mobileView ? po.po_number.slice(0, 8) + '...' : po.po_number}
                            </h6>
                            <span className={`badge ${po.has_grn ? 'bg-success' : 'bg-warning'} small`}>
                              {po.has_grn ? 'Done' : 'Ready'}
                            </span>
                          </div>
                          
                          <div className="mb-1">
                            <p className="mb-0 small">
                              <FaBuilding className="me-1" size={10} />
                              {mobileView ? po.company_name.slice(0, 10) + '...' : po.company_name}
                            </p>
                            <p className="mb-0 small">
                              <FaBox className="me-1" size={10} />
                              {po.items?.length || 0} items
                            </p>
                          </div>
                          
                          {po.has_grn ? (
                            <button
                              className="btn btn-outline-success btn-sm w-100"
                              onClick={() => viewGRNByInvoice(po.grn_invoice)}
                            >
                              <FaExternalLinkAlt className="me-1" size={10} />
                              View GRN
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm w-100"
                              onClick={() => handlePOSelect(po.po_number)}
                            >
                              <FaClipboardCheck className="me-1" size={10} />
                              Convert
                            </button>
                          )}
                        </div>
                        {!mobileView && (
                          <div className="card-footer bg-transparent border-0 pt-0">
                            <small className="text-muted">
                              Total: ₹{parseFloat(po.total_amount || 0).toLocaleString('en-IN')}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Success Message with Invoice Number */}
          {invoiceNumber && (
            <div className="alert alert-success alert-dismissible fade show py-2">
              <small>
                <strong>Success!</strong> GRN: <strong>{invoiceNumber}</strong>
              </small>
              <button type="button" className="btn-close btn-close-sm" onClick={() => setInvoiceNumber("")}></button>
            </div>
          )}
          
          {/* GRN List Section */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light py-2">
              <h5 className="mb-0 fw-bold fs-6">
                <FaFileInvoice className="me-2" />
                GRN Records
              </h5>
            </div>
            <div className="card-body p-2">
              {/* GRN Search and Filters */}
              <div className="row mb-3 g-2">
                <div className="col-12 col-md-4">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={mobileView ? "Search..." : "Search Invoice, PO, Customer..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-8 col-md-3">
                  <select 
                    className="form-select form-select-sm" 
                    value={filterInvoice}
                    onChange={(e) => setFilterInvoice(e.target.value)}
                  >
                    <option value="">All Invoices</option>
                    {uniqueInvoices.map(invoice => (
                      <option key={invoice} value={invoice}>
                        {mobileView ? invoice.slice(0, 8) + '...' : invoice}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-4 col-md-5 text-end">
                  <small className="text-muted">
                    {mobileView ? (
                      <>{Object.keys(groupedGRN).length} invoices</>
                    ) : (
                      <>Total: {grnList.length} | Invoices: {Object.keys(groupedGRN).length}</>
                    )}
                  </small>
                </div>
              </div>
              
              {/* GRN List - Mobile Card View */}
              {mobileView ? (
                <div className="grn-mobile-list">
                  {Object.keys(groupedGRN).length === 0 ? (
                    <div className="text-center py-4">
                      <FaFileInvoice className="text-muted mb-2" size={32} />
                      <p className="text-muted small">No GRN records found</p>
                    </div>
                  ) : (
                    Object.values(groupedGRN).map((invoice) => (
                      <MobileGRNCard key={invoice.invoice_number} invoice={invoice} />
                    ))
                  )}
                </div>
              ) : (
                /* Desktop Table View */
                <div className="table-responsive">
                  <table className="table table-hover table-bordered table-sm">
                    <thead className="table-dark">
                      <tr>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>PO Number</th>
                        <th>Company</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Batch Codes</th>
                        <th>Total Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(groupedGRN).length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center py-4">
                            <div className="text-muted">
                              <FaFileInvoice className="fa-2x mb-2" />
                              <p>No GRN records found</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        Object.values(groupedGRN).map((invoice) => (
                          <tr key={invoice.invoice_number}>
                            <td className="fw-bold text-primary">
                              <FaFileInvoice className="me-1" />
                              {invoice.invoice_number}
                            </td>
                            <td>
                              <FaCalendarAlt className="me-1 text-secondary" />
                              {invoice.invoice_date}
                            </td>
                            <td>
                              <FaReceipt className="me-1 text-secondary" />
                              {invoice.po_number}
                            </td>
                            <td>
                              <FaBuilding className="me-1" />
                              {invoice.company_name}
                            </td>
                            <td>
                              <FaUser className="me-1" />
                              {invoice.customer_name}
                            </td>
                            <td>
                              <span className="badge bg-secondary">
                                <FaBox className="me-1" />
                                {invoice.item_count} items
                              </span>
                            </td>
                            <td>
                              <div className="batch-codes">
                                {invoice.items.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="text-truncate" style={{ maxWidth: '120px' }}>
                                    <small className="badge bg-info text-dark">
                                      {item.batch_code}
                                    </small>
                                  </div>
                                ))}
                                {invoice.item_count > 2 && (
                                  <div className="text-muted">
                                    <small>+ {invoice.item_count - 2} more</small>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="fw-bold">
                              <FaRupeeSign className="me-1 text-success" />
                              {parseFloat(invoice.total_amount).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                            <td>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => viewGRNByInvoice(invoice.invoice_number)}
                                title="View Details"
                              >
                                <FaEye />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* CREATE GRN POPUP MODAL */}
      {openPopup && poDetails && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-scrollable modal-fullscreen-md-down modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-success text-white py-2">
                <h5 className="modal-title fs-6">
                  <FaFileInvoice className="me-2" />
                  {mobileView ? `GRN: ${poNumber}` : `Create GRN from PO: ${poNumber}`}
                </h5>
                <button type="button" className="btn-close btn-close-white btn-sm" onClick={() => setOpenPopup(false)}></button>
              </div>
              
              <div className="modal-body p-2">
                {/* PO Information - Mobile Optimized */}
                <div className="card mb-3">
                  <div className="card-header bg-light py-2">
                    <h6 className="mb-0 fw-bold small">PO Information</h6>
                  </div>
                  <div className="card-body p-2">
                    <div className="row g-1">
                      <div className="col-6">
                        <small className="text-muted">PO Number:</small>
                        <div className="fw-bold small">{poDetails.po_number}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Date:</small>
                        <div className="small">{poDetails.po_date?.slice(0, 10)}</div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">Company:</small>
                        <div className="small">{poDetails.company_name}</div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">Customer:</small>
                        <div className="small">{poDetails.customer_name}</div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">GST:</small>
                        <div className="small">{poDetails.gst_number || "N/A"}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Batch Code Generator */}
                <div className="card mb-3">
                  <div className="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold small">Batch Codes</h6>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={generateBatchCodes}
                    >
                      <FaCopy className="me-1" size={10} />
                      {mobileView ? "Generate" : "Generate All"}
                    </button>
                  </div>
                  <div className="card-body p-2">
                    <div className="alert alert-info py-1 px-2 mb-0">
                      <small>Format: BRAND-YYYYMMDD-001</small>
                    </div>
                  </div>
                </div>
                
                {/* Items Selection - Mobile Card View */}
                <div className="card mb-3">
                  <div className="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold small">Items ({selectedItems.filter(i => i.selected).length} selected)</h6>
                    <div>
                      <button className="btn btn-sm btn-outline-success me-1" onClick={selectAllItems}>
                        All
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={deselectAllItems}>
                        None
                      </button>
                    </div>
                  </div>
                  <div className="card-body p-2">
                    {selectedItems.map((item, index) => (
                      <div 
                        key={index} 
                        className={`card mb-2 ${item.selected ? 'border-success' : ''}`}
                        style={{ backgroundColor: item.selected ? '#f0fff4' : 'white' }}
                      >
                        <div className="card-body p-2">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div className="d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => toggleItemSelection(index)}
                                className="form-check-input mt-0"
                              />
                              <span className="fw-bold small">{item.item_name}</span>
                            </div>
                            <span className="badge bg-secondary">Qty: {item.quantity}</span>
                          </div>
                          
                          <div className="row g-1 mt-1">
                            <div className="col-6">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.brand || ""}
                                onChange={(e) => handleItemChange(index, 'brand', e.target.value)}
                                placeholder="Brand"
                                size="10"
                              />
                            </div>
                            <div className="col-6">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.brand_code || ""}
                                onChange={(e) => handleItemChange(index, 'brand_code', e.target.value)}
                                placeholder="Code"
                              />
                            </div>
                            <div className="col-6">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.hsn_code || ""}
                                onChange={(e) => handleItemChange(index, 'hsn_code', e.target.value)}
                                placeholder="HSN"
                              />
                            </div>
                            <div className="col-6">
                              <div className="d-flex">
                                <input
                                  type="text"
                                  className="form-control form-control-sm me-1"
                                  value={item.length || ""}
                                  onChange={(e) => handleItemChange(index, 'length', e.target.value)}
                                  placeholder="L"
                                />
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={item.width || ""}
                                  onChange={(e) => handleItemChange(index, 'width', e.target.value)}
                                  placeholder="W"
                                />
                              </div>
                            </div>
                            <div className="col-8">
                              <div className="input-group input-group-sm">
                                <span className="input-group-text">
                                  <FaRupeeSign size={10} />
                                </span>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={item.buy_price || ""}
                                  onChange={(e) => handleItemChange(index, 'buy_price', e.target.value)}
                                  placeholder="Price"
                                />
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="fw-bold text-success small text-end">
                                <FaRupeeSign size={8} />
                                {(item.quantity * (parseFloat(item.buy_price) || 0)).toFixed(0)}
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="d-flex gap-1">
                                <input
                                  type="text"
                                  className="form-control form-control-sm flex-grow-1"
                                  value={item.batch_code || ""}
                                  onChange={(e) => handleItemChange(index, 'batch_code', e.target.value.toUpperCase())}
                                  placeholder="Batch Code"
                                />
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => generateItemBatchCode(index)}
                                  title="Generate"
                                >
                                  Gen
                                </button>
                                {item.batch_code && (
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => copyToClipboard(item.batch_code)}
                                    title="Copy"
                                  >
                                    <FaCopy size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="alert alert-warning mt-2 py-1 px-2">
                      <small>
                        <strong>Note:</strong> Ensure unique batch codes
                      </small>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer py-2">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleSubmitGRN}
                  disabled={selectedItems.filter(item => item.selected).length === 0}
                >
                  <FaFileInvoice className="me-2" size={12} />
                  Create GRN
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setOpenPopup(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* VIEW GRN DETAILS MODAL */}
      {viewData && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-scrollable modal-fullscreen-md-down modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h5 className="modal-title fs-6">
                  <FaFileInvoice className="me-2" />
                  {mobileView ? `GRN: ${viewData[0]?.invoice_number}` : `GRN Details - ${viewData[0]?.invoice_number}`}
                </h5>
                <button type="button" className="btn-close btn-close-white btn-sm" onClick={() => setViewData(null)}></button>
              </div>
              
              <div className="modal-body p-2">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-2">
                    {/* Mobile View Details */}
                    {mobileView ? (
                      <div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="fw-bold text-primary mb-0">
                              {viewData[0]?.invoice_number}
                            </h6>
                            <span className="badge bg-secondary">{viewData.length} items</span>
                          </div>
                          <div className="row g-1">
                            <div className="col-6">
                              <small className="text-muted">PO:</small>
                              <div className="small">{viewData[0]?.po_number}</div>
                            </div>
                            <div className="col-6">
                              <small className="text-muted">Date:</small>
                              <div className="small">{viewData[0]?.invoice_date}</div>
                            </div>
                            <div className="col-12">
                              <small className="text-muted">Company:</small>
                              <div className="small">{viewData[0]?.company_name}</div>
                            </div>
                            <div className="col-12">
                              <small className="text-muted">Customer:</small>
                              <div className="small">{viewData[0]?.customer_name}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-top pt-2">
                          <h6 className="fw-bold small mb-2">Items</h6>
                          {viewData.map((item, index) => (
                            <div key={index} className="card mb-2 bg-light">
                              <div className="card-body p-2">
                                <div className="fw-bold small">{item.item_name}</div>
                                <div className="row g-1 mt-1">
                                  <div className="col-6">
                                    <small className="text-muted d-block">
                                      Brand: {item.brand || '-'}
                                    </small>
                                  </div>
                                  <div className="col-6">
                                    <small className="text-muted d-block">
                                      HSN: {item.hsn_code || '-'}
                                    </small>
                                  </div>
                                  <div className="col-6">
                                    <small className="text-muted d-block">
                                      Qty: {item.quantity}
                                    </small>
                                  </div>
                                  <div className="col-6">
                                    <small className="text-muted d-block">
                                      Price: ₹{parseFloat(item.buy_price).toFixed(2)}
                                    </small>
                                  </div>
                                  <div className="col-12 mt-1">
                                    <small className="badge bg-dark">
                                      Batch: {item.batch_code}
                                    </small>
                                    <button
                                      className="btn btn-sm btn-outline-info ms-2"
                                      onClick={() => copyToClipboard(item.batch_code)}
                                    >
                                      <FaCopy size={10} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <div className="d-flex justify-content-between align-items-center mt-2 p-2 bg-success bg-opacity-10 rounded">
                            <span className="fw-bold small">Total Amount:</span>
                            <span className="fw-bold text-success">
                              <FaRupeeSign className="me-1" size={12} />
                              {viewData.reduce((total, item) => total + (item.quantity * item.buy_price), 0).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Desktop View */
                      <>
                        <div className="row mb-4">
                          <div className="col-md-6">
                            <h4 className="text-primary fw-bold">
                              <FaFileInvoice className="me-2" />
                              {viewData[0]?.invoice_number}
                            </h4>
                            <p>
                              <strong>PO Number:</strong> 
                              <span className="badge bg-secondary ms-2">{viewData[0]?.po_number}</span>
                            </p>
                            <p>
                              <strong>Invoice Date:</strong> 
                              <FaCalendarAlt className="me-1 ms-2" />
                              {viewData[0]?.invoice_date}
                            </p>
                            <p>
                              <strong><FaBuilding className="me-1" /> Company:</strong> {viewData[0]?.company_name}
                            </p>
                            <p><strong>Address:</strong> {viewData[0]?.company_address}</p>
                            <p><strong>GST:</strong> {viewData[0]?.gst_number || 'N/A'}</p>
                          </div>
                          <div className="col-md-6">
                            <p>
                              <strong><FaUser className="me-1" /> Customer:</strong> {viewData[0]?.customer_name}
                            </p>
                            <p><strong>Mobile:</strong> {viewData[0]?.customer_mobile}</p>
                            <p><strong>Email:</strong> {viewData[0]?.customer_email}</p>
                            <p><strong>Department:</strong> {viewData[0]?.department}</p>
                            <p><strong>Created:</strong> {viewData[0]?.created_on?.slice(0, 16)}</p>
                          </div>
                        </div>
                        
                        <div className="border-top pt-3">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">
                              <FaBox className="me-2" />
                              Items ({viewData.length})
                            </h6>
                            <div className="text-muted">
                              Total Amount: 
                              <span className="fw-bold text-success ms-2">
                                <FaRupeeSign className="me-1" />
                                {viewData.reduce((total, item) => total + (item.quantity * item.buy_price), 0).toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                              <thead className="table-light">
                                <tr>
                                  <th>#</th>
                                  <th>Item Name</th>
                                  <th>Brand</th>
                                  <th>Code</th>
                                  <th>Description</th>
                                  <th>HSN</th>
                                  <th>Size</th>
                                  <th>Unit</th>
                                  <th>Qty</th>
                                  <th>Buy Price</th>
                                  <th>Total</th>
                                  <th>Batch Code</th>
                                </tr>
                              </thead>
                              <tbody>
                                {viewData.map((item, index) => (
                                  <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td className="fw-bold">{item.item_name}</td>
                                    <td>{item.brand}</td>
                                    <td>{item.brand_code || '-'}</td>
                                    <td>{item.brand_description || '-'}</td>
                                    <td>
                                      {item.hsn_code ? (
                                        <span className="badge bg-info text-dark">
                                          <FaHashtag className="me-1" />
                                          {item.hsn_code}
                                        </span>
                                      ) : '-'}
                                    </td>
                                    <td>
                                      {item.length || item.width
                                        ? `${item.length || ''}${item.width ? '×' + item.width : ''}`
                                        : '-'
                                      }
                                    </td>
                                    <td>{item.unit}</td>
                                    <td>{item.quantity}</td>
                                    <td>
                                      <FaRupeeSign className="me-1" />
                                      {parseFloat(item.buy_price).toFixed(2)}
                                    </td>
                                    <td className="fw-bold text-success">
                                      <FaRupeeSign className="me-1" />
                                      {(item.quantity * item.buy_price).toFixed(2)}
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <span className="badge bg-dark fw-bold">
                                          {item.batch_code}
                                        </span>
                                        <button
                                          className="btn btn-sm btn-outline-info ms-2"
                                          onClick={() => copyToClipboard(item.batch_code)}
                                          title="Copy batch code"
                                        >
                                          <FaCopy />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="table-secondary">
                                <tr>
                                  <td colSpan="10" className="text-end fw-bold">Total Amount:</td>
                                  <td colSpan="2" className="fw-bold text-success">
                                    <FaRupeeSign className="me-1" />
                                    {viewData.reduce((total, item) => total + (item.quantity * item.buy_price), 0).toLocaleString('en-IN', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setViewData(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .modal-fullscreen-md-down {
            margin: 0.5rem;
            max-width: calc(100% - 1rem);
          }
          .btn {
            white-space: nowrap;
          }
          .input-group-text {
            padding: 0.25rem 0.5rem;
          }
          .table-responsive {
            font-size: 0.875rem;
          }
          .card-header {
            padding: 0.5rem;
          }
          .card-body {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default GRNPage;