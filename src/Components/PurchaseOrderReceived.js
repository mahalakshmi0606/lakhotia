import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { 
  FaReceipt, FaCheck, FaTimes, FaBox, FaRupeeSign, 
  FaCalendarAlt, FaBuilding, FaUser, FaTruck, 
  FaHistory, FaArrowLeft, FaSave, FaCalculator,
  FaClipboardCheck, FaRulerCombined
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:5000/api/purchase-orders";

const PurchaseOrderReceiptPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [receivingData, setReceivingData] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptHistory, setReceiptHistory] = useState(null);

  // Fetch approved POs that are not completed
  useEffect(() => {
    fetchApprovedPOs();
  }, []);

  const fetchApprovedPOs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/approved-not-completed`);
      if (res.data.success) {
        setPurchaseOrders(res.data.data);
      }
    } catch (err) {
      toast.error("Error loading purchase orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate count for an item (Length × Width × Quantity)
  const calculateCount = (length, width, quantity) => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const qty = parseFloat(quantity) || 0;
    
    if (l > 0 && w > 0 && qty > 0) {
      return l * w * qty;
    }
    return 0;
  };

  // Format count for display
  const formatCount = (count) => {
    if (count === 0 || count === null || count === undefined) return '-';
    return count.toFixed(2);
  };

  // Calculate received count based on received quantity
  const calculateReceivedCount = (item, receivedQuantity) => {
    const length = parseFloat(item.length) || 0;
    const width = parseFloat(item.width) || 0;
    const qty = parseFloat(receivedQuantity) || 0;
    
    if (length > 0 && width > 0 && qty > 0) {
      return length * width * qty;
    }
    return 0;
  };

  // Calculate pending count
  const calculatePendingCount = (item, pendingQuantity) => {
    const length = parseFloat(item.length) || 0;
    const width = parseFloat(item.width) || 0;
    const qty = parseFloat(pendingQuantity) || 0;
    
    if (length > 0 && width > 0 && qty > 0) {
      return length * width * qty;
    }
    return 0;
  };

  // Handle receiving items
  const handleReceiveItems = (po) => {
    setSelectedPO(po);
    
    // Initialize receiving data with default values
    const initialReceivingData = {};
    const initialRemarks = {};
    
    if (po.received_items && po.received_items.length > 0) {
      po.received_items.forEach((receivedItem) => {
        initialReceivingData[receivedItem.item_index] = 0;
        initialRemarks[receivedItem.item_index] = "";
      });
    } else {
      po.items.forEach((_, index) => {
        initialReceivingData[index] = 0;
        initialRemarks[index] = "";
      });
    }
    
    setReceivingData(initialReceivingData);
    setRemarks(initialRemarks);
    setShowReceiptModal(true);
  };

  // Update receiving quantity for an item
  const updateReceivingQuantity = (itemIndex, value) => {
    const maxQty = getPendingQuantity(itemIndex);
    const newValue = parseFloat(value) || 0;
    
    if (newValue <= maxQty) {
      setReceivingData({
        ...receivingData,
        [itemIndex]: newValue
      });
    } else {
      toast.warning(`Cannot receive more than ${maxQty} for this item`);
    }
  };

  // Get pending quantity for an item
  const getPendingQuantity = (itemIndex) => {
    const item = selectedPO.items[itemIndex];
    if (!item) return 0;
    
    if (selectedPO.received_items && selectedPO.received_items.length > 0) {
      const receivedItem = selectedPO.received_items.find(ri => ri.item_index === itemIndex);
      if (receivedItem) {
        return receivedItem.pending_quantity || 0;
      }
    }
    return item.quantity || 0;
  };

  // Get received quantity for an item
  const getReceivedQuantity = (itemIndex) => {
    if (selectedPO.received_items && selectedPO.received_items.length > 0) {
      const receivedItem = selectedPO.received_items.find(ri => ri.item_index === itemIndex);
      if (receivedItem) {
        return receivedItem.received_quantity || 0;
      }
    }
    return 0;
  };

  // Submit received items
  const submitReceipt = async () => {
    // Check if any items are being received
    const hasReceipts = Object.values(receivingData).some(qty => qty > 0);
    
    if (!hasReceipts) {
      toast.error("Please enter at least one item quantity to receive");
      return;
    }
    
    try {
      const receivedQuantities = selectedPO.items.map((item, index) => ({
        item_index: index,
        received_quantity: receivingData[index] || 0,
        remarks: remarks[index] || ""
      })).filter(item => item.received_quantity > 0);
      
      await axios.post(`${API_BASE_URL}/receive-items/${selectedPO.id}`, {
        received_quantities: receivedQuantities
      });
      
      toast.success("Items received successfully!");
      setShowReceiptModal(false);
      fetchApprovedPOs(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.error || "Error receiving items");
      console.error(err);
    }
  };

  // View receipt history
  const viewReceiptHistory = async (po) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/receipt-history/${po.id}`);
      if (res.data.success) {
        setReceiptHistory(res.data.data);
      }
    } catch (err) {
      toast.error("Error loading receipt history");
      console.error(err);
    }
  };

  // Calculate total ordered quantity
  const calculateTotalOrdered = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  };

  // Calculate total ordered count (based on dimensions)
  const calculateTotalOrderedCount = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      const count = calculateCount(item.length, item.width, item.quantity);
      return sum + count;
    }, 0);
  };

  // Calculate total received quantity
  const calculateTotalReceived = (receivedItems) => {
    if (!receivedItems) return 0;
    return receivedItems.reduce((sum, item) => sum + (parseFloat(item.received_quantity) || 0), 0);
  };

  // Calculate total received count
  const calculateTotalReceivedCount = (po) => {
    if (!po.received_items || !po.items) return 0;
    
    let totalCount = 0;
    po.received_items.forEach(receivedItem => {
      const item = po.items[receivedItem.item_index];
      if (item) {
        const count = calculateReceivedCount(item, receivedItem.received_quantity);
        totalCount += count;
      }
    });
    return totalCount;
  };

  // Calculate total pending quantity
  const calculateTotalPending = (receivedItems) => {
    if (!receivedItems) return 0;
    return receivedItems.reduce((sum, item) => sum + (parseFloat(item.pending_quantity) || 0), 0);
  };

  // Calculate total pending count
  const calculateTotalPendingCount = (po) => {
    if (!po.received_items || !po.items) return 0;
    
    let totalCount = 0;
    po.received_items.forEach(receivedItem => {
      const item = po.items[receivedItem.item_index];
      if (item) {
        const count = calculatePendingCount(item, receivedItem.pending_quantity);
        totalCount += count;
      }
    });
    return totalCount;
  };

  // Filter POs by search term
  const filteredPOs = purchaseOrders.filter(po => 
    po.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status badge class
  const getStatusBadgeClass = (receivedItems) => {
    if (!receivedItems) return 'bg-secondary';
    
    const totalPending = calculateTotalPending(receivedItems);
    if (totalPending === 0) return 'bg-success';
    return 'bg-warning';
  };

  const getStatusText = (receivedItems) => {
    if (!receivedItems) return 'Not Started';
    
    const totalPending = calculateTotalPending(receivedItems);
    if (totalPending === 0) return 'Fully Received';
    return 'Partially Received';
  };

  return (
    <div className="container-fluid mt-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="card shadow border-0">
        <div className="card-header bg-success text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <FaReceipt className="me-2" />
              Purchase Order Receipt Management
            </h3>
          </div>
        </div>

        <div className="card-body">
          {/* Search and Info */}

          <div className="row mb-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaBox className="text-success" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by PO #, Company, Customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-light">
                <div className="card-body py-2 text-center">
                  <small className="text-muted">Total POs to Receive</small>
                  <h5 className="mb-0 text-success">{filteredPOs.length}</h5>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Orders Table */}
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading purchase orders...</p>
              </div>
            ) : (
              <table className="table table-hover table-bordered">
                <thead className="table-dark">
                  <tr>
                    <th>PO Number</th>
                    <th>Date</th>
                    <th>Company / Customer</th>
                    <th>Items</th>
                    <th>Receipt Status</th>
                    <th>Ordered Qty</th>
                    <th>Received Qty</th>
                    <th>Pending Qty</th>
                    <th>Ordered Count</th>
                    <th>Received Count</th>
                    <th>Pending Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="text-center py-4">
                        <div className="text-muted">
                          <FaBox className="fa-2x mb-2" style={{ fontSize: '2rem' }} />
                          <p>No approved purchase orders found</p>
                          <small>Approved orders that are not completed will appear here</small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPOs.map((po) => {
                      const totalOrderedQty = calculateTotalOrdered(po.items);
                      const totalReceivedQty = calculateTotalReceived(po.received_items);
                      const totalPendingQty = calculateTotalPending(po.received_items);
                      const totalOrderedCount = calculateTotalOrderedCount(po.items);
                      const totalReceivedCount = calculateTotalReceivedCount(po);
                      const totalPendingCount = calculateTotalPendingCount(po);
                      const receiptProgress = totalOrderedQty > 0 ? (totalReceivedQty / totalOrderedQty) * 100 : 0;
                      
                      return (
                        <tr key={po.id}>
                          <td className="fw-bold text-success">{po.po_number}</td>
                          <td>
                            <FaCalendarAlt className="me-1 text-secondary" />
                            {po.po_date?.slice(0, 10)}
                          </td>
                          <td>
                            <div>
                              <strong>
                                <FaBuilding className="me-1" />
                                {po.company_name}
                              </strong>
                              <small className="d-block text-muted">
                                <FaUser className="me-1" />
                                {po.customer_name}
                              </small>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              <FaBox className="me-1" />
                              {po.items?.length} items
                            </span>
                            <div className="mt-1">
                              <small className="text-muted">
                                {po.items?.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="text-truncate" style={{ maxWidth: '200px' }}>
                                    • {item.item_name} (Qty: {item.quantity})
                                    {item.length && item.width && parseFloat(item.length) > 0 && parseFloat(item.width) > 0 && (
                                      <span className="ms-1 text-info">
                                        <FaRulerCombined className="me-1" />
                                        ({item.length}×{item.width})
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {po.items?.length > 2 && (
                                  <div className="text-muted">+ {po.items.length - 2} more</div>
                                )}
                              </small>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(po.received_items)}`}>
                              {getStatusText(po.received_items)}
                            </span>
                            {po.received_items && po.received_items.length > 0 && (
                              <div className="mt-1">
                                <div className="progress" style={{ height: '5px' }}>
                                  <div 
                                    className="progress-bar bg-success" 
                                    style={{ width: `${receiptProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="text-center fw-bold">{totalOrderedQty}</td>
                          <td className="text-center text-success fw-bold">{totalReceivedQty}</td>
                          <td className="text-center text-warning fw-bold">{totalPendingQty}</td>
                          <td className="text-center text-primary">
                            {formatCount(totalOrderedCount)}
                          </td>
                          <td className="text-center text-success">
                            {formatCount(totalReceivedCount)}
                          </td>
                          <td className="text-center text-warning">
                            {formatCount(totalPendingCount)}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-success"
                                onClick={() => handleReceiveItems(po)}
                                title="Receive Items"
                              >
                                <FaCheck className="me-1" />
                                Receive
                              </button>
                              <button
                                className="btn btn-outline-info"
                                onClick={() => viewReceiptHistory(po)}
                                title="View Receipt History"
                              >
                                <FaHistory />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {showReceiptModal && selectedPO && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <FaTruck className="me-2" />
                  Receive Items - {selectedPO.po_number}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReceiptModal(false)}></button>
              </div>

              <div className="modal-body">
                {/* Order Summary */}
                <div className="card mb-4 border-success">
                  <div className="card-header bg-light">
                    <h6 className="mb-0 fw-bold">Order Summary</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-1">
                          <strong>Company:</strong> {selectedPO.company_name}
                        </p>
                        <p className="mb-1">
                          <strong>Customer:</strong> {selectedPO.customer_name}
                        </p>
                        <p className="mb-1">
                          <strong>PO Date:</strong> {selectedPO.po_date?.slice(0, 10)}
                        </p>
                        {selectedPO.delivery_date && (
                          <p className="mb-1">
                            <strong>Delivery Date:</strong> {selectedPO.delivery_date?.slice(0, 10)}
                          </p>
                        )}
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1">
                          <strong>Total Amount:</strong> 
                          <span className="text-success fw-bold ms-2">
                            ₹{parseFloat(selectedPO.total_amount || 0).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </p>
                        <p className="mb-1">
                          <strong>Status:</strong>
                          <span className="badge bg-success ms-2">Approved</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items to Receive */}
                <h6 className="fw-bold mb-3">
                  <FaBox className="me-2 text-success" />
                  Items to Receive
                </h6>
                
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Brand</th>
                        <th>Dimensions (L×W)</th>
                        <th>Ordered Qty</th>
                        <th>Ordered Count</th>
                        <th>Already Received Qty</th>
                        <th>Already Received Count</th>
                        <th>Pending Qty</th>
                        <th>Pending Count</th>
                        <th>Unit</th>
                        <th>Receive Qty *</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPO.items.map((item, index) => {
                        const pendingQty = getPendingQuantity(index);
                        const receivedQty = getReceivedQuantity(index);
                        const orderedCount = calculateCount(item.length, item.width, item.quantity);
                        const receivedCount = calculateReceivedCount(item, receivedQty);
                        const pendingCount = calculatePendingCount(item, pendingQty);
                        const hasDimensions = item.length && item.width && 
                          parseFloat(item.length) > 0 && parseFloat(item.width) > 0;
                        
                        return (
                          <tr key={index}>
                            <td className="fw-bold text-center">{index + 1}</td>
                            <td className="fw-bold">{item.item_name}</td>
                            <td>{item.brand || '-'}</td>
                            <td className="text-center">
                              {hasDimensions ? (
                                <span className="badge bg-info">
                                  {item.length} × {item.width}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="text-center fw-bold">{item.quantity}</td>
                            <td className="text-center text-primary">
                              {formatCount(orderedCount)}
                            </td>
                            <td className="text-center text-success fw-bold">{receivedQty}</td>
                            <td className="text-center text-success">
                              {formatCount(receivedCount)}
                            </td>
                            <td className="text-center text-warning fw-bold">{pendingQty}</td>
                            <td className="text-center text-warning">
                              {formatCount(pendingCount)}
                            </td>
                            <td className="text-center">{item.unit || 'PCS'}</td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                min="0"
                                max={pendingQty}
                                step="1"
                                value={receivingData[index] || 0}
                                onChange={(e) => updateReceivingQuantity(index, e.target.value)}
                                disabled={pendingQty === 0}
                              />
                              {pendingQty > 0 && (
                                <small className="text-muted">
                                  Max: {pendingQty}
                                </small>
                              )}
                              {hasDimensions && receivingData[index] > 0 && (
                                <small className="text-info d-block">
                                  Count: {formatCount(calculateReceivedCount(item, receivingData[index]))}
                                </small>
                              )}
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Optional remarks"
                                value={remarks[index] || ""}
                                onChange={(e) => setRemarks({...remarks, [index]: e.target.value})}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Receipt Summary */}
                <div className="alert alert-info mt-3">
                  <div className="row">
                    <div className="col-md-3">
                      <strong>Total Ordered Qty:</strong> {calculateTotalOrdered(selectedPO.items)}
                    </div>
                    <div className="col-md-3">
                      <strong>Total Ordered Count:</strong> 
                      {formatCount(calculateTotalOrderedCount(selectedPO.items))}
                    </div>
                    <div className="col-md-3">
                      <strong>Already Received Qty:</strong> {calculateTotalReceived(selectedPO.received_items)}
                    </div>
                    <div className="col-md-3">
                      <strong>Receiving Now Qty:</strong> 
                      <span className="text-success fw-bold ms-2">
                        {Object.values(receivingData).reduce((sum, qty) => sum + (parseFloat(qty) || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-success"
                  onClick={submitReceipt}
                >
                  <FaSave className="me-2" />
                  Confirm Receipt
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT HISTORY MODAL */}
      {receiptHistory && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <FaHistory className="me-2" />
                  Receipt History - {receiptHistory.po_number}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setReceiptHistory(null)}></button>
              </div>

              <div className="modal-body">
                {receiptHistory.received_items && receiptHistory.received_items.length > 0 ? (
                  receiptHistory.received_items.map((item, idx) => {
                    const orderedCount = calculateCount(item.length, item.width, item.ordered_quantity);
                    return (
                      <div key={idx} className="card mb-3">
                        <div className="card-header bg-light">
                          <strong>{item.item_name}</strong>
                          {item.length && item.width && parseFloat(item.length) > 0 && parseFloat(item.width) > 0 && (
                            <span className="ms-2 badge bg-info">
                              {item.length}×{item.width}
                            </span>
                          )}
                          <span className="float-end">
                            Ordered: {item.ordered_quantity} | 
                            Received: {item.received_quantity} | 
                            Pending: {item.pending_quantity}
                          </span>
                        </div>
                        <div className="card-body">
                          {item.receipt_history && item.receipt_history.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-sm">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Quantity Received</th>
                                    <th>Count Received</th>
                                    <th>Remarks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.receipt_history.map((history, hidx) => {
                                    const receivedCount = calculateCount(item.length, item.width, history.quantity);
                                    return (
                                      <tr key={hidx}>
                                        <td>{new Date(history.date).toLocaleString()}</td>
                                        <td className="fw-bold text-success">{history.quantity}</td>
                                        <td className="text-primary">{formatCount(receivedCount)}</td>
                                        <td>{history.remarks || '-'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-muted mb-0">No receipts recorded for this item</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="alert alert-info">
                    No receipts recorded for this purchase order yet.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setReceiptHistory(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for progress bar */}
      <style jsx>{`
        .progress {
          background-color: #e9ecef;
          border-radius: 10px;
        }
        .progress-bar {
          transition: width 0.3s ease;
          border-radius: 10px;
        }
        .table td, .table th {
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
};

export default PurchaseOrderReceiptPage;