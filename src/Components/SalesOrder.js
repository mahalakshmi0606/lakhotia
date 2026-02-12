import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { 
  Modal, 
  Button, 
  Form, 
  Table, 
  Spinner, 
  Alert, 
  Badge, 
  Pagination, 
  Card, 
  Row, 
  Col,
  Container,
  InputGroup,
  FormControl
} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function QuotationModal() {
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [selectedItemForView, setSelectedItemForView] = useState(null);

  // Saved quotations state
  const [savedQuotations, setSavedQuotations] = useState([]);
  const [flattenedItems, setFlattenedItems] = useState([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Statistics
  const [quotationCounts, setQuotationCounts] = useState({
    all: 0,
    draft: 0,
    requote: 0,
    completed: 0,
  });

  // Item status update state
  const [updatingItemStatus, setUpdatingItemStatus] = useState(false);
  const [itemStatusUpdates, setItemStatusUpdates] = useState({});
  const [itemRejectionReasons, setItemRejectionReasons] = useState({});
  const [showItemStatusModal, setShowItemStatusModal] = useState(false);
  const [quotationForStatusUpdate, setQuotationForStatusUpdate] = useState(null);
  const [currentItemForStatusUpdate, setCurrentItemForStatusUpdate] = useState(null);

  // Rejection reason modal
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentRejectionItem, setCurrentRejectionItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Convert to Task state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedItemForTask, setSelectedItemForTask] = useState(null);
  const [isUpdatingExistingTask, setIsUpdatingExistingTask] = useState(false);
  const [existingTaskId, setExistingTaskId] = useState(null);
  const [taskFormData, setTaskFormData] = useState({
    po_number: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    assignedTo: "",
    note: "",
    quotation_id: "",
    quotation_number: "",
    company_name: "",
    company_address: "",
    item_id: "",
    item_name: "",
    supplier_part_no: "",
    cut_width: "",
    length: "",
    quantity: "",
    brand_code: "",
    batch_no: "",
    mrp: "",
    hsn_sac: "",
    unit: "",
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskError, setTaskError] = useState(null);
  
  // Employees for task assignment
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Stock cache for buy prices
  const [stockCache, setStockCache] = useState({});

  // Filter state
  const [statusFilter, setStatusFilter] = useState("all");

  // API base URLs
  const API_BASE_URL = "http://127.0.0.1:5000";
  const API_TASKS = `${API_BASE_URL}/api/tasks`;
  const API_EMPLOYEES = `${API_BASE_URL}/api/employee/all`;

  // Fetch saved quotations from backend on component mount
  useEffect(() => {
    fetchQuotations();
    fetchQuotationCounts();
    fetchEmployees();
  }, [currentPage, searchTerm]);

  // Fetch employees for task assignment
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await axios.get(API_EMPLOYEES);
      setEmployees(response.data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fetch buy prices in bulk for brand codes
  const fetchBulkBuyPrices = async (brandCodes) => {
    if (!brandCodes || brandCodes.length === 0) return {};
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/stock/bulk-buy-prices`, {
        brand_codes: brandCodes
      });
      
      if (response.data.success) {
        const priceMap = {};
        response.data.data.forEach(item => {
          priceMap[item.brand_code] = item.buy_price || 0;
        });
        
        // Update cache
        setStockCache(prev => ({ ...prev, ...priceMap }));
        
        return priceMap;
      }
    } catch (err) {
      console.error("Error fetching bulk buy prices:", err);
    }
    return {};
  };

  // Extract brand code from description
  const extractBrandCode = (description) => {
    if (!description) return "";
    
    try {
      if (description.includes('[BRAND_CODE:')) {
        const match = description.match(/\[BRAND_CODE:(.*?)\]/);
        return match ? match[1] : "";
      }
    } catch (e) {
      console.error("Error extracting brand code:", e);
    }
    return "";
  };

  // Extract customer description
  const extractCustomerDescription = (description) => {
    if (!description) return "";
    
    try {
      if (description.includes('[CUSTOMER_DESC:')) {
        const match = description.match(/\[CUSTOMER_DESC:(.*?)\]/);
        return match ? match[1] : "";
      }
    } catch (e) {
      console.error("Error extracting customer description:", e);
    }
    return "";
  };

  // Extract batch number from description or use item data
  const extractBatchNo = (item) => {
    if (item.batch_no) return item.batch_no;
    
    if (item.description && item.description.includes('[BATCH:')) {
      try {
        const match = item.description.match(/\[BATCH:(.*?)\]/);
        return match ? match[1] : "";
      } catch (e) {
        console.error("Error extracting batch no from description:", e);
      }
    }
    
    return "";
  };

  // Extract MRP from item
  const extractMRP = (item) => {
    return item.mrp || item.price_per_unit || 0;
  };

  // Extract HSN/SAC from item
  const extractHsnSac = (item) => {
    return item.hsn_sac || "";
  };

  // Clean description by removing metadata markers
  const cleanDescription = (description) => {
    if (!description) return "";
    
    try {
      return description
        .replace(/\[BRAND_CODE:.*?\]/g, '')
        .replace(/\[CUSTOMER_DESC:.*?\]/g, '')
        .replace(/\[BATCH:.*?\]/g, '')
        .trim();
    } catch (e) {
      console.error("Error cleaning description:", e);
      return description;
    }
  };

  // Auto-generate PO number
  const generatePONumber = (quotationNumber) => {
    const timestamp = new Date().getTime().toString().slice(-8);
    const quotePart = quotationNumber?.slice(-4) || "0000";
    return `PO-${timestamp}-${quotePart}`;
  };

  // Fetch existing task for an item
  const fetchExistingTaskForItem = async (itemId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tasks/by-item/${itemId}`);
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (err) {
      console.error("Error fetching existing task:", err);
      return null;
    }
  };

  // Fetch quotation counts by status
  const fetchQuotationCounts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/quotations/statistics`);
      if (response.data.success) {
        const counts = {
          all: response.data.data.total || 0,
          draft: response.data.data.status_counts?.draft || 0,
          requote: response.data.data.status_counts?.requote || 0,
          completed: response.data.data.status_counts?.completed || 0,
        };
        setQuotationCounts(counts);
      }
    } catch (err) {
      console.error("Error loading quotation counts:", err);
    }
  };

  // Flatten quotations into items array
  const flattenQuotationsToItems = (quotations) => {
    const items = [];
    
    quotations.forEach(quotation => {
      (quotation.items || []).forEach(item => {
        items.push({
          ...item,
          quotation_id: quotation.id,
          quotation_number: quotation.quote_number || quotation.quoteNo,
          quotation_date: quotation.date || quotation.date,
          quotation_time: quotation.time || quotation.time,
          company_name: quotation.company_name || quotation.billTo,
          company_address: quotation.company_address || "",
          company_gstin: quotation.company_gstin || "",
          contact_person: quotation.contact_person || quotation.contactPerson,
          contact_mobile: quotation.contact_mobile || quotation.contactMob,
          contact_email: quotation.contact_email || quotation.contactEmail,
          quotation_status: quotation.status || 'completed',
          quotation_grand_total: quotation.grand_total || quotation.totals?.grandTotal || 0
        });
      });
    });
    
    return items;
  };

  // Fetch saved quotations with pagination - ONLY COMPLETED
  const fetchQuotations = async () => {
    setLoadingQuotations(true);
    try {
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        status: 'completed'
      };
      
      if (searchTerm.trim()) {
        params.q = searchTerm.trim();
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/quotations`, { params });
      
      if (response.data.success) {
        const fetchedQuotations = response.data.data || [];
        const pagination = response.data.pagination || {};
        
        // Extract all unique brand codes from all quotations
        const allBrandCodes = [];
        fetchedQuotations.forEach(quotation => {
          (quotation.items || []).forEach(item => {
            const brandCode = extractBrandCode(item.description || "");
            if (brandCode) {
              allBrandCodes.push(brandCode);
            }
          });
        });
        
        // Fetch buy prices in bulk for all brand codes
        const buyPriceMap = await fetchBulkBuyPrices([...new Set(allBrandCodes)]);
        
        // Transform quotations with buy prices
        const quotationsWithBuyPrices = fetchedQuotations.map(quotation => {
          const transformedItems = (quotation.items || []).map(item => {
            const brandCode = extractBrandCode(item.description || "");
            const customerDescription = extractCustomerDescription(item.description || "");
            const cleanDesc = cleanDescription(item.description || "");
            const batchNo = extractBatchNo(item);
            const mrp = extractMRP(item);
            const hsnSac = extractHsnSac(item);
            
            const buyPrice = brandCode ? (buyPriceMap[brandCode] || 0) : 0;
            
            return {
              ...item,
              sales_order_item_status: item.sales_order_item_status || "not_created",
              brand_code: brandCode || "",
              customer_description: customerDescription || "",
              description: cleanDesc,
              buy_price: buyPrice,
              count: item.count || 1,
              packing_charges: item.packing_charges || 0,
              other_charges: item.other_charges || 0,
              batch_no: batchNo,
              mrp: mrp,
              hsn_sac: hsnSac,
              unit: item.unit || "",
              cut_width: item.cut_width || "",
              length: item.length || ""
            };
          });
          
          return {
            ...quotation,
            items: transformedItems
          };
        });
        
        setSavedQuotations(quotationsWithBuyPrices);
        
        // Flatten quotations to items array
        const flattened = flattenQuotationsToItems(quotationsWithBuyPrices);
        setFlattenedItems(flattened);
        
        setTotalItems(pagination.total || fetchedQuotations.length);
        setTotalPages(pagination.pages || Math.ceil((pagination.total || fetchedQuotations.length) / itemsPerPage) || 1);
      } else {
        throw new Error(response.data.message || "API response unsuccessful");
      }
    } catch (err) {
      console.error("Error loading quotations from API:", err);
      setSavedQuotations([]);
      setFlattenedItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoadingQuotations(false);
    }
  };

  // Reset search function
  const resetSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) items.push(i);
        items.push("...");
        items.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1);
        items.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) items.push(i);
      } else {
        items.push(1);
        items.push("...");
        items.push(currentPage - 1);
        items.push(currentPage);
        items.push(currentPage + 1);
        items.push("...");
        items.push(totalPages);
      }
    }
    
    return items;
  };

  // View quotation details in modal
  const viewQuotation = (quotation) => {
    setSelectedQuotation(quotation);
    setShowViewModal(true);
  };

  // View item details in modal
  const viewItemDetails = (item) => {
    setSelectedItemForView(item);
    // Find the full quotation for this item
    const quotation = savedQuotations.find(q => q.id === item.quotation_id);
    if (quotation) {
      setSelectedQuotation(quotation);
      setShowViewModal(true);
    }
  };

  // Open item status update modal for individual item
  const openSingleItemStatusModal = (item) => {
    const quotation = savedQuotations.find(q => q.id === item.quotation_id);
    if (!quotation) return;
    
    setQuotationForStatusUpdate(quotation);
    setCurrentItemForStatusUpdate(item);
    
    // Initialize status updates for this single item
    const initialUpdates = {};
    const initialRejectionReasons = {};
    initialUpdates[item.id] = item.sales_order_item_status || "not_created";
    initialRejectionReasons[item.id] = item.rejection_reason || "";
    
    setItemStatusUpdates(initialUpdates);
    setItemRejectionReasons(initialRejectionReasons);
    setShowItemStatusModal(true);
  };

  // Handle item status change
  const handleItemStatusChange = async (itemId, newStatus) => {
    if (newStatus === "rejected") {
      setCurrentRejectionItem({
        id: itemId,
        newStatus: newStatus
      });
      setShowRejectionModal(true);
    } else {
      setItemStatusUpdates(prev => ({
        ...prev,
        [itemId]: newStatus
      }));
    }
  };

  // Handle rejection reason submission
  const handleRejectionSubmit = async () => {
    if (!currentRejectionItem || !rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    const { id, newStatus } = currentRejectionItem;
    
    try {
      const loggedInUser = localStorage.getItem("username") || "Admin User";
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/quotations/items/${id}/rejection-reason`,
        {
          rejection_reason: rejectionReason,
          updated_by: loggedInUser
        }
      );
      
      if (response.data.success) {
        setItemStatusUpdates(prev => ({
          ...prev,
          [id]: newStatus
        }));
        
        setItemRejectionReasons(prev => ({
          ...prev,
          [id]: rejectionReason
        }));
        
        setShowRejectionModal(false);
        setCurrentRejectionItem(null);
        setRejectionReason("");
        
        console.log("✅ Item rejected with reason:", rejectionReason);
      } else {
        throw new Error(response.data.message || "Failed to update rejection reason");
      }
    } catch (err) {
      console.error("❌ Error updating rejection reason:", err);
      alert("Failed to update rejection reason. Please try again.");
    }
  };

  // Update item statuses
  const updateItemStatuses = async () => {
    if (!quotationForStatusUpdate) return;
    
    setUpdatingItemStatus(true);
    
    try {
      const loggedInUser = localStorage.getItem("username") || "Admin User";
      
      const updates = [];
      
      for (const [itemId, salesOrderItemStatus] of Object.entries(itemStatusUpdates)) {
        const updateData = {
          id: parseInt(itemId),
          sales_order_item_status: salesOrderItemStatus
        };
        
        if (salesOrderItemStatus === "rejected" && itemRejectionReasons[itemId]) {
          updateData.rejection_reason = itemRejectionReasons[itemId];
        }
        
        if (salesOrderItemStatus === "ordered") {
          updateData.sales_order_created = true;
        }
        
        updates.push(updateData);
      }
      
      const response = await axios.put(
        `${API_BASE_URL}/api/quotations/${quotationForStatusUpdate.id}/items/status`,
        {
          item_updates: updates,
          updated_by: loggedInUser
        }
      );
      
      if (response.data.success) {
        alert(`✅ Item statuses updated successfully!`);
        
        const refreshedResponse = await axios.get(`${API_BASE_URL}/api/quotations/${quotationForStatusUpdate.id}`);
        if (refreshedResponse.data.success) {
          setSelectedQuotation(refreshedResponse.data.data);
          await fetchQuotations();
        }
        
        setShowItemStatusModal(false);
        setQuotationForStatusUpdate(null);
        setCurrentItemForStatusUpdate(null);
        setItemStatusUpdates({});
        setItemRejectionReasons({});
      } else {
        throw new Error(response.data.message || "Failed to update item statuses");
      }
    } catch (err) {
      console.error("Update item statuses failed:", err);
      alert("Failed to update item statuses. Please try again.");
    } finally {
      setUpdatingItemStatus(false);
    }
  };

  // Open Task Creation/Update Modal
  const openTaskModal = async (item, quotation) => {
    const loggedInUser = localStorage.getItem("username") || "Admin User";
    const loggedInEmail = localStorage.getItem("email") || "admin@example.com";
    
    const existingTask = await fetchExistingTaskForItem(item.id);
    
    setSelectedItemForTask({
      ...item,
      quotation_id: quotation.id,
      quotation_number: quotation.quote_number || quotation.quoteNo,
      company_name: quotation.company_name || quotation.billTo,
      company_address: quotation.company_address || "",
      contact_person: quotation.contact_person || quotation.contactPerson
    });
    
    if (existingTask) {
      setIsUpdatingExistingTask(true);
      setExistingTaskId(existingTask.id);
      
      setTaskFormData({
        po_number: existingTask.po_number || generatePONumber(quotation.quote_number || quotation.quoteNo),
        description: existingTask.description || item.description || "",
        priority: existingTask.priority || "Medium",
        dueDate: existingTask.dueDate ? existingTask.dueDate.split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedTo: existingTask.assignedTo || "",
        note: existingTask.note || `From Quotation: ${quotation.quote_number || "N/A"} - ${quotation.company_name || "Company"}`,
        quotation_id: quotation.id,
        quotation_number: quotation.quote_number || quotation.quoteNo,
        company_name: quotation.company_name || quotation.billTo,
        company_address: quotation.company_address || "",
        item_id: item.id,
        item_name: item.item_name,
        supplier_part_no: item.supplier_part_no || existingTask.supplier_part_no || "",
        cut_width: item.cut_width || existingTask.cut_width || "",
        length: item.length || existingTask.length || "",
        quantity: item.quantity || existingTask.quantity || 1,
        brand_code: item.brand_code || existingTask.brand_code || "",
        batch_no: item.batch_no || existingTask.batch_no || "",
        mrp: item.mrp || item.price_per_unit || existingTask.mrp || "",
        hsn_sac: item.hsn_sac || existingTask.hsn_sac || "",
        unit: item.unit || existingTask.unit || "",
      });
    } else {
      setIsUpdatingExistingTask(false);
      setExistingTaskId(null);
      
      const poNumber = generatePONumber(quotation.quote_number || quotation.quoteNo);
      
      setTaskFormData({
        po_number: poNumber,
        description: item.description || "",
        priority: "Medium",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedTo: "",
        note: `From Quotation: ${quotation.quote_number || "N/A"} - ${quotation.company_name || "Company"}`,
        quotation_id: quotation.id,
        quotation_number: quotation.quote_number || quotation.quoteNo,
        company_name: quotation.company_name || quotation.billTo,
        company_address: quotation.company_address || "",
        item_id: item.id,
        item_name: item.item_name,
        supplier_part_no: item.supplier_part_no || "",
        cut_width: item.cut_width || "",
        length: item.length || "",
        quantity: item.quantity || 1,
        brand_code: item.brand_code || "",
        batch_no: item.batch_no || "",
        mrp: item.mrp || item.price_per_unit || "",
        hsn_sac: item.hsn_sac || "",
        unit: item.unit || "",
      });
    }
    
    setShowTaskModal(true);
  };

  // Handle task form change
  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create new Task (Sales Order)
  const createTask = async () => {
    if (!taskFormData.assignedTo) {
      alert("Please assign the task to an employee.");
      return;
    }
    
    setCreatingTask(true);
    setTaskError(null);
    
    try {
      const loggedInUser = localStorage.getItem("username") || "Admin User";
      const loggedInEmail = localStorage.getItem("email") || "admin@example.com";
      
      const taskData = {
        po_number: taskFormData.po_number,
        description: taskFormData.description,
        priority: taskFormData.priority,
        dueDate: taskFormData.dueDate,
        assignedTo: taskFormData.assignedTo,
        assignedBy: loggedInUser,
        assignedByEmail: loggedInEmail,
        
        quotation_id: taskFormData.quotation_id,
        quotation_number: taskFormData.quotation_number,
        company_name: taskFormData.company_name,
        company_address: taskFormData.company_address,
        
        item_id: taskFormData.item_id,
        item_name: taskFormData.item_name,
        supplier_part_no: taskFormData.supplier_part_no,
        cut_width: taskFormData.cut_width,
        length: taskFormData.length,
        quantity: taskFormData.quantity,
        
        brand_code: taskFormData.brand_code,
        batch_no: taskFormData.batch_no,
        mrp: taskFormData.mrp,
        hsn_sac: taskFormData.hsn_sac,
        unit: taskFormData.unit,
        
        status: "Pending",
        note: taskFormData.note,
      };
      
      let response;
      
      if (isUpdatingExistingTask && existingTaskId) {
        console.log("📤 Updating existing sales order (task) with data:", taskData);
        response = await axios.put(`${API_TASKS}/${existingTaskId}`, taskData);
      } else {
        console.log("📤 Creating sales order (task) with data:", taskData);
        response = await axios.post(API_TASKS, taskData);
      }
      
      if (response.data) {
        alert(`✅ Sales Order ${isUpdatingExistingTask ? 'updated' : 'created'} successfully with PO number!`);
        
        try {
          await axios.patch(
            `${API_BASE_URL}/api/quotations/items/${taskFormData.item_id}/sales-order-status`,
            {
              sales_order_item_status: "ordered",
              updated_by: loggedInUser
            }
          );
          
          await axios.patch(
            `${API_BASE_URL}/api/quotations/items/${taskFormData.item_id}/mark-sales-order`,
            {
              remark: `Sales order ${isUpdatingExistingTask ? 'updated' : 'created'} with PO: ${taskFormData.po_number}`,
              updated_by: loggedInUser
            }
          );
          
          console.log(`✅ Item sales order status updated to 'ordered'`);
        } catch (statusErr) {
          console.error("❌ Error updating item sales order status:", statusErr);
        }
        
        setShowTaskModal(false);
        setSelectedItemForTask(null);
        setIsUpdatingExistingTask(false);
        setExistingTaskId(null);
        setTaskFormData({
          po_number: "",
          description: "",
          priority: "Medium",
          dueDate: "",
          assignedTo: "",
          note: "",
          quotation_id: "",
          quotation_number: "",
          company_name: "",
          company_address: "",
          item_id: "",
          item_name: "",
          supplier_part_no: "",
          cut_width: "",
          length: "",
          quantity: "",
          brand_code: "",
          batch_no: "",
          mrp: "",
          hsn_sac: "",
          unit: "",
        });
        
        await fetchQuotations();
        
        if (selectedQuotation && selectedQuotation.id === taskFormData.quotation_id) {
          const refreshedResponse = await axios.get(`${API_BASE_URL}/api/quotations/${taskFormData.quotation_id}`);
          if (refreshedResponse.data.success) {
            setSelectedQuotation(refreshedResponse.data.data);
          }
        }
      } else {
        throw new Error(`Failed to ${isUpdatingExistingTask ? 'update' : 'create'} sales order`);
      }
    } catch (err) {
      console.error(`❌ Error ${isUpdatingExistingTask ? 'updating' : 'creating'} sales order:`, err.response?.data || err.message);
      setTaskError(err.response?.data?.message || `Failed to ${isUpdatingExistingTask ? 'update' : 'create'} sales order. Please try again.`);
      alert(`❌ Failed to ${isUpdatingExistingTask ? 'update' : 'create'} sales order: ${err.response?.data?.message || err.message}`);
    } finally {
      setCreatingTask(false);
    }
  };

  // Print quotation
  const printQuotation = (quotation) => {
    const printWindow = window.open('', '_blank');
    
    const items = quotation.items || [];
    const totals = {
      subtotal: quotation.subtotal || quotation.totals?.subtotal || 0,
      totalDiscount: quotation.total_discount || quotation.totals?.totalDiscount || 0,
      totalPacking: quotation.total_packing || quotation.totals?.totalPacking || 0,
      totalOther: quotation.total_other || quotation.totals?.totalOther || 0,
      totalGST: quotation.total_tax || quotation.totals?.totalGST || 0,
      grandTotal: quotation.grand_total || quotation.totals?.grandTotal || 0
    };
    
    const taxSummary = {};
    items.forEach(item => {
      const taxRate = item.tax_rate || 18;
      const taxAmount = item.tax_amount || 0;
      if (!taxSummary[taxRate]) {
        taxSummary[taxRate] = 0;
      }
      taxSummary[taxRate] += taxAmount;
    });
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation ${quotation.quote_number || quotation.quoteNo}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
        <style>
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
            .table { font-size: 11px; }
            .summary-table { font-size: 11px; }
          }
          .invoice-header { border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
          .total-row { font-weight: bold; }
          .table th { background-color: #f8f9fa; font-size: 11px; padding: 5px 8px; }
          .table td { padding: 5px 8px; font-size: 11px; }
          .text-primary { color: #0d6efd !important; }
          .text-danger { color: #dc3545 !important; }
          .text-success { color: #198754 !important; }
          .summary-table th, .summary-table td { padding: 3px 5px; }
          h1 { font-size: 24px; }
          h2 { font-size: 20px; }
          h5 { font-size: 14px; }
          p { font-size: 12px; margin-bottom: 3px; }
          .container { max-width: 100%; }
          .company-logo { max-width: 120px; max-height: 120px; }
        </style>
      </head>
      <body>
        <div class="container mt-3">
          <div class="invoice-header">
            <div class="row">
              <div class="col-2">
                <img src="E:/Lakotia/lakotia/src/Components/Name1.jpg" alt="Company Logo" class="company-logo">
              </div>
              <div class="col-5">
                <h1 class="mb-1">${issuer.name}</h1>
                <p class="mb-1">${issuer.address}</p>
                <p class="mb-1">Phone: ${issuer.phone} | Email: ${issuer.email}</p>
                <p class="mb-1">GSTIN: ${issuer.gstin} | State: ${issuer.stateCode}</p>
              </div>
              <div class="col-5 text-end">
                <h2 class="text-primary mb-2">QUOTATION</h2>
                <p class="mb-1"><strong>Quote No:</strong> ${quotation.quote_number || quotation.quoteNo}</p>
                <p class="mb-1"><strong>Date:</strong> ${quotation.date || quotation.date}</p>
                <p class="mb-1"><strong>Time:</strong> ${quotation.time || quotation.time}</p>
              </div>
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-6">
              <h5>Bill To:</h5>
              <p class="mb-1"><strong>${quotation.company_name || quotation.billTo}</strong></p>
              <p class="mb-1">${quotation.company_address || ''}</p>
              <p class="mb-1">GSTIN: ${quotation.company_gstin || ''}</p>
            </div>
            <div class="col-6">
              <h5>Contact Details:</h5>
              <p class="mb-1"><strong>${quotation.contact_person || quotation.contactPerson}</strong></p>
              <p class="mb-1">Phone: ${quotation.contact_mobile || quotation.contactMob}</p>
              <p class="mb-1">Email: ${quotation.contact_email || quotation.contactEmail}</p>
            </div>
          </div>
          
          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Brand Code</th>
                  <th>Batch No</th>
                  <th>Cut Width</th>
                  <th>Cut Length</th>
                  <th>Count</th>
                  <th>Supplier Part No</th>
                  <th>Customer Description</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>UoM</th>
                  <th>Price/Unit</th>
                  <th>MRP</th>
                  <th>Buy Price</th>
                  <th>GST %</th>
                  <th>Amount</th>
                  <th>Sales Order Status</th>
                  <th>Rejection Reason</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item, index) => {
                  const statusBadge = item.sales_order_item_status === 'ordered' ? 'success' :
                                    item.sales_order_item_status === 'rejected' ? 'danger' :
                                    item.sales_order_item_status === 'in_production' ? 'info' :
                                    item.sales_order_item_status === 'ready' ? 'primary' :
                                    item.sales_order_item_status === 'dispatched' ? 'warning' :
                                    item.sales_order_item_status === 'delivered' ? 'success' : 'secondary';
                  
                  const statusText = item.sales_order_item_status === 'not_created' ? 'Not Created' :
                                   item.sales_order_item_status === 'ordered' ? 'Ordered' :
                                   item.sales_order_item_status === 'in_production' ? 'In Production' :
                                   item.sales_order_item_status === 'ready' ? 'Ready' :
                                   item.sales_order_item_status === 'dispatched' ? 'Dispatched' :
                                   item.sales_order_item_status === 'delivered' ? 'Delivered' :
                                   item.sales_order_item_status === 'rejected' ? 'Rejected' : 'Unknown';
                  
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td><strong>${item.item_name}</strong></td>
                      <td>${item.brand_code || ''}</td>
                      <td>${item.batch_no || ''}</td>
                      <td>${item.cut_width || ''}</td>
                      <td>${item.length || ''}</td>
                      <td>${item.count || ''}</td>
                      <td>${item.supplier_part_no || ''}</td>
                      <td>${item.customer_description || ''}</td>
                      <td>${item.hsn_sac || ''}</td>
                      <td>${item.quantity || ''}</td>
                      <td>${item.unit || ''}</td>
                      <td>₹${(item.price_per_unit || 0).toFixed(2)}</td>
                      <td>₹${(item.mrp || item.price_per_unit || 0).toFixed(2)}</td>
                      <td>₹${(item.buy_price || 0).toFixed(2)}</td>
                      <td>${item.tax_rate || 18}%</td>
                      <td><strong>₹${(item.amount_after_discount || 0).toFixed(2)}</strong></td>
                      <td>
                        <span class="badge bg-${statusBadge}">
                          ${statusText}
                        </span>
                      </td>
                      <td>${item.rejection_reason || ''}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="row mt-3">
            <div class="col-7">
              <h5 class="mb-2">Tax Summary:</h5>
              <table class="table table-bordered table-sm summary-table">
                <thead class="table-light">
                  <tr>
                    <th>GST %</th>
                    <th>Taxable Amount</th>
                    <th>Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(taxSummary).map(([rate, amount]) => `
                    <tr>
                      <td>${rate}%</td>
                      <td>₹${(amount / (parseFloat(rate) / 100)).toFixed(2)}</td>
                      <td>₹${amount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div class="col-5">
              <div class="card border-0">
                <div class="card-body p-2">
                  <h5 class="card-title mb-2">Total Summary</h5>
                  <div class="d-flex justify-content-between mb-1">
                    <span>Subtotal:</span>
                    <strong>₹${totals.subtotal.toFixed(2)}</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-1">
                    <span>Discount:</span>
                    <strong class="text-danger">- ₹${totals.totalDiscount.toFixed(2)}</strong>
                  </div>
                  ${totals.totalPacking > 0 ? `
                    <div class="d-flex justify-content-between mb-1">
                      <span>Packing:</span>
                      <strong>₹${totals.totalPacking.toFixed(2)}</strong>
                    </div>
                  ` : ''}
                  ${totals.totalOther > 0 ? `
                    <div class="d-flex justify-content-between mb-1">
                      <span>Other Charges:</span>
                      <strong>₹${totals.totalOther.toFixed(2)}</strong>
                    </div>
                  ` : ''}
                  <div class="d-flex justify-content-between mb-1">
                    <span>Total Tax:</span>
                    <strong>₹${totals.totalGST.toFixed(2)}</strong>
                  </div>
                  <hr class="my-1"/>
                  <div class="d-flex justify-content-between total-row">
                    <span>Grand Total:</span>
                    <strong class="text-primary">₹${totals.grandTotal.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-3 p-2 bg-light rounded">
            <h5>Notes:</h5>
            <p class="mb-0">${quotation.notes || 'Please process this quote as per the terms mentioned. All prices are in INR and inclusive of GST. Delivery within 7-10 business days.'}</p>
            <p class="mb-0 mt-1"><strong>Valid for 30 days from the date of issue.</strong></p>
          </div>
          
          <div class="no-print mt-3 text-center">
            <button onclick="window.print()" class="btn btn-primary btn-sm me-2">
              <i class="bi bi-printer me-1"></i>Print
            </button>
            <button onclick="window.close()" class="btn btn-secondary btn-sm">
              <i class="bi bi-x-circle me-1"></i>Close
            </button>
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle search for quotations
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // Get badge color for sales order item status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'not_created': return 'secondary';
      case 'ordered': return 'info';
      case 'in_production': return 'primary';
      case 'ready': return 'warning';
      case 'dispatched': return 'success';
      case 'delivered': return 'success';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  // Get display text for sales order item status
  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'not_created': return 'Not Created';
      case 'ordered': return 'Ordered';
      case 'in_production': return 'In Production';
      case 'ready': return 'Ready';
      case 'dispatched': return 'Dispatched';
      case 'delivered': return 'Delivered';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  // Filter items by status
  const getFilteredItems = () => {
    if (statusFilter === "all") {
      return flattenedItems;
    }
    return flattenedItems.filter(item => 
      (item.sales_order_item_status || "not_created") === statusFilter
    );
  };

  // Rejection Reason Modal
  const renderRejectionModal = () => (
    <Modal show={showRejectionModal} onHide={() => {
      setShowRejectionModal(false);
      setCurrentRejectionItem(null);
      setRejectionReason("");
    }} centered>
      <Modal.Header closeButton className="bg-danger text-white">
        <Modal.Title>
          <i className="bi bi-exclamation-triangle me-2"></i>
          Rejection Reason Required
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="warning" className="mb-3">
          <i className="bi bi-info-circle me-2"></i>
          You are marking an item as <strong>Rejected</strong>. Please provide a reason for rejection.
        </Alert>
        
        <Form.Group>
          <Form.Label className="fw-bold">Rejection Reason *</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection (e.g., Out of stock, Customer cancellation, Price issue, Quality concern, etc.)"
            required
          />
          <Form.Text className="text-muted">
            This reason will be stored with the item and visible in reports.
          </Form.Text>
        </Form.Group>
        
        {currentRejectionItem && (
          <Alert variant="info" className="mt-3">
            <i className="bi bi-box me-2"></i>
            <strong>Item:</strong> {flattenedItems.find(item => item.id === currentRejectionItem.id)?.item_name}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={() => {
            setShowRejectionModal(false);
            setCurrentRejectionItem(null);
            setRejectionReason("");
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleRejectionSubmit}
          disabled={!rejectionReason.trim()}
        >
          <i className="bi bi-check-circle me-1"></i>
          Save Rejection Reason
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Task Creation/Update Modal
  const renderTaskModal = () => (
    <Modal show={showTaskModal} onHide={() => {
      setShowTaskModal(false);
      setSelectedItemForTask(null);
      setIsUpdatingExistingTask(false);
      setExistingTaskId(null);
      setTaskFormData({
        po_number: "",
        description: "",
        priority: "Medium",
        dueDate: "",
        assignedTo: "",
        note: "",
        quotation_id: "",
        quotation_number: "",
        company_name: "",
        company_address: "",
        item_id: "",
        item_name: "",
        supplier_part_no: "",
        cut_width: "",
        length: "",
        quantity: "",
        brand_code: "",
        batch_no: "",
        mrp: "",
        hsn_sac: "",
        unit: "",
      });
    }} centered size="lg">
      <Modal.Header closeButton className="bg-warning text-dark">
        <Modal.Title>
          <i className="bi bi-clipboard-check me-2"></i>
          {isUpdatingExistingTask ? 'Update Sales Order' : 'Create Sales Order'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedItemForTask && (
          <>
            <Alert variant={isUpdatingExistingTask ? "info" : "success"} className="mb-4">
              <i className="bi bi-info-circle me-2"></i>
              {isUpdatingExistingTask 
                ? `Updating existing sales order for item: ${selectedItemForTask.item_name}`
                : 'Creating sales order. This will update the item\'s status to "ordered".'}
            </Alert>

            <Row className="mb-4">
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Item Details</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-2">
                      <label className="form-label text-muted small mb-0">Quotation No</label>
                      <p className="mb-1 fw-bold">{selectedItemForTask.quotation_number}</p>
                    </div>
                    <div className="mb-2">
                      <label className="form-label text-muted small mb-0">Company</label>
                      <p className="mb-1">{selectedItemForTask.company_name}</p>
                    </div>
                    <div className="mb-2">
                      <label className="form-label text-muted small mb-0">Item Name</label>
                      <p className="mb-1 fw-bold">{selectedItemForTask.item_name}</p>
                    </div>
                    <div className="row">
                      <div className="col-6 mb-2">
                        <label className="form-label text-muted small mb-0">Quantity</label>
                        <p className="mb-1">{selectedItemForTask.quantity || 1} {selectedItemForTask.unit || 'pcs'}</p>
                      </div>
                      <div className="col-6 mb-2">
                        <label className="form-label text-muted small mb-0">Part No</label>
                        <p className="mb-1">{selectedItemForTask.supplier_part_no || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-6 mb-2">
                        <label className="form-label text-muted small mb-0">Brand Code</label>
                        <p className="mb-1">
                          {selectedItemForTask.brand_code ? (
                            <Badge bg="primary">{selectedItemForTask.brand_code}</Badge>
                          ) : 'N/A'}
                        </p>
                      </div>
                      <div className="col-6 mb-2">
                        <label className="form-label text-muted small mb-0">Batch No</label>
                        <p className="mb-1">
                          {selectedItemForTask.batch_no ? (
                            <Badge bg="secondary">{selectedItemForTask.batch_no}</Badge>
                          ) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-6 mb-2">
                        <label className="form-label text-muted small mb-0">MRP</label>
                        <p className="mb-1">₹{selectedItemForTask.mrp || selectedItemForTask.price_per_unit || '0.00'}</p>
                      </div>
                      <div className="col-6 mb-2">
                        <label className="form-label text-muted small mb-0">HSN/SAC</label>
                        <p className="mb-1">{selectedItemForTask.hsn_sac || 'N/A'}</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Sales Order Details</h6>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">PO NUMBER *</Form.Label>
                      <Form.Control
                        type="text"
                        name="po_number"
                        value={taskFormData.po_number}
                        onChange={handleTaskFormChange}
                        required
                        placeholder="PO number"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Description (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="description"
                        value={taskFormData.description}
                        onChange={handleTaskFormChange}
                        placeholder="Additional sales order details..."
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Assign To *</Form.Label>
                      <Form.Select
                        name="assignedTo"
                        value={taskFormData.assignedTo}
                        onChange={handleTaskFormChange}
                        required
                        disabled={loadingEmployees}
                      >
                        <option value="">-- Select Employee --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.email}>
                            {emp.name} ({emp.email})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">Priority</Form.Label>
                          <Form.Select
                            name="priority"
                            value={taskFormData.priority}
                            onChange={handleTaskFormChange}
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">Due Date *</Form.Label>
                          <Form.Control
                            type="date"
                            name="dueDate"
                            value={taskFormData.dueDate}
                            onChange={handleTaskFormChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Notes (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="note"
                        value={taskFormData.note}
                        onChange={handleTaskFormChange}
                        placeholder="Sales order instructions or notes..."
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {taskError && (
              <Alert variant="danger" className="mb-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {taskError}
              </Alert>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={() => {
            setShowTaskModal(false);
            setSelectedItemForTask(null);
            setIsUpdatingExistingTask(false);
            setExistingTaskId(null);
          }}
          disabled={creatingTask}
        >
          Cancel
        </Button>
        <Button 
          variant={isUpdatingExistingTask ? "primary" : "warning"} 
          onClick={createTask}
          disabled={creatingTask || !taskFormData.assignedTo || !taskFormData.dueDate || !taskFormData.po_number}
        >
          {creatingTask ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {isUpdatingExistingTask ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <i className="bi bi-clipboard-check me-2"></i>
              {isUpdatingExistingTask ? 'Update Sales Order' : 'Create Sales Order'}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-1">Completed Quotations - Item Wise View</h1>
          <p className="text-muted mb-0">View and manage individual items across all completed quotations</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                  <i className="bi bi-check-circle text-success fs-4"></i>
                </div>
                <div>
                  <div className="text-muted small">Total Completed Quotations</div>
                  <div className="h3 mb-0">{quotationCounts.completed}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                  <i className="bi bi-box-seam text-info fs-4"></i>
                </div>
                <div>
                  <div className="text-muted small">Total Items</div>
                  <div className="h3 mb-0">{flattenedItems.length}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                  <i className="bi bi-truck text-warning fs-4"></i>
                </div>
                <div>
                  <div className="text-muted small">Pending Orders</div>
                  <div className="h3 mb-0">
                    {flattenedItems.filter(item => 
                      (item.sales_order_item_status || "not_created") === "not_created"
                    ).length}
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Rejection Reason Modal */}
      {renderRejectionModal()}

      {/* Item Status Update Modal */}
      <Modal show={showItemStatusModal} onHide={() => {
        setShowItemStatusModal(false);
        setQuotationForStatusUpdate(null);
        setCurrentItemForStatusUpdate(null);
        setItemStatusUpdates({});
        setItemRejectionReasons({});
      }} size="lg">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="bi bi-check-circle me-2"></i>
            Update Item Status
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentItemForStatusUpdate && (
            <>
              <Alert variant="info">
                <i className="bi bi-info-circle me-2"></i>
                Updating status for item: <strong>{currentItemForStatusUpdate.item_name}</strong>
                <br/>
                <small>Quotation: {currentItemForStatusUpdate.quotation_number}</small>
              </Alert>

              <Table bordered hover responsive>
                <thead className="table-light">
                  <tr>
                    <th>Item Name</th>
                    <th>Brand Code</th>
                    <th>Batch No</th>
                    <th>Current Status</th>
                    <th width="200">New Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="fw-bold">{currentItemForStatusUpdate.item_name}</div>
                      <small className="text-muted">{currentItemForStatusUpdate.description?.substring(0, 50)}...</small>
                    </td>
                    <td>{currentItemForStatusUpdate.brand_code || ''}</td>
                    <td>{currentItemForStatusUpdate.batch_no || ''}</td>
                    <td>
                      <Badge bg={getStatusBadgeColor(currentItemForStatusUpdate.sales_order_item_status || "not_created")}>
                        {getStatusDisplayText(currentItemForStatusUpdate.sales_order_item_status || "not_created")}
                      </Badge>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={itemStatusUpdates[currentItemForStatusUpdate.id] || currentItemForStatusUpdate.sales_order_item_status || "not_created"}
                        onChange={(e) => handleItemStatusChange(currentItemForStatusUpdate.id, e.target.value)}
                        disabled={updatingItemStatus}
                      >
                        <option value="not_created">⬜ Not Created</option>
                        <option value="ordered">🟢 Ordered (Create/Update Sales Order)</option>
                        <option value="rejected">🔴 Rejected</option>
                      </Form.Select>
                      
                      {itemStatusUpdates[currentItemForStatusUpdate.id] === "rejected" && itemRejectionReasons[currentItemForStatusUpdate.id] && (
                        <div className="mt-2 small">
                          <i className="bi bi-chat-left-text text-danger"></i>
                          <span className="ms-1 text-danger">{itemRejectionReasons[currentItemForStatusUpdate.id]}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowItemStatusModal(false);
              setQuotationForStatusUpdate(null);
              setCurrentItemForStatusUpdate(null);
              setItemStatusUpdates({});
              setItemRejectionReasons({});
            }}
            disabled={updatingItemStatus}
          >
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={updateItemStatuses}
            disabled={updatingItemStatus}
          >
            {updatingItemStatus ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-save me-1"></i>Save Status
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Task Creation/Update Modal */}
      {renderTaskModal()}

      {/* View Quotation Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="xl">
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            Quotation Details - {selectedQuotation?.quote_number || selectedQuotation?.quoteNo}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedQuotation && (
            <Container>
              <div className="invoice-header border-bottom pb-3 mb-3">
                <Row>
                  <Col md={2}>
                    <img 
                      src="E:/Lakotia/lakotia/src/Components/Name1.jpg" 
                      alt="Company Logo" 
                      className="img-fluid"
                      style={{ maxWidth: '120px', maxHeight: '120px' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </Col>
                  <Col md={5}>
                    <h1 className="mb-1">{issuer.name}</h1>
                    <p className="mb-1">{issuer.address}</p>
                    <p className="mb-1">Phone: {issuer.phone} | Email: {issuer.email}</p>
                    <p className="mb-1">GSTIN: {issuer.gstin} | State: {issuer.stateCode}</p>
                  </Col>
                  <Col md={5} className="text-end">
                    <h2 className="text-info mb-3">QUOTATION</h2>
                    <p className="mb-1"><strong>Quote No:</strong> {selectedQuotation.quote_number || selectedQuotation.quoteNo}</p>
                    <p className="mb-1"><strong>Date:</strong> {selectedQuotation.date || selectedQuotation.date}</p>
                    <p className="mb-1"><strong>Time:</strong> {selectedQuotation.time || selectedQuotation.time}</p>
                  </Col>
                </Row>
              </div>
              
              <Row className="mb-4">
                <Col md={6}>
                  <h5>Bill To:</h5>
                  <p className="mb-1"><strong>{selectedQuotation.company_name || selectedQuotation.billTo}</strong></p>
                  <p className="mb-1">{selectedQuotation.company_address || ''}</p>
                  <p className="mb-1">GSTIN: {selectedQuotation.company_gstin || ''}</p>
                </Col>
                <Col md={6}>
                  <h5>Contact Details:</h5>
                  <p className="mb-1"><strong>{selectedQuotation.contact_person || selectedQuotation.contactPerson}</strong></p>
                  <p className="mb-1">Phone: {selectedQuotation.contact_mobile || selectedQuotation.contactMob}</p>
                  <p className="mb-1">Email: {selectedQuotation.contact_email || selectedQuotation.contactEmail}</p>
                </Col>
              </Row>
              
              <Table bordered responsive size="sm">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Item Name</th>
                    <th>Brand Code</th>
                    <th>Batch No</th>
                    <th>Part No</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Price/Unit</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedQuotation.items || []).map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="fw-bold">{item.item_name}</div>
                        <small className="text-muted">{item.description?.substring(0, 50)}...</small>
                      </td>
                      <td>
                        {item.brand_code ? (
                          <Badge bg="primary">{item.brand_code}</Badge>
                        ) : ''}
                      </td>
                      <td>
                        {item.batch_no ? (
                          <Badge bg="secondary">{item.batch_no}</Badge>
                        ) : ''}
                      </td>
                      <td>{item.supplier_part_no || 'N/A'}</td>
                      <td>{item.quantity || 1}</td>
                      <td>{item.unit || 'pcs'}</td>
                      <td>₹{(item.price_per_unit || 0).toFixed(2)}</td>
                      <td>₹{(item.amount_after_discount || 0).toFixed(2)}</td>
                      <td>
                        <Badge bg={getStatusBadgeColor(item.sales_order_item_status || "not_created")}>
                          {getStatusDisplayText(item.sales_order_item_status || "not_created")}
                        </Badge>
                        {item.rejection_reason && (
                          <div className="small text-danger mt-1">
                            <i className="bi bi-exclamation-triangle"></i> {item.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td>
                        <Button
                          variant={item.sales_order_item_status === "ordered" ? "primary" : "warning"}
                          size="sm"
                          onClick={() => openTaskModal(item, selectedQuotation)}
                          title={item.sales_order_item_status === "ordered" ? "Update Sales Order" : "Create Sales Order"}
                        >
                          <i className="bi bi-clipboard-check"></i> {item.sales_order_item_status === "ordered" ? "Update" : "Create"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <Row className="mt-3">
                <Col md={12}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <div className="d-flex justify-content-end">
                        <div style={{ width: '300px' }}>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Subtotal:</span>
                            <strong>₹{(selectedQuotation.subtotal || selectedQuotation.totals?.subtotal || 0).toFixed(2)}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Discount:</span>
                            <strong className="text-danger">- ₹{(selectedQuotation.total_discount || selectedQuotation.totals?.totalDiscount || 0).toFixed(2)}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Total Tax:</span>
                            <strong>₹{(selectedQuotation.total_tax || selectedQuotation.totals?.totalGST || 0).toFixed(2)}</strong>
                          </div>
                          <hr className="my-2"/>
                          <div className="d-flex justify-content-between">
                            <span className="fw-bold">Grand Total:</span>
                            <strong className="text-primary fs-5">₹{(selectedQuotation.grand_total || selectedQuotation.totals?.grandTotal || 0).toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            <i className="bi bi-x-circle me-1"></i>Close
          </Button>
          <Button variant="primary" onClick={() => printQuotation(selectedQuotation)}>
            <i className="bi bi-printer me-1"></i>Print
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Main Items Table - Flat Item Wise View */}
      <Card>
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-list-check me-2"></i>
              All Items from Completed Quotations
              <Badge bg="secondary" className="ms-2">{flattenedItems.length} Total Items</Badge>
            </h5>
            <div className="d-flex gap-2 align-items-center">
              {/* Status Filter */}
              <Form.Select 
                size="sm" 
                style={{ width: '180px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="not_created">Not Created</option>
                <option value="ordered">Ordered</option>
                <option value="rejected">Rejected</option>
              </Form.Select>

              {/* Search */}
              <InputGroup size="sm" style={{ width: '250px' }}>
                <FormControl
                  placeholder="Search items, quotations..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="outline-danger" onClick={resetSearch} title="Clear search">
                    <i className="bi bi-x-circle"></i>
                  </Button>
                )}
              </InputGroup>
              
              <Button variant="outline-primary" size="sm" onClick={fetchQuotations} disabled={loadingQuotations} title="Refresh">
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loadingQuotations ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading items...</p>
            </div>
          ) : getFilteredItems().length > 0 ? (
            <>
              <div className="table-responsive">
                <Table hover responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th width="50">#</th>
                      <th>Quotation No</th>
                      <th>Date</th>
                      <th>Company</th>
                      <th>Item Name</th>
                      <th>Brand Code</th>
                      <th>Batch No</th>
                      <th>Part No</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Price/Unit</th>
                      <th>Amount</th>
                      <th>Buy Price</th>
                      <th>Status</th>
                      <th width="180">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredItems().map((item, index) => {
                      const itemStatus = item.sales_order_item_status || "not_created";
                      
                      return (
                        <tr key={`${item.quotation_id}-${item.id}-${index}`}>
                          <td>{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                          <td>
                            <strong className="text-primary">{item.quotation_number}</strong>
                          </td>
                          <td>
                            <small>{item.quotation_date}</small>
                          </td>
                          <td>
                            <div className="fw-bold small">{item.company_name}</div>
                            <small className="text-muted">{item.contact_person}</small>
                          </td>
                          <td>
                            <div className="fw-bold">{item.item_name}</div>
                            <small className="text-muted">{item.description?.substring(0, 40)}...</small>
                          </td>
                          <td>
                            {item.brand_code ? (
                              <Badge bg="primary">{item.brand_code}</Badge>
                            ) : '-'}
                          </td>
                          <td>
                            {item.batch_no ? (
                              <Badge bg="secondary">{item.batch_no}</Badge>
                            ) : '-'}
                          </td>
                          <td>{item.supplier_part_no || '-'}</td>
                          <td>{item.quantity || 1}</td>
                          <td>{item.unit || 'pcs'}</td>
                          <td>₹{(item.price_per_unit || 0).toFixed(2)}</td>
                          <td>
                            <strong>₹{(item.amount_after_discount || 0).toFixed(2)}</strong>
                          </td>
                          <td>
                            <span className="text-success small fw-bold">
                              ₹{(item.buy_price || 0).toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <Badge bg={getStatusBadgeColor(itemStatus)}>
                              {getStatusDisplayText(itemStatus)}
                            </Badge>
                            {item.rejection_reason && (
                              <div className="small text-danger mt-1" title={item.rejection_reason}>
                                <i className="bi bi-exclamation-triangle"></i> Rejected
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => viewItemDetails(item)}
                                title="View Quotation"
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => openSingleItemStatusModal(item)}
                                title="Update Status"
                              >
                                <i className="bi bi-check-circle"></i>
                              </Button>
                              {itemStatus !== "rejected" && (
                                <Button
                                  variant={itemStatus === "ordered" ? "outline-primary" : "outline-warning"}
                                  size="sm"
                                  onClick={() => {
                                    const quotation = savedQuotations.find(q => q.id === item.quotation_id);
                                    if (quotation) openTaskModal(item, quotation);
                                  }}
                                  title={itemStatus === "ordered" ? "Update Sales Order" : "Create Sales Order"}
                                >
                                  <i className="bi bi-clipboard-check"></i>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              
              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <div className="text-muted small">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, getFilteredItems().length)} of {getFilteredItems().length} items
                  </div>
                  <Pagination size="sm" className="mb-0">
                    <Pagination.Prev 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                    
                    {getPaginationItems().map((pageNum, idx) => (
                      <Pagination.Item
                        key={idx}
                        active={pageNum === currentPage}
                        onClick={() => typeof pageNum === 'number' ? handlePageChange(pageNum) : null}
                        disabled={pageNum === '...'}
                      >
                        {pageNum}
                      </Pagination.Item>
                    ))}
                    
                    <Pagination.Next 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="bi bi-inbox display-1 text-muted"></i>
              </div>
              <h5 className="text-muted">No items found</h5>
              <p className="text-muted">
                {searchTerm ? 'Try a different search term' : 'No items available in completed quotations.'}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}