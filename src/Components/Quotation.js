import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Bootstrap CSS and Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function QuotationModal() {
  const idRef = useRef(1000);

  // Get user details from localStorage
  const [currentUser, setCurrentUser] = useState({
    username: '',
    email: '',
    userId: ''
  });

  // Get user details on component mount
  useEffect(() => {
    const username = localStorage.getItem('username') || '';
    const email = localStorage.getItem('email') || '';
    const userId = localStorage.getItem('user_id') || '';
    
    setCurrentUser({
      username,
      email,
      userId
    });
    
    console.log('Current User:', { username, email, userId });
  }, []);

  // Helper to create item with status
  function createEmptyItem(seq) {
    idRef.current += 1;
    return {
      id: idRef.current,
      item_name: "",
      hsn_sac: "",
      supplier_part_no: "",
      description: "",
      cut_width: 1,
      length: 1,
      count: 1,
      batch_no: `B-${Date.now().toString().slice(-6)}-${seq}`,
      mrp: 0,
      buy_price: 0,
      quantity: 1,
      unit: "pcs",
      discount: 0,
      discount_type: "amount",
      tax_rate: 18.0,
      packing_charges: 0,
      other_charges: 0,
      item_status: "pending",
      customer_description: "",
      brand_code: ""
    };
  }

  // Quote metadata
  const [quoteNo, setQuoteNo] = useState("");
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

  // Bank details
  const bankDetails = {
    accountNo: "12378630000183",
    accountTitle: "LAKHOTIA ENTERPRISE",
    ifscCode: "HDFC0001237"
  };

  // Logo path
  const companyLogo = "/Asset/Name1.jpg";

  // State variables
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companyError, setCompanyError] = useState(null);
  
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [billTo, setBillTo] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyGstin, setCompanyGstin] = useState("");
  const [companyPincode, setCompanyPincode] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactMob, setContactMob] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactEmailSame, setContactEmailSame] = useState(false);
  
  // NEW: CC email field
  const [ccEmail, setCcEmail] = useState("");

  // Company search dropdown state
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState([]);

  // Items state - Start with empty array
  const [items, setItems] = useState(() => []);

  // Stock items for autocomplete
  const [stockItems, setStockItems] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockError, setStockError] = useState(null);
  
  // Popup modal states for item selection
  const [showItemPopup, setShowItemPopup] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [newItemCutWidth, setNewItemCutWidth] = useState("");
  const [newItemLength, setNewItemLength] = useState("");
  const [newItemCount, setNewItemCount] = useState("1");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemBatchCode, setNewItemBatchCode] = useState("");
  const [availableBatchCodes, setAvailableBatchCodes] = useState([]);
  const [newItemDiscount, setNewItemDiscount] = useState("0");
  const [newItemDiscountType, setNewItemDiscountType] = useState("amount");
  const [newItemPackingCharges, setNewItemPackingCharges] = useState("0");
  const [newItemOtherCharges, setNewItemOtherCharges] = useState("0");
  const [newItemCustomerDescription, setNewItemCustomerDescription] = useState("");
  const [newItemSupplierPartNo, setNewItemSupplierPartNo] = useState("");
  const [newItemBrandCode, setNewItemBrandCode] = useState("");

  // View quotation modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  // Edit quotation modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Modal states for multi-step flow
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Saved quotations state
  const [savedQuotations, setSavedQuotations] = useState([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Pagination state for quotations
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter state
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Statistics
  const [statistics, setStatistics] = useState(null);
  const [quotationCounts, setQuotationCounts] = useState({
    all: 0,
    draft: 0,
    requote: 0,
    completed: 0,
  });

  // Profit percentage
  const [profitPercentage, setProfitPercentage] = useState(20); // Default 20% profit

  // DOM ref for quotation content
  const quotationRef = useRef(null);

  // API base URL
  const API_BASE_URL = "http://localhost:5000";

  // ENQUIRY STATES - NEW
  const [showEnquiriesModal, setShowEnquiriesModal] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [enquirySearchTerm, setEnquirySearchTerm] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showEnquiryDetails, setShowEnquiryDetails] = useState(false);
  
  // Pagination for enquiries
  const [enquiryCurrentPage, setEnquiryCurrentPage] = useState(1);
  const [enquiryItemsPerPage] = useState(10);
  const [enquiryTotalPages, setEnquiryTotalPages] = useState(1);
  const [enquiryTotalItems, setEnquiryTotalItems] = useState(0);

  // Fetch saved quotations from backend on component mount
  useEffect(() => {
    fetchQuotations();
    fetchQuotationCounts();
  }, [currentPage, searchTerm, statusFilter, currentUser.userId]);

  // Fetch quotation counts by status - UPDATED WITH USER FILTERING
  const fetchQuotationCounts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/quotations/statistics`, {
        params: {
          user_id: currentUser.userId
        }
      });
      if (response.data.success) {
        setStatistics(response.data.data);
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
      // Fallback to localStorage with user filtering
      const saved = localStorage.getItem("savedQuotations");
      if (saved) {
        try {
          const allQuotations = JSON.parse(saved);
          
          // Filter by current user
          const userQuotations = allQuotations.filter(quote => {
            if (quote.created_by_email && currentUser.email) {
              return quote.created_by_email === currentUser.email;
            } else if (quote.created_by_id && currentUser.userId) {
              return quote.created_by_id === currentUser.userId;
            }
            return false; // Show none if no user info matches
          });
          
          const counts = {
            all: userQuotations.length,
            draft: userQuotations.filter(q => q.status === 'draft').length,
            requote: userQuotations.filter(q => q.status === 'requote').length,
            completed: userQuotations.filter(q => q.status === 'completed').length,
          };
          setQuotationCounts(counts);
        } catch (e) {
          console.error("Error parsing localStorage:", e);
        }
      }
    }
  };

  // Fetch saved quotations with pagination - UPDATED WITH USER FILTERING AND SEARCH
  const fetchQuotations = async () => {
    setLoadingQuotations(true);
    try {
      // Use the search endpoint if search term is provided
      if (searchTerm.trim()) {
        const params = {
          q: searchTerm.trim(),
          user_id: currentUser.userId
        };
        
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/quotations/search`, {
          params
        });
        
        if (response.data.success) {
          const fetchedQuotations = response.data.data || [];
          const transformedQuotations = await transformQuotationData(fetchedQuotations);
          
          // Implement client-side pagination for search results
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedData = transformedQuotations.slice(startIndex, endIndex);
          
          setSavedQuotations(paginatedData);
          setTotalItems(transformedQuotations.length);
          setTotalPages(Math.ceil(transformedQuotations.length / itemsPerPage));
        } else {
          throw new Error(response.data.message || "API response unsuccessful");
        }
      } else {
        // Use regular paginated endpoint for non-search
        const params = {
          page: currentPage,
          per_page: itemsPerPage,
          created_by: currentUser.userId // Updated to match backend
        };
        
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/quotations`, {
          params
        });
        
        if (response.data.success) {
          const fetchedQuotations = response.data.data || [];
          const pagination = response.data.pagination || {};
          
          const transformedQuotations = await transformQuotationData(fetchedQuotations);
          
          setSavedQuotations(transformedQuotations);
          setTotalItems(pagination.total || fetchedQuotations.length);
          setTotalPages(pagination.pages || Math.ceil((pagination.total || fetchedQuotations.length) / itemsPerPage) || 1);
        } else {
          throw new Error(response.data.message || "API response unsuccessful");
        }
      }
    } catch (err) {
      console.error("Error loading quotations from API:", err);
      loadFromLocalStorage();
    } finally {
      setLoadingQuotations(false);
    }
  };

  // Helper function to transform quotation data
  const transformQuotationData = async (quotations) => {
    return quotations.map(quotation => {
      const transformedItems = (quotation.items || []).map(item => {
        let brand_code = "";
        let customer_description = "";
        let original_description = item.description || "";
        
        if (original_description) {
          try {
            if (original_description.includes('[BRAND_CODE:') && original_description.includes('[CUSTOMER_DESC:')) {
              const brandCodeMatch = original_description.match(/\[BRAND_CODE:(.*?)\]/);
              const customerDescMatch = original_description.match(/\[CUSTOMER_DESC:(.*?)\]/);
              
              if (brandCodeMatch) brand_code = brandCodeMatch[1];
              if (customerDescMatch) customer_description = customerDescMatch[1];
              
              original_description = original_description
                .replace(/\[BRAND_CODE:.*?\]/, '')
                .replace(/\[CUSTOMER_DESC:.*?\]/, '')
                .trim();
            }
          } catch (e) {
            console.error("Error parsing description:", e);
          }
        }
        
        return {
          ...item,
          item_status: item.item_status || "pending",
          brand_code: brand_code || "",
          customer_description: customer_description || "",
          description: original_description,
          count: 1,
          packing_charges: 0,
          other_charges: 0,
          buy_price: 0
        };
      });
      
      return {
        ...quotation,
        items: transformedItems
      };
    });
  };

  // Load from localStorage with pagination - UPDATED WITH USER FILTERING
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem("savedQuotations");
    if (saved) {
      try {
        const allQuotations = JSON.parse(saved);
        
        // FILTER: Show only quotations created by current user
        let filteredData = allQuotations.filter(quote => {
          // Check if quotation has user information
          if (quote.created_by_email && currentUser.email) {
            return quote.created_by_email === currentUser.email;
          } else if (quote.created_by_id && currentUser.userId) {
            return quote.created_by_id === currentUser.userId;
          }
          // If no user info is stored, show none (strict filtering)
          return false;
        });
        
        // Apply status filter
        if (statusFilter !== "all") {
          filteredData = filteredData.filter(quote => quote.status === statusFilter);
        }
        
        // Apply search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          filteredData = filteredData.filter(quote => {
            const quoteNo = (quote.quote_number || quote.quoteNo || "").toLowerCase();
            const companyName = (quote.company_name || quote.billTo || "").toLowerCase();
            const contactPersonName = (quote.contact_person || quote.contactPerson || "").toLowerCase();
            const contactEmail = (quote.contact_email || quote.contactEmail || "").toLowerCase();
            const notes = (quote.notes || "").toLowerCase();
            const requoteNote = (quote.requote_note || "").toLowerCase();
            const salesOrderNumber = (quote.sales_order_number || "").toLowerCase();
            
            return quoteNo.includes(term) ||
                   companyName.includes(term) ||
                   contactPersonName.includes(term) ||
                   contactEmail.includes(term) ||
                   notes.includes(term) ||
                   requoteNote.includes(term) ||
                   salesOrderNumber.includes(term);
          });
        }
        
        filteredData.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB - dateA;
        });
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        
        const quotationsWithItemStatus = paginatedData.map(quotation => ({
          ...quotation,
          items: (quotation.items || []).map(item => ({
            ...item,
            item_status: item.item_status || "pending"
          }))
        }));
        
        setSavedQuotations(quotationsWithItemStatus);
        setTotalItems(filteredData.length);
        setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
      } catch (e) {
        console.error("Error loading from localStorage:", e);
        setSavedQuotations([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } else {
      setSavedQuotations([]);
      setTotalItems(0);
      setTotalPages(1);
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

  // Load statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/quotations/statistics`, {
          params: {
            user_id: currentUser.userId
          }
        });
        if (response.data.success) {
          setStatistics(response.data.data);
        }
      } catch (err) {
        console.error("Error loading statistics:", err);
      }
    };

    fetchStatistics();
  }, [currentUser.userId]);

  // Fetch companies when company modal opens
  useEffect(() => {
    if (!showCompanyModal) return;
    
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      setCompanyError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/company`, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        let companiesData = [];
        
        if (Array.isArray(response.data)) {
          companiesData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          if (Array.isArray(response.data.data)) {
            companiesData = response.data.data;
          } else if (response.data.companies) {
            companiesData = response.data.companies;
          } else {
            companiesData = Object.values(response.data);
          }
        }
        
        if (companiesData.length > 0) {
          setCompanies(companiesData);
          setCompanyError(null);
        } else {
          setCompanies([]);
          setCompanyError("No companies found in database.");
        }
        
      } catch (err) {
        console.error("Fetch companies failed:", err);
        
        const mockCompanies = [
          {
            id: 1,
            companyName: "ABC Corporation",
            companyAddress: "123 Main St, Chennai - 600001",
            pinCode: "600001",
            gstNumber: "33AAAAA0000A1Z5",
            customerName: "John Doe",
            customerMobile: "9876543210",
            customerEmail: "john@abccorp.com"
          }
        ];
        
        setCompanies(mockCompanies);
        setCompanyError("Using mock data. API Error: " + (err.message || "Connection failed"));
      } finally {
        setLoadingCompanies(false);
      }
    };
    
    fetchCompanies();
  }, [showCompanyModal]);

  // Fetch stock items when items modal opens
  useEffect(() => {
    if (!showItemsModal) return;
    
    const fetchStockItems = async () => {
      setLoadingStock(true);
      setStockError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/stock/all`, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        let stockData = [];
        
        if (response.data.success && Array.isArray(response.data.data)) {
          stockData = response.data.data;
        } else if (Array.isArray(response.data)) {
          stockData = response.data;
        }
        
        const uniqueStockData = Array.from(
          new Map(stockData.map(item => [item["Brand Code"], item])).values()
        );
        
        setStockItems(uniqueStockData);
        
        if (uniqueStockData.length === 0) {
          const mockStock = [
            {
              "id": 1,
              "Item Name": "Premium Cutter Blade",
              "Brand": "Bosch",
              "Brand Code": "BOS-PCB-001",
              "Brand Description": "High precision cutting blade for metal",
              "HSN": "84659310",
              "Batch Code": "BATCH-2024-001",
              "MRP": 1250.00,
              "Buy Price": 850.00,
              "Width": 10,
              "Length": 200,
              "Unit": "pcs"
            }
          ];
          
          setStockItems(mockStock);
          setStockError("Using mock stock data. Real API failed.");
        }
        
      } catch (err) {
        console.error("Fetch stock failed:", err);
        
        const mockStock = [
          {
            "id": 1,
            "Item Name": "Premium Cutter Blade",
            "Brand": "Bosch",
            "Brand Code": "BOS-PCB-001",
            "Brand Description": "High precision cutting blade for metal",
            "HSN": "84659310",
            "Batch Code": "BATCH-2024-001",
            "MRP": 1250.00,
            "Buy Price": 850.00,
            "Width": 10,
            "Length": 200,
            "Unit": "pcs"
          }
        ];
        
        setStockItems(mockStock);
        setStockError("Using mock stock data. API Error: " + (err.message || "Connection failed"));
      } finally {
        setLoadingStock(false);
      }
    };
    
    fetchStockItems();
  }, [showItemsModal]);

  // Handle bill to search (company name search)
  const handleBillToSearch = (searchTerm) => {
    setBillTo(searchTerm);
    
    if (searchTerm.trim() === "") {
      setFilteredCompanies([]);
      setShowCompanyDropdown(false);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const results = companies.filter(company => {
      const companyName = (company.companyName || company.company_name || "").toLowerCase();
      const customerName = (company.customerName || company.customer_name || "").toLowerCase();
      const customerMobile = (company.customerMobile || company.customer_mobile || "").toString().toLowerCase();
      const companyGst = (company.gstNumber || company.gst_number || "").toLowerCase();
      const companyAddress = (company.companyAddress || company.company_address || "").toLowerCase();
      
      return (
        companyName.includes(term) ||
        customerName.includes(term) ||
        customerMobile.includes(term) ||
        companyGst.includes(term) ||
        companyAddress.includes(term)
      );
    }).slice(0, 5);
    
    setFilteredCompanies(results);
    setShowCompanyDropdown(results.length > 0);
  };

  // Handle contact mobile number input - lookup company details
  const handleContactMobChange = (mobile) => {
    setContactMob(mobile);
    
    if (mobile.length >= 10) {
      const foundCompany = companies.find(company => {
        const customerMobile = (company.customerMobile || company.customer_mobile || "").toString();
        return customerMobile.includes(mobile) || mobile.includes(customerMobile);
      });
      
      if (foundCompany) {
        selectCompanyFromSearch(foundCompany);
      }
    }
  };

  // Select company from search results
  const selectCompanyFromSearch = (company) => {
    const companyId = company.id || company.ID || company.company_id || "";
    const companyName = company.companyName || company.company_name || "";
    const companyAddr = company.companyAddress || company.company_address || "";
    const companyPincode = company.pinCode || company.pin_code || "";
    const companyGst = company.gstNumber || company.gst_number || "";
    const customerName = company.customerName || company.customer_name || company.contact_person || "";
    const customerMobile = company.customerMobile || company.customer_mobile || company.contact_mobile || "";
    const customerEmail = company.customerEmail || company.customer_email || company.contact_email || "";
    
    setSelectedCompanyId(companyId.toString());
    setSelectedCompany(company);
    setBillTo(companyName);
    setCompanyAddress(companyAddr);
    setCompanyPincode(companyPincode);
    setCompanyGstin(companyGst);
    setContactPerson(customerName);
    setContactMob(customerMobile);
    if (!contactEmailSame) {
      setContactEmail(customerEmail);
    }
    
    setShowCompanyDropdown(false);
    setFilteredCompanies([]);
  };

  // Extract pincode from address (fallback function)
  const extractPincode = (address) => {
    if (!address) return "";
    const pincodeMatch = address.match(/\b\d{6}\b/);
    return pincodeMatch ? pincodeMatch[0] : "";
  };

  // When company selected from dropdown, autofill data
  useEffect(() => {
    if (!selectedCompanyId) return;
    
    const company = companies.find(c => {
      const id = c.id || c.ID || c.company_id;
      return id && id.toString() === selectedCompanyId.toString();
    });
    
    if (!company) return;
    
    setSelectedCompany(company);
    const companyName = company.companyName || company.company_name || "";
    const companyAddr = company.companyAddress || company.company_address || "";
    const companyPincode = company.pinCode || company.pin_code || "";
    const companyGst = company.gstNumber || company.gst_number || "";
    const customerName = company.customerName || company.customer_name || "";
    const customerMobile = company.customerMobile || company.customer_mobile || "";
    const customerEmail = company.customerEmail || company.customer_email || "";
    
    setBillTo(companyName);
    setCompanyAddress(companyAddr);
    setCompanyPincode(companyPincode);
    setCompanyGstin(companyGst);
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

  // Start new quotation flow
  const startNewQuotation = () => {
    setItems([]);
    setSelectedCompanyId("");
    setSelectedCompany(null);
    setBillTo("");
    setCompanyAddress("");
    setCompanyGstin("");
    setCompanyPincode("");
    setContactPerson("");
    setContactMob("");
    setContactEmail("");
    setContactEmailSame(false);
    setCcEmail("");
    
    setFilteredCompanies([]);
    setShowCompanyDropdown(false);
    
    setShowItemPopup(false);
    setItemSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
    setSelectedStockItem(null);
    setNewItemCutWidth("");
    setNewItemLength("");
    setNewItemCount("1");
    setNewItemQuantity("1");
    setNewItemBatchCode("");
    setAvailableBatchCodes([]);
    setNewItemDiscount("0");
    setNewItemDiscountType("amount");
    setNewItemPackingCharges("0");
    setNewItemOtherCharges("0");
    setNewItemCustomerDescription("");
    setNewItemSupplierPartNo("");
    setNewItemBrandCode("");
    
    setQuoteNo(`Q-${Date.now().toString().slice(-8)}`);
    
    setShowCompanyModal(true);
  };

  // Handle item field changes including status
  function handleItemChange(index, field, value) {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      let newValue = value;
      
      if (["cut_width", "length", "count", "mrp", "buy_price", "quantity", "discount", "tax_rate", "packing_charges", "other_charges"].includes(field)) {
        newValue = parseFloat(value) || 0;
      }
      
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: newValue
      };
      
      // Auto-calculate count when width, length, or quantity changes
      if (["cut_width", "length", "quantity"].includes(field)) {
        const width = updatedItems[index].cut_width || 1;
        const length = updatedItems[index].length || 1;
        const qty = updatedItems[index].quantity || 1;
        updatedItems[index].count = width * length * qty;
      }
      
      return updatedItems;
    });
  }

  // Add new item using popup
  function addItemViaPopup() {
    setShowItemPopup(true);
  }

  // Remove item
  function removeItem(index) {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
  }

  // Calculate price per unit (MRP × Length × Width)
  const pricePerUnit = (item) => {
    const mrp = parseFloat(item.mrp) || 0;
    const length = parseFloat(item.length) || 0;
    const width = parseFloat(item.cut_width) || 0;
    const price = mrp * length * width;
    return parseFloat(price.toFixed(2)) || 0;
  };

  // Calculate count (Length × Width × Quantity)
  const calculateCount = (item) => {
    const length = parseFloat(item.length) || 0;
    const width = parseFloat(item.cut_width) || 0;
    const qty = parseFloat(item.quantity) || 0;
    return length * width * qty;
  };

  // Calculate total with profit (Price/Unit + (Price/Unit × profit%))
  const calculateTotalWithProfit = (item) => {
    const pricePerUnitValue = pricePerUnit(item);
    const profit = pricePerUnitValue * (profitPercentage / 100);
    const total = pricePerUnitValue + profit;
    return parseFloat(total.toFixed(2)) || 0;
  };

  // Calculate amount before discount (Total with profit × Quantity)
  const amountBeforeDiscount = (item) => {
    const totalWithProfit = calculateTotalWithProfit(item);
    const quantity = parseFloat(item.quantity) || 0;
    const amount = totalWithProfit * quantity;
    return parseFloat(amount.toFixed(2)) || 0;
  };

  // Calculate discount amount
  const discountAmount = (item) => {
    const amount = amountBeforeDiscount(item);
    const discount = parseFloat(item.discount) || 0;
    
    if (item.discount_type === "percentage") {
      return parseFloat((amount * discount / 100).toFixed(2));
    } else {
      return parseFloat(discount.toFixed(2));
    }
  };

  // Calculate amount after discount (Amount before discount - Discount)
  const amountAfterDiscount = (item) => {
    const amount = amountBeforeDiscount(item);
    const discount = discountAmount(item);
    const finalAmount = amount - discount;
    return parseFloat(finalAmount.toFixed(2)) || 0;
  };

  // Calculate item total with GST (Amount after discount + Packing + Freight)
  const itemTotalBeforeGST = (item) => {
    const amount = amountAfterDiscount(item);
    const packing = parseFloat(item.packing_charges) || 0;
    const freight = parseFloat(item.other_charges) || 0;
    return parseFloat((amount + packing + freight).toFixed(2));
  };

  // Calculate GST amount (GST% of itemTotalBeforeGST)
  const gstAmount = (item) => {
    const taxableAmount = itemTotalBeforeGST(item);
    const tax_rate = parseFloat(item.tax_rate) || 18.0;
    const gst = taxableAmount * (tax_rate / 100);
    return parseFloat(gst.toFixed(2));
  };

  // Calculate item total with GST
  const itemTotal = (item) => {
    const taxableAmount = itemTotalBeforeGST(item);
    const gst = gstAmount(item);
    return parseFloat((taxableAmount + gst).toFixed(2));
  };

  // Calculate all totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + amountBeforeDiscount(item), 0);
    const totalDiscount = items.reduce((sum, item) => sum + discountAmount(item), 0);
    const totalPacking = items.reduce((sum, item) => sum + (parseFloat(item.packing_charges) || 0), 0);
    const totalFreight = items.reduce((sum, item) => sum + (parseFloat(item.other_charges) || 0), 0);
    const totalBeforeGST = items.reduce((sum, item) => sum + itemTotalBeforeGST(item), 0);
    const totalGST = items.reduce((sum, item) => sum + gstAmount(item), 0);
    const grandTotal = items.reduce((sum, item) => sum + itemTotal(item), 0);
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      totalPacking: parseFloat(totalPacking.toFixed(2)),
      totalFreight: parseFloat(totalFreight.toFixed(2)),
      totalBeforeGST: parseFloat(totalBeforeGST.toFixed(2)),
      totalGST: parseFloat(totalGST.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
  };

  // Export to PDF
  async function exportPdf() {
    if (!quotationRef.current) {
      alert("Quotation content not found!");
      return;
    }
    
    try {
      const element = quotationRef.current;
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

  // Save quotation to backend with item status
  async function saveQuotation() {
    if (!selectedCompanyId) {
      alert("Please select a company first!");
      return;
    }
    
    if (!billTo.trim()) {
      alert("Please enter Bill To information!");
      return;
    }
    
    if (items.length === 0) {
      alert("Please add at least one item!");
      return;
    }
    
    setSaving(true);
    
    const totals = calculateTotals();
    
    // Prepare items with calculated fields and status
    const preparedItems = items.map(item => {
      const enhancedDescription = [
        item.description || "",
        item.customer_description ? `[CUSTOMER_DESC:${item.customer_description}]` : "",
        item.brand_code ? `[BRAND_CODE:${item.brand_code}]` : ""
      ]
        .filter(part => part.trim() !== "")
        .join(" ");
      
      return {
        item_name: item.item_name,
        hsn_sac: item.hsn_sac,
        supplier_part_no: item.supplier_part_no || item.brand_code || "",
        description: enhancedDescription,
        cut_width: item.cut_width,
        length: item.length,
        count: calculateCount(item),
        batch_no: item.batch_no,
        mrp: item.mrp,
        quantity: item.quantity,
        unit: item.unit,
        discount: item.discount,
        discount_type: item.discount_type,
        tax_rate: item.tax_rate,
        item_status: item.item_status,
        price_per_unit: pricePerUnit(item),
        total_with_profit: calculateTotalWithProfit(item),
        amount_before_discount: amountBeforeDiscount(item),
        discount_amount: discountAmount(item),
        amount_after_discount: amountAfterDiscount(item),
        packing_charges: item.packing_charges || 0,
        other_charges: item.other_charges || 0,
        taxable_amount: itemTotalBeforeGST(item),
        tax_amount: gstAmount(item),
        item_total: itemTotal(item)
      };
    });
    
    const quotationData = {
      quote_number: quoteNo,
      date: date,
      time: time,
      issuer_details: issuer,
      company_id: selectedCompanyId,
      company_name: billTo,
      company_address: companyAddress,
      company_pincode: companyPincode,
      company_gstin: companyGstin,
      contact_person: contactPerson,
      contact_mobile: contactMob,
      contact_email: contactEmail,
      cc_email: ccEmail,
      subtotal: totals.subtotal,
      total_discount: totals.totalDiscount,
      total_packing: totals.totalPacking,
      total_freight: totals.totalFreight,
      total_before_gst: totals.totalBeforeGST,
      total_tax: totals.totalGST,
      grand_total: totals.grandTotal,
      profit_percentage: profitPercentage,
      notes: `Please process this quote as per the terms mentioned.\nAll prices are in INR and inclusive of GST.\nDelivery within 7-10 business days.`,
      status: "draft",
      items: preparedItems,
      // ADD USER INFORMATION HERE
      created_by: currentUser.username || "User",
      created_by_email: currentUser.email || "",
      created_by_id: currentUser.userId || "",
      updated_by: currentUser.username || "User"
    };
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/quotations`, quotationData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const successMessage = ccEmail 
          ? `✅ Quotation saved successfully!\n\nQuote: ${quoteNo}\nCompany: ${billTo}\nGrand Total: ₹${totals.grandTotal}\nCC: ${ccEmail}`
          : `✅ Quotation saved successfully!\n\nQuote: ${quoteNo}\nCompany: ${billTo}\nGrand Total: ₹${totals.grandTotal}`;
        
        alert(successMessage);
        
        await fetchQuotations();
        await fetchQuotationCounts();
        
        setShowPreviewModal(false);
        setShowCompanyModal(false);
        setShowItemsModal(false);
      } else {
        throw new Error(response.data.message || "Failed to save quotation");
      }
      
    } catch (err) {
      console.error("Save quotation failed:", err);
      
      const quotationToSave = {
        ...quotationData,
        id: Date.now(),
        quoteNo: quoteNo,
        billTo: billTo,
        contactPerson: contactPerson,
        contactMob: contactMob,
        contactEmail: contactEmail,
        company_pincode: companyPincode,
        ccEmail: ccEmail,
        totals: totals,
        profit_percentage: profitPercentage,
        items: items.map(item => ({
          ...item,
          count: calculateCount(item),
          price_per_unit: pricePerUnit(item),
          total_with_profit: calculateTotalWithProfit(item),
          amount_before_discount: amountBeforeDiscount(item),
          discount_amount: discountAmount(item),
          amount_after_discount: amountAfterDiscount(item),
          packing_charges: item.packing_charges || 0,
          other_charges: item.other_charges || 0,
          taxable_amount: itemTotalBeforeGST(item),
          tax_amount: gstAmount(item),
          item_total: itemTotal(item)
        }))
      };
      
      const saved = localStorage.getItem("savedQuotations");
      const existingQuotations = saved ? JSON.parse(saved) : [];
      const updatedQuotations = [quotationToSave, ...existingQuotations];
      localStorage.setItem("savedQuotations", JSON.stringify(updatedQuotations));
      
      loadFromLocalStorage();
      fetchQuotationCounts();
      
      const localMessage = ccEmail 
        ? `✅ Quotation saved to local storage!\n\nQuote: ${quoteNo}\nCompany: ${billTo}\nGrand Total: ₹${totals.grandTotal}\nCC: ${ccEmail}\n\nNote: Backend API failed, using local storage.`
        : `✅ Quotation saved to local storage!\n\nQuote: ${quoteNo}\nCompany: ${billTo}\nGrand Total: ₹${totals.grandTotal}\n\nNote: Backend API failed, using local storage.`;
      
      alert(localMessage);
      
      setShowPreviewModal(false);
      setShowCompanyModal(false);
      setShowItemsModal(false);
    } finally {
      setSaving(false);
    }
  }

  // Edit quotation - open edit modal for requote status only
  const editQuotation = async (quotation) => {
    if (quotation.status !== 'requote') {
      alert("Only quotations with 'requote' status can be edited.");
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/quotations/${quotation.id}`);
      if (response.data.success) {
        const quoteData = response.data.data;
        
        const parsedItems = (quoteData.items || []).map(item => {
          let brand_code = "";
          let customer_description = "";
          let description = item.description || "";
          
          if (description) {
            try {
              if (description.includes('[BRAND_CODE:') && description.includes('[CUSTOMER_DESC:')) {
                const brandCodeMatch = description.match(/\[BRAND_CODE:(.*?)\]/);
                const customerDescMatch = description.match(/\[CUSTOMER_DESC:(.*?)\]/);
                
                if (brandCodeMatch) brand_code = brandCodeMatch[1];
                if (customerDescMatch) customer_description = customerDescMatch[1];
                
                description = description
                  .replace(/\[BRAND_CODE:.*?\]/, '')
                  .replace(/\[CUSTOMER_DESC:.*?\]/, '')
                  .trim();
              }
            } catch (e) {
              console.error("Error parsing description:", e);
            }
          }
          
          return {
            ...item,
            brand_code: brand_code || "",
            customer_description: customer_description || "",
            description: description,
            count: calculateCount(item),
            packing_charges: item.packing_charges || 0,
            other_charges: item.other_charges || 0,
            buy_price: 0
          };
        });
        
        setEditingQuotation({
          ...quoteData,
          items: parsedItems
        });
        
        setSelectedCompanyId(quoteData.company_id || "");
        setSelectedCompany(null);
        setBillTo(quoteData.company_name || "");
        setCompanyAddress(quoteData.company_address || "");
        setCompanyPincode(quoteData.company_pincode || "");
        setCompanyGstin(quoteData.company_gstin || "");
        setContactPerson(quoteData.contact_person || "");
        setContactMob(quoteData.contact_mobile || "");
        setContactEmail(quoteData.contact_email || "");
        setCcEmail(quoteData.cc_email || "");
        setQuoteNo(quoteData.quote_number || "");
        setItems(parsedItems);
        
        setIsEditing(true);
        setShowEditModal(true);
      } else {
        throw new Error(response.data.message || "Failed to load quotation");
      }
    } catch (err) {
      console.error("Error loading quotation for edit:", err);
      alert("Failed to load quotation for editing. Using local data.");
      
      setEditingQuotation(quotation);
      setSelectedCompanyId("");
      setBillTo(quotation.company_name || quotation.billTo || "");
      setCompanyAddress(quotation.company_address || "");
      setCompanyPincode(quotation.company_pincode || "");
      setCompanyGstin(quotation.company_gstin || "");
      setContactPerson(quotation.contact_person || quotation.contactPerson || "");
      setContactMob(quotation.contact_mobile || quotation.contactMob || "");
      setContactEmail(quotation.contact_email || quotation.contactEmail || "");
      setCcEmail(quotation.cc_email || quotation.ccEmail || "");
      setQuoteNo(quotation.quote_number || quotation.quoteNo || "");
      setItems(quotation.items || []);
      
      setIsEditing(true);
      setShowEditModal(true);
    }
  };

  // Update quotation after editing
  const updateQuotation = async () => {
    if (!editingQuotation) return;
    
    if (items.length === 0) {
      alert("Please add at least one item!");
      return;
    }
    
    setSaving(true);
    
    const totals = calculateTotals();
    
    const preparedItems = items.map(item => {
      const enhancedDescription = [
        item.description || "",
        item.customer_description ? `[CUSTOMER_DESC:${item.customer_description}]` : "",
        item.brand_code ? `[BRAND_CODE:${item.brand_code}]` : ""
      ]
        .filter(part => part.trim() !== "")
        .join(" ");
      
      return {
        id: item.id,
        item_name: item.item_name,
        hsn_sac: item.hsn_sac,
        supplier_part_no: item.supplier_part_no || item.brand_code || "",
        description: enhancedDescription,
        cut_width: item.cut_width,
        length: item.length,
        count: calculateCount(item),
        batch_no: item.batch_no,
        mrp: item.mrp,
        quantity: item.quantity,
        unit: item.unit,
        discount: item.discount,
        discount_type: item.discount_type,
        tax_rate: item.tax_rate,
        item_status: item.item_status,
        price_per_unit: pricePerUnit(item),
        total_with_profit: calculateTotalWithProfit(item),
        amount_before_discount: amountBeforeDiscount(item),
        discount_amount: discountAmount(item),
        amount_after_discount: amountAfterDiscount(item),
        packing_charges: item.packing_charges || 0,
        other_charges: item.other_charges || 0,
        taxable_amount: itemTotalBeforeGST(item),
        tax_amount: gstAmount(item),
        item_total: itemTotal(item)
      };
    });
    
    const quotationData = {
      quote_number: quoteNo,
      date: date,
      time: time,
      issuer_details: issuer,
      company_id: selectedCompanyId,
      company_name: billTo,
      company_address: companyAddress,
      company_pincode: companyPincode,
      company_gstin: companyGstin,
      contact_person: contactPerson,
      contact_mobile: contactMob,
      contact_email: contactEmail,
      cc_email: ccEmail,
      subtotal: totals.subtotal,
      total_discount: totals.totalDiscount,
      total_packing: totals.totalPacking,
      total_freight: totals.totalFreight,
      total_before_gst: totals.totalBeforeGST,
      total_tax: totals.totalGST,
      grand_total: totals.grandTotal,
      profit_percentage: profitPercentage,
      notes: `Please process this quote as per the terms mentioned.\nAll prices are in INR and inclusive of GST.\nDelivery within 7-10 business days.`,
      status: "draft",
      items: preparedItems,
      updated_by: currentUser.username || "User"
    };
    
    try {
      const response = await axios.put(`${API_BASE_URL}/api/quotations/${editingQuotation.id}`, quotationData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const successMessage = ccEmail 
          ? `✅ Quotation updated successfully!\n\nQuote: ${quoteNo}\nStatus changed to: draft\nCC: ${ccEmail}`
          : `✅ Quotation updated successfully!\n\nQuote: ${quoteNo}\nStatus changed to: draft`;
        
        alert(successMessage);
        
        await fetchQuotations();
        await fetchQuotationCounts();
        
        setShowEditModal(false);
        setEditingQuotation(null);
        setIsEditing(false);
        
        setItems([]);
        setSelectedCompanyId("");
        setBillTo("");
        setCompanyAddress("");
        setCompanyGstin("");
        setCompanyPincode("");
        setContactPerson("");
        setContactMob("");
        setContactEmail("");
        setCcEmail("");
        setQuoteNo("");
      } else {
        throw new Error(response.data.message || "Failed to update quotation");
      }
      
    } catch (err) {
      console.error("Update quotation failed:", err);
      
      const saved = localStorage.getItem("savedQuotations");
      if (saved) {
        try {
          const existingQuotations = JSON.parse(saved);
          const updatedQuotations = existingQuotations.map(quote => {
            if (quote.id === editingQuotation.id) {
              return {
                ...quote,
                ...quotationData,
                quoteNo: quoteNo,
                billTo: billTo,
                contactPerson: contactPerson,
                contactMob: contactMob,
                contactEmail: contactEmail,
                company_pincode: companyPincode,
                ccEmail: ccEmail,
                totals: totals,
                profit_percentage: profitPercentage,
                items: items.map(item => ({
                  ...item,
                  count: calculateCount(item),
                  price_per_unit: pricePerUnit(item),
                  total_with_profit: calculateTotalWithProfit(item),
                  amount_before_discount: amountBeforeDiscount(item),
                  discount_amount: discountAmount(item),
                  amount_after_discount: amountAfterDiscount(item),
                  packing_charges: item.packing_charges || 0,
                  other_charges: item.other_charges || 0,
                  taxable_amount: itemTotalBeforeGST(item),
                  tax_amount: gstAmount(item),
                  item_total: itemTotal(item)
                })),
                status: "draft",
                updatedAt: new Date().toISOString(),
                updated_by: currentUser.username || "User"
              };
            }
            return quote;
          });
          localStorage.setItem("savedQuotations", JSON.stringify(updatedQuotations));
          
          loadFromLocalStorage();
          fetchQuotationCounts();
          
          const localMessage = ccEmail 
            ? `✅ Quotation updated in local storage!\n\nQuote: ${quoteNo}\nStatus changed to: draft\nCC: ${ccEmail}`
            : `✅ Quotation updated in local storage!\n\nQuote: ${quoteNo}\nStatus changed to: draft`;
          
          alert(localMessage);
          
          setShowEditModal(false);
          setEditingQuotation(null);
          setIsEditing(false);
          
          setItems([]);
          setSelectedCompanyId("");
          setBillTo("");
          setCompanyAddress("");
          setCompanyGstin("");
          setCompanyPincode("");
          setContactPerson("");
          setContactMob("");
          setContactEmail("");
          setCcEmail("");
          setQuoteNo("");
        } catch (e) {
          console.error("Error updating localStorage:", e);
          alert("Failed to update quotation in local storage.");
        }
      } else {
        alert("No saved quotations found in local storage.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete saved quotation
  async function deleteQuotation(quoteId) {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/quotations/${quoteId}`);
        
        if (response.data.success) {
          await fetchQuotations();
          await fetchQuotationCounts();
        }
      } catch (err) {
        console.error("Delete failed, using localStorage:", err);
        const saved = localStorage.getItem("savedQuotations");
        if (saved) {
          const existingQuotations = JSON.parse(saved);
          const updatedQuotations = existingQuotations.filter(quote => quote.id !== quoteId);
          localStorage.setItem("savedQuotations", JSON.stringify(updatedQuotations));
          loadFromLocalStorage();
          fetchQuotationCounts();
        }
      }
    }
  }

  // View quotation details in modal
  function viewQuotation(quotation) {
    setSelectedQuotation(quotation);
    setShowViewModal(true);
  }

  // Print quotation
  function printQuotation(quotation) {
    const printWindow = window.open('', '_blank');
    
    const items = quotation.items || [];
    const totals = {
      subtotal: quotation.subtotal || quotation.totals?.subtotal || 0,
      totalDiscount: quotation.total_discount || quotation.totals?.totalDiscount || 0,
      totalPacking: quotation.total_packing || quotation.totals?.totalPacking || 0,
      totalFreight: quotation.total_freight || quotation.totals?.totalFreight || 0,
      totalBeforeGST: quotation.total_before_gst || quotation.totals?.totalBeforeGST || 0,
      totalGST: quotation.total_tax || quotation.totals?.totalGST || 0,
      grandTotal: quotation.grand_total || quotation.totals?.grandTotal || 0
    };
    
    // Calculate tax summary
    const taxSummary = {};
    items.forEach(item => {
      const taxRate = item.tax_rate || 18;
      const taxAmount = item.tax_amount || 0;
      if (!taxSummary[taxRate]) {
        taxSummary[taxRate] = 0;
      }
      taxSummary[taxRate] += taxAmount;
    });
    
    // Use stored pincode or extract from address
    const companyPincode = quotation.company_pincode || extractPincode(quotation.company_address || "");
    
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
          .company-logo { max-width: 120px; max-height: 120px; object-fit: contain; }
          .pincode-badge { background-color: #e9ecef; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
          .cc-badge { background-color: #d1ecf1; color: #0c5460; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 5px; }
          .bank-details { 
            background-color: #f8f9fa; 
            border-left: 4px solid #0d6efd;
            padding: 10px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container mt-3">
          <div class="invoice-header">
            <div class="row">
              <div class="col-2">
                <img src="${companyLogo}" alt="Company Logo" class="company-logo">
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
              ${companyPincode ? `<p class="mb-1">Pincode: <span class="pincode-badge">${companyPincode}</span></p>` : ''}
              <p class="mb-1">GSTIN: ${quotation.company_gstin || ''}</p>
            </div>
            <div class="col-6">
              <h5>Contact Details:</h5>
              <p class="mb-1"><strong>${quotation.contact_person || quotation.contactPerson}</strong></p>
              <p class="mb-1">Phone: ${quotation.contact_mobile || quotation.contactMob}</p>
              <p class="mb-1">Email: ${quotation.contact_email || quotation.contactEmail}</p>
              ${quotation.cc_email || quotation.ccEmail ? `
                <p class="mb-1">CC: ${quotation.cc_email || quotation.ccEmail} <span class="cc-badge">CC</span></p>
              ` : ''}
            </div>
          </div>
          
          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Brand Code</th>
                  <th>Cut Width</th>
                  <th>Cut Length</th>
                  <th>Customer Part No</th>
                  <th>Customer Description</th>
                  <th>Qty</th>
                  <th>UoM</th>
                  <th>Price/Unit</th>
                  <th>GST %</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item, index) => {
                  let brand_code = "";
                  let customer_description = "";
                  let display_description = item.description || "";
                  
                  if (display_description) {
                    try {
                      if (display_description.includes('[BRAND_CODE:') && display_description.includes('[CUSTOMER_DESC:')) {
                        const brandCodeMatch = display_description.match(/\[BRAND_CODE:(.*?)\]/);
                        const customerDescMatch = display_description.match(/\[CUSTOMER_DESC:(.*?)\]/);
                        
                        if (brandCodeMatch) brand_code = brandCodeMatch[1];
                        if (customerDescMatch) customer_description = customerDescMatch[1];
                        
                        display_description = display_description
                          .replace(/\[BRAND_CODE:.*?\]/, '')
                          .replace(/\[CUSTOMER_DESC:.*?\]/, '')
                          .trim();
                      }
                    } catch (e) {
                      console.error("Error parsing description:", e);
                    }
                  }
                  
                  // Calculate price per unit according to new formula: MRP × Length × Width
                  const pricePerUnit = (item) => {
                    const mrp = parseFloat(item.mrp) || 0;
                    const length = parseFloat(item.length) || 0;
                    const width = parseFloat(item.cut_width) || 0;
                    return parseFloat((mrp * length * width).toFixed(2)) || 0;
                  };
                  
                  const itemPricePerUnit = pricePerUnit(item);
                  
                  // Calculate total with profit: Price/Unit + (Price/Unit × profit%)
                  const profitPercentage = quotation.profit_percentage || 20;
                  const totalWithProfit = itemPricePerUnit + (itemPricePerUnit * (profitPercentage / 100));
                  
                  // Calculate amount before discount: Total with profit × Quantity
                  const amountBeforeDiscount = totalWithProfit * (item.quantity || 1);
                  
                  // Calculate discount amount
                  const discountAmount = (item) => {
                    const amount = amountBeforeDiscount;
                    const discount = parseFloat(item.discount) || 0;
                    
                    if (item.discount_type === "percentage") {
                      return parseFloat((amount * discount / 100).toFixed(2));
                    } else {
                      return parseFloat(discount.toFixed(2));
                    }
                  };
                  
                  const discount = discountAmount(item);
                  const amountAfterDiscount = amountBeforeDiscount - discount;
                  
                  // Calculate count: Length × Width × Quantity
                  const count = (item.length || 0) * (item.cut_width || 0) * (item.quantity || 1);
                  
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td><strong>${item.item_name}</strong></td>
                      <td>${brand_code || item.brand_code || ''}</td>
                      <td>${item.cut_width || ''}</td>
                      <td>${item.length || ''}</td>
                      <td>${item.supplier_part_no || ''}</td>
                      <td>${customer_description || item.customer_description || ''}</td>
                      <td>${item.quantity || ''}</td>
                      <td>${item.unit || ''}</td>
                      <td>₹${itemPricePerUnit.toFixed(2)}</td>
                      <td>${item.tax_rate || 18}%</td>
                      <td><strong>₹${amountAfterDiscount.toFixed(2)}</strong></td>
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
                  ${totals.totalFreight > 0 ? `
                    <div class="d-flex justify-content-between mb-1">
                      <span>Freight:</span>
                      <strong>₹${totals.totalFreight.toFixed(2)}</strong>
                    </div>
                  ` : ''}
                  <div class="d-flex justify-content-between mb-1">
                    <span>Taxable Amount:</span>
                    <strong>₹${totals.totalBeforeGST.toFixed(2)}</strong>
                  </div>
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
          
          <!-- Bank Details Section -->
          <div class="bank-details mt-4">
            <h5 class="mb-2">Bank Details:</h5>
            <div class="row">
              <div class="col-md-6">
                <p class="mb-1"><strong>Account No:</strong> ${bankDetails.accountNo}</p>
                <p class="mb-1"><strong>Account Title:</strong> ${bankDetails.accountTitle}</p>
              </div>
              <div class="col-md-6">
                <p class="mb-1"><strong>IFSC Code:</strong> ${bankDetails.ifscCode}</p>
                <p class="mb-1"><strong>Bank:</strong> HDFC Bank</p>
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
  }

  // Navigation functions
  const goToItems = () => {
    if (!billTo.trim()) {
      alert("Please enter Bill To information!");
      return;
    }
    setShowCompanyModal(false);
    setShowItemsModal(true);
  };

  const goToPreview = () => {
    if (items.length === 0) {
      alert("Please add at least one item!");
      return;
    }
    if (items.some(item => !item.item_name.trim())) {
      alert("Please add item name for all items!");
      return;
    }
    setShowItemsModal(false);
    setShowPreviewModal(true);
  };

  const goBackToCompany = () => {
    setShowItemsModal(false);
    setShowCompanyModal(true);
  };

  const goBackToItems = () => {
    setShowPreviewModal(false);
    setShowItemsModal(true);
  };

  const cancelQuotation = () => {
    if (window.confirm("Are you sure you want to cancel this quotation? All unsaved data will be lost.")) {
      setShowCompanyModal(false);
      setShowItemsModal(false);
      setShowPreviewModal(false);
      setShowItemPopup(false);
      setShowViewModal(false);
      setShowEditModal(false);
      setShowEnquiriesModal(false);
      setShowEnquiryDetails(false);
      setIsEditing(false);
      setEditingQuotation(null);
      setSelectedEnquiry(null);
    }
  };

  // Handle search for quotations
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // ENQUIRY FUNCTIONS - NEW WITH PAGINATION
  const fetchEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const params = {
        page: enquiryCurrentPage,
        per_page: enquiryItemsPerPage,
        user_id: currentUser.userId
      };
      
      if (enquirySearchTerm.trim()) {
        params.q = enquirySearchTerm.trim();
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/enquiries`, {
        params
      });
      
      if (response.data.success) {
        const enquiriesData = response.data.data || [];
        const pagination = response.data.pagination || {};
        
        setEnquiries(enquiriesData);
        setEnquiryTotalItems(pagination.total || enquiriesData.length);
        setEnquiryTotalPages(pagination.pages || Math.ceil((pagination.total || enquiriesData.length) / enquiryItemsPerPage) || 1);
      } else {
        // Fallback to mock data if API fails
        throw new Error(response.data.message || "Failed to fetch enquiries");
      }
    } catch (err) {
      console.error("Error fetching enquiries:", err);
      // Fallback to mock data if API fails
      const mockEnquiries = [
        {
          id: 1,
          enquiry_number: "ENQ-001",
          company_name: "ABC Corporation",
          contact_person: "John Doe",
          contact_email: "john@abccorp.com",
          contact_mobile: "9876543210",
          status: "draft",
          total_items: 3,
          total_quantity: 15,
          created_at: "2024-01-15T10:30:00"
        },
        {
          id: 2,
          enquiry_number: "ENQ-002",
          company_name: "XYZ Industries",
          contact_person: "Jane Smith",
          contact_email: "jane@xyz.com",
          contact_mobile: "9876543211",
          status: "in_progress",
          total_items: 5,
          total_quantity: 25,
          created_at: "2024-01-16T14:45:00"
        }
      ];
      
      // Apply search filter to mock data
      let filteredEnquiries = mockEnquiries;
      if (enquirySearchTerm.trim()) {
        const term = enquirySearchTerm.toLowerCase();
        filteredEnquiries = mockEnquiries.filter(enquiry => 
          enquiry.enquiry_number.toLowerCase().includes(term) ||
          enquiry.company_name.toLowerCase().includes(term) ||
          enquiry.contact_person.toLowerCase().includes(term) ||
          enquiry.contact_email.toLowerCase().includes(term)
        );
      }
      
      // Apply pagination
      const startIndex = (enquiryCurrentPage - 1) * enquiryItemsPerPage;
      const endIndex = startIndex + enquiryItemsPerPage;
      const paginatedEnquiries = filteredEnquiries.slice(startIndex, endIndex);
      
      setEnquiries(paginatedEnquiries);
      setEnquiryTotalItems(filteredEnquiries.length);
      setEnquiryTotalPages(Math.ceil(filteredEnquiries.length / enquiryItemsPerPage));
    } finally {
      setLoadingEnquiries(false);
    }
  };

  const handleEnquirySearch = (term) => {
    setEnquirySearchTerm(term);
    setEnquiryCurrentPage(1);
  };

  const handleEnquiryPageChange = (pageNumber) => {
    setEnquiryCurrentPage(pageNumber);
  };

  const getEnquiryPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (enquiryTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= enquiryTotalPages; i++) {
        items.push(i);
      }
    } else {
      if (enquiryCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) items.push(i);
        items.push("...");
        items.push(enquiryTotalPages);
      } else if (enquiryCurrentPage >= enquiryTotalPages - 2) {
        items.push(1);
        items.push("...");
        for (let i = enquiryTotalPages - 3; i <= enquiryTotalPages; i++) items.push(i);
      } else {
        items.push(1);
        items.push("...");
        items.push(enquiryCurrentPage - 1);
        items.push(enquiryCurrentPage);
        items.push(enquiryCurrentPage + 1);
        items.push("...");
        items.push(enquiryTotalPages);
      }
    }
    
    return items;
  };

  const resetEnquirySearch = () => {
    setEnquirySearchTerm("");
    setEnquiryCurrentPage(1);
  };

  const viewEnquiryDetails = async (enquiry) => {
    try {
      // Fetch full enquiry details with items
      const response = await axios.get(`${API_BASE_URL}/api/enquiries/${enquiry.id}`);
      if (response.data.success) {
        setSelectedEnquiry(response.data.data);
        setShowEnquiryDetails(true);
      }
    } catch (err) {
      console.error("Error fetching enquiry details:", err);
      // Use basic data if API fails
      setSelectedEnquiry(enquiry);
      setShowEnquiryDetails(true);
    }
  };

  const convertEnquiryToQuotation = async () => {
    if (!selectedEnquiry) return;

    try {
      // Fetch stock items for pricing
      const stockResponse = await axios.get(`${API_BASE_URL}/api/stock/all`);
      const stockItems = stockResponse.data.data || stockResponse.data || [];

      // Fetch enquiry items
      const itemsResponse = await axios.get(`${API_BASE_URL}/api/enquiries/${selectedEnquiry.id}/items`);
      const enquiryItems = itemsResponse.data.data || [];

      // Convert enquiry items to quotation items
      const convertedItems = await Promise.all(enquiryItems.map(async (item) => {
        // Find matching stock item for pricing
        const stockItem = stockItems.find(stock => 
          stock["Brand Code"] === item.brand_code || 
          stock["Item Name"]?.toLowerCase().includes(item.item_name?.toLowerCase())
        );

        // Calculate price per unit: MRP × Length × Width
        const mrp = stockItem ? parseFloat(stockItem["MRP"] || 0) : 0;
        const length = item.length || 1;
        const width = item.cut_width || 1;
        const pricePerUnit = mrp * length * width;
        
        // Calculate count: Length × Width × Quantity
        const count = (item.cut_width || 1) * (item.length || 1) * (item.quantity || 1);

        return {
          id: idRef.current + 1,
          item_name: item.item_name || "",
          hsn_sac: item.hsn_sac || "",
          supplier_part_no: item.supplier_part_no || "",
          description: item.description || "",
          cut_width: item.cut_width || 1,
          length: item.length || 1,
          count: count,
          batch_no: item.batch_no || `B-${Date.now().toString().slice(-6)}`,
          mrp: mrp,
          buy_price: stockItem ? parseFloat(stockItem["Buy Price"] || 0) : 0,
          quantity: item.quantity || 1,
          unit: item.unit || "pcs",
          discount: 0,
          discount_type: "amount",
          tax_rate: 18.0,
          packing_charges: 0,
          other_charges: 0,
          item_status: "pending",
          customer_description: item.customer_description || "",
          brand_code: item.brand_code || "",
          price_per_unit: pricePerUnit
        };
      }));

      idRef.current = idRef.current + convertedItems.length;

      // Fill quotation form with enquiry data
      setSelectedCompanyId(selectedEnquiry.company_id || "");
      setBillTo(selectedEnquiry.company_name || "");
      setCompanyAddress(selectedEnquiry.company_address || "");
      setCompanyPincode(selectedEnquiry.company_pincode || "");
      setCompanyGstin(selectedEnquiry.company_gstin || "");
      setContactPerson(selectedEnquiry.contact_person || "");
      setContactMob(selectedEnquiry.contact_mobile || "");
      setContactEmail(selectedEnquiry.contact_email || "");
      setItems(convertedItems);
      setQuoteNo(`Q-${Date.now().toString().slice(-8)}`);

      // Close modals and open company modal
      setShowEnquiriesModal(false);
      setShowEnquiryDetails(false);
      setShowCompanyModal(true);

      // Update enquiry status to converted
      try {
        await axios.put(`${API_BASE_URL}/api/enquiries/${selectedEnquiry.id}/status`, {
          status: "converted",
          updated_by: currentUser.username || "User"
        });
        alert(`Enquiry ${selectedEnquiry.enquiry_number} converted to quotation!`);
      } catch (statusErr) {
        console.error("Failed to update enquiry status:", statusErr);
      }

    } catch (err) {
      console.error("Error converting enquiry:", err);
      alert("Failed to convert enquiry. Please check console for details.");
    }
  };

  const openEnquiriesModal = () => {
    setShowEnquiriesModal(true);
    fetchEnquiries();
  };

  const totals = calculateTotals();

  return (
    <div className="container-fluid py-4">
      {/* Header with User Info */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-1">Quotation Management</h1>
          <p className="text-muted mb-0">
            Welcome, <span className="text-primary fw-bold">{currentUser.username || 'User'}</span>
            {currentUser.email && (
              <span className="ms-2 text-muted">({currentUser.email})</span>
            )}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-info"
            onClick={openEnquiriesModal}
          >
            <i className="bi bi-question-circle me-2"></i>View Enquiries
          </button>
          <button
            className="btn btn-primary"
            onClick={startNewQuotation}
          >
            <i className="bi bi-file-earmark-plus me-2"></i>New Quotation
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-12 mb-3">
          <div className="card">
            <div className="card-body p-3">
              <h6 className="card-title mb-3">Quotation Overview</h6>
              <div className="row">
                <div className="col-md mb-2">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white me-3" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-files"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Total Quotations</div>
                      <div className="h4 mb-0">{quotationCounts.all}</div>
                    </div>
                  </div>
                </div>
                <div className="col-md mb-2">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center text-white me-3" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-pencil"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Draft</div>
                      <div className="h4 mb-0">{quotationCounts.draft}</div>
                    </div>
                  </div>
                </div>
                <div className="col-md mb-2">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-info d-flex align-items-center justify-content-center text-white me-3" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-arrow-repeat"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Re-quote</div>
                      <div className="h4 mb-0">{quotationCounts.requote}</div>
                    </div>
                  </div>
                </div>
                <div className="col-md mb-2">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-success d-flex align-items-center justify-content-center text-white me-3" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Completed</div>
                      <div className="h4 mb-0">{quotationCounts.completed}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body p-3">
              <h6 className="card-title mb-3">Filter by Status</h6>
              <div className="d-flex flex-wrap gap-2">
                <button 
                  className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleStatusFilter('all')}
                >
                  All ({quotationCounts.all})
                </button>
                <button 
                  className={`btn btn-sm ${statusFilter === 'draft' ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => handleStatusFilter('draft')}
                >
                  Draft ({quotationCounts.draft})
                </button>
                <button 
                  className={`btn btn-sm ${statusFilter === 'requote' ? 'btn-info' : 'btn-outline-info'}`}
                  onClick={() => handleStatusFilter('requote')}
                >
                  Re-quote ({quotationCounts.requote})
                </button>
                <button 
                  className={`btn btn-sm ${statusFilter === 'completed' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => handleStatusFilter('completed')}
                >
                  Completed ({quotationCounts.completed})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiries Modal - UPDATED WITH PAGINATION */}
      {showEnquiriesModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <i className="bi bi-question-circle me-2"></i>
                  Enquiries List
                  <span className="badge bg-light text-dark ms-2">Total: {enquiryTotalItems}</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEnquiriesModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6>Select an enquiry to convert to quotation</h6>
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        style={{ width: '250px' }}
                        placeholder="Search enquiries..."
                        value={enquirySearchTerm}
                        onChange={(e) => handleEnquirySearch(e.target.value)}
                      />
                      {enquirySearchTerm && (
                        <button className="btn btn-sm btn-outline-danger" onClick={resetEnquirySearch} title="Clear search">
                          <i className="bi bi-x-circle"></i>
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-primary" onClick={fetchEnquiries} disabled={loadingEnquiries}>
                        <i className="bi bi-arrow-clockwise"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {loadingEnquiries ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading enquiries...</p>
                  </div>
                ) : enquiries.length > 0 ? (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Enquiry No</th>
                            <th>Company</th>
                            <th>Contact Person</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enquiries.map((enquiry, index) => (
                            <tr key={enquiry.id}>
                              <td>{((enquiryCurrentPage - 1) * enquiryItemsPerPage) + index + 1}</td>
                              <td>
                                <strong>{enquiry.enquiry_number}</strong>
                              </td>
                              <td>{enquiry.company_name}</td>
                              <td>
                                {enquiry.contact_person}<br/>
                                <small className="text-muted">{enquiry.contact_mobile}</small>
                              </td>
                              <td>
                                <span className="badge bg-primary">{enquiry.total_items || 0} items</span><br/>
                                <small className="text-muted">Qty: {enquiry.total_quantity || 0}</small>
                              </td>
                              <td>
                                <span className={`badge ${
                                  enquiry.status === 'draft' ? 'bg-warning' :
                                  enquiry.status === 'in_progress' ? 'bg-info' :
                                  enquiry.status === 'responded' ? 'bg-primary' :
                                  enquiry.status === 'converted' ? 'bg-success' :
                                  'bg-secondary'
                                }`}>
                                  {enquiry.status || 'draft'}
                                </span>
                              </td>
                              <td>
                                {new Date(enquiry.created_at).toLocaleDateString()}<br/>
                                <small className="text-muted">
                                  {new Date(enquiry.created_at).toLocaleTimeString()}
                                </small>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-info"
                                    onClick={() => viewEnquiryDetails(enquiry)}
                                    title="View Details"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </button>
                                  {enquiry.status !== 'converted' && (
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() => {
                                        setSelectedEnquiry(enquiry);
                                        convertEnquiryToQuotation();
                                      }}
                                      title="Convert to Quotation"
                                    >
                                      <i className="bi bi-arrow-right-circle"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Enquiry Pagination */}
                    {enquiryTotalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center p-3 border-top">
                        <div className="text-muted">
                          Showing {((enquiryCurrentPage - 1) * enquiryItemsPerPage) + 1} to {Math.min(enquiryCurrentPage * enquiryItemsPerPage, enquiryTotalItems)} of {enquiryTotalItems} entries
                        </div>
                        <nav aria-label="Enquiry page navigation">
                          <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${enquiryCurrentPage === 1 ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => handleEnquiryPageChange(enquiryCurrentPage - 1)}
                                disabled={enquiryCurrentPage === 1}
                              >
                                <i className="bi bi-chevron-left"></i>
                              </button>
                            </li>
                            
                            {getEnquiryPaginationItems().map((pageNum, index) => (
                              <li key={index} className={`page-item ${pageNum === enquiryCurrentPage ? 'active' : ''} ${pageNum === '...' ? 'disabled' : ''}`}>
                                {pageNum === '...' ? (
                                  <span className="page-link">...</span>
                                ) : (
                                  <button 
                                    className="page-link" 
                                    onClick={() => handleEnquiryPageChange(pageNum)}
                                  >
                                    {pageNum}
                                  </button>
                                )}
                              </li>
                            ))}
                            
                            <li className={`page-item ${enquiryCurrentPage === enquiryTotalPages ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => handleEnquiryPageChange(enquiryCurrentPage + 1)}
                                disabled={enquiryCurrentPage === enquiryTotalPages}
                              >
                                <i className="bi bi-chevron-right"></i>
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="bi bi-question-circle display-1 text-muted"></i>
                    </div>
                    <h5 className="text-muted">No enquiries found</h5>
                    <p className="text-muted">Create enquiries to convert them to quotations</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEnquiriesModal(false)}>
                  <i className="bi bi-x-circle me-1"></i>Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enquiry Details Modal */}
      {showEnquiryDetails && selectedEnquiry && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-question-circle me-2"></i>
                  Enquiry Details - {selectedEnquiry.enquiry_number}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEnquiryDetails(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Company Details</h6>
                    <p><strong>{selectedEnquiry.company_name}</strong></p>
                    <p className="mb-1">{selectedEnquiry.company_address}</p>
                    {selectedEnquiry.company_pincode && (
                      <p className="mb-1">Pincode: {selectedEnquiry.company_pincode}</p>
                    )}
                    {selectedEnquiry.company_gstin && (
                      <p className="mb-1">GSTIN: {selectedEnquiry.company_gstin}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6>Contact Details</h6>
                    <p><strong>{selectedEnquiry.contact_person}</strong></p>
                    <p className="mb-1">Phone: {selectedEnquiry.contact_mobile}</p>
                    <p className="mb-1">Email: {selectedEnquiry.contact_email}</p>
                    <div className="mt-2">
                      <span className={`badge ${
                        selectedEnquiry.status === 'draft' ? 'bg-warning' :
                        selectedEnquiry.status === 'in_progress' ? 'bg-info' :
                        selectedEnquiry.status === 'responded' ? 'bg-primary' :
                        selectedEnquiry.status === 'converted' ? 'bg-success' :
                        'bg-secondary'
                      }`}>
                        Status: {selectedEnquiry.status || 'draft'}
                      </span>
                    </div>
                  </div>
                </div>

                <h6 className="mb-3">Items in Enquiry</h6>
                {selectedEnquiry.items && selectedEnquiry.items.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead className="table-light">
                        <tr>
                          <th>Item Name</th>
                          <th>Brand Code</th>
                          <th>Cut Width</th>
                          <th>Cut Length</th>
                          <th>Qty</th>
                          <th>Unit</th>
                          <th>Customer Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEnquiry.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.item_name}</td>
                            <td>{item.brand_code || '-'}</td>
                            <td>{item.cut_width || '-'}</td>
                            <td>{item.length || '-'}</td>
                            <td>{item.quantity}</td>
                            <td>{item.unit}</td>
                            <td>{item.customer_description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    No items found in this enquiry
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEnquiryDetails(false)}>
                  <i className="bi bi-arrow-left me-1"></i>Back to List
                </button>
                {selectedEnquiry.status !== 'converted' && (
                  <button type="button" className="btn btn-success" onClick={convertEnquiryToQuotation}>
                    <i className="bi bi-arrow-right-circle me-1"></i>Convert to Quotation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      {showCompanyModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Step 1: Company Details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={cancelQuotation}></button>
              </div>
              
              <div className="modal-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className={`d-flex align-items-center ${billTo.trim() ? 'text-success' : ''}`}>
                    <div className={`rounded-circle ${billTo.trim() ? 'bg-success' : 'bg-primary'} text-white d-flex align-items-center justify-content-center`} style={{ width: '30px', height: '30px' }}>
                      {billTo.trim() ? <i className="bi bi-check"></i> : '1'}
                    </div>
                    <span className="ms-2">Company Details</span>
                  </div>
                  <div className="flex-grow-1 border-top mx-3"></div>
                  <div className="d-flex align-items-center text-muted">
                    <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>2</div>
                    <span className="ms-2">Add Items</span>
                  </div>
                  <div className="flex-grow-1 border-top mx-3"></div>
                  <div className="d-flex align-items-center text-muted">
                    <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>3</div>
                    <span className="ms-2">Preview</span>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Search Company</label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type company name or contact..."
                      value={billTo}
                      onChange={(e) => handleBillToSearch(e.target.value)}
                      onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                    />
                    
                    {showCompanyDropdown && filteredCompanies.length > 0 && (
                      <div className="position-absolute w-100 bg-white border rounded shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredCompanies.map((company, index) => (
                          <div
                            key={company.id || index}
                            className={`p-2 border-bottom ${selectedCompanyId === (company.id || company.ID)?.toString() ? 'bg-light' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectCompanyFromSearch(company);
                            }}
                          >
                            <div className="fw-bold">{company.companyName || company.company_name}</div>
                            <div className="text-muted small">
                              {company.customerName || company.customer_name} • {company.customerMobile || company.customer_mobile}
                            </div>
                            {(company.pinCode || company.pin_code) && (
                              <div className="text-muted small mt-1">
                                <span className="badge bg-info text-white me-1">Pincode: {company.pinCode || company.pin_code}</span>
                                {company.gstNumber || company.gst_number ? (
                                  <span className="badge bg-secondary">GST: {company.gstNumber || company.gst_number}</span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {loadingCompanies && <div className="alert alert-info mt-2 py-2">Loading companies...</div>}
                  {companyError && <div className="alert alert-warning mt-2 py-2">{companyError}</div>}
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Contact Person</label>
                      <input
                        type="text"
                        className="form-control"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Contact Mobile</label>
                      <input
                        type="text"
                        className="form-control"
                        value={contactMob}
                        onChange={(e) => handleContactMobChange(e.target.value)}
                        placeholder="Type mobile to auto-fill"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Company Address</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Pincode</label>
                      <input
                        type="text"
                        className="form-control"
                        value={companyPincode}
                        onChange={(e) => setCompanyPincode(e.target.value)}
                        placeholder="Enter pincode"
                      />
                      {extractPincode(companyAddress) && companyPincode !== extractPincode(companyAddress) && (
                        <div className="form-text text-info">
                          <i className="bi bi-info-circle me-1"></i>
                          Found pincode in address: {extractPincode(companyAddress)}. Click to copy:
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-info ms-2"
                            onClick={() => setCompanyPincode(extractPincode(companyAddress))}
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Company GSTIN</label>
                      <input
                        type="text"
                        className="form-control"
                        value={companyGstin}
                        onChange={(e) => setCompanyGstin(e.target.value)}
                        placeholder="Enter GST number"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Contact Email</label>
                      <div className="input-group">
                        <input
                          type="email"
                          className="form-control"
                          value={contactEmail}
                          onChange={(e) => {
                            setContactEmail(e.target.value);
                            if (e.target.value !== issuer.email) {
                              setContactEmailSame(false);
                            }
                          }}
                        />
                        <div className="input-group-text">
                          <input
                            className="form-check-input me-1"
                            type="checkbox"
                            id="sameEmail"
                            checked={contactEmailSame}
                            onChange={(e) => setContactEmailSame(e.target.checked)}
                          />
                          <label className="form-check-label small" htmlFor="sameEmail">
                            Use issuer email
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CC Email Field */}
                <div className="mb-3">
                  <label className="form-label">
                    <i className="bi bi-person-badge me-1"></i>
                    CC Email (Carbon Copy)
                    <span className="text-muted ms-1 small">- Optional, for additional recipients</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="cc@example.com (comma-separated for multiple)"
                  />
                  <div className="form-text">
                    Enter email addresses to send a carbon copy of this quotation. Separate multiple emails with commas.
                  </div>
                </div>

                {/* Profit Percentage Input */}
                <div className="mb-3">
                  <label className="form-label">
                    <i className="bi bi-percent me-1"></i>
                    Profit Percentage
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    step="0.1"
                    value={profitPercentage}
                    onChange={(e) => setProfitPercentage(parseFloat(e.target.value) || 20)}
                    placeholder="Enter profit percentage"
                  />
                  <div className="form-text">
                    Used to calculate total: Price/Unit + (Price/Unit × profit%)
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={cancelQuotation}>
                    <i className="bi bi-x-circle me-1"></i>Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={goToItems} disabled={!billTo.trim()}>
                    Next: Add Items <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Modal */}
      {showItemsModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Step 2: Add Items</h5>
                <button type="button" className="btn-close btn-close-white" onClick={cancelQuotation}></button>
              </div>
              
              <div className="modal-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center text-success">
                    <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>
                      <i className="bi bi-check"></i>
                    </div>
                    <span className="ms-2">Company Details</span>
                  </div>
                  <div className="flex-grow-1 border-top mx-3"></div>
                  <div className="d-flex align-items-center text-primary">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>2</div>
                    <span className="ms-2">Add Items</span>
                  </div>
                  <div className="flex-grow-1 border-top mx-3"></div>
                  <div className="d-flex align-items-center text-muted">
                    <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>3</div>
                    <span className="ms-2">Preview</span>
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Items List {items.length > 0 && <span className="badge bg-primary ms-2">{items.length} items</span>}</h6>
                      <button className="btn btn-sm btn-success" onClick={addItemViaPopup}>
                        <i className="bi bi-plus-circle me-1"></i>Add Item
                      </button>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    {items.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="bi bi-box display-1 text-muted mb-3"></i>
                        <h5 className="text-muted">No items added</h5>
                        <p className="text-muted">Click "Add Item" to start adding items to your quotation</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover mb-0">
                          <thead className="table-light">
                            <tr>
                              <th width="50">#</th>
                              <th>Item Name</th>
                              <th width="120">Brand Code</th>
                              <th width="120">Part No</th>
                              <th width="80">Width</th>
                              <th width="80">Length</th>
                              <th width="80">Count</th>
                              <th width="80">Qty</th>
                              <th width="80">Unit</th>
                              <th width="100">Price/Unit</th>
                              <th width="120">Discount</th>
                              <th width="100">Total</th>
                              <th width="80">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, index) => (
                              <tr key={item.id}>
                                <td>{index + 1}</td>
                                <td>
                                  <div className="fw-bold">{item.item_name}</div>
                                  <div className="text-muted small">{item.customer_description?.substring(0, 30) || item.description?.substring(0, 30)}...</div>
                                </td>
                                <td>{item.brand_code || ''}</td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={item.supplier_part_no}
                                    onChange={(e) => handleItemChange(index, "supplier_part_no", e.target.value)}
                                    placeholder="Part No"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    min="1"
                                    step="0.1"
                                    value={item.cut_width}
                                    onChange={(e) => handleItemChange(index, "cut_width", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    min="1"
                                    step="0.1"
                                    value={item.length}
                                    onChange={(e) => handleItemChange(index, "length", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <div className="form-control form-control-sm bg-light">
                                    {calculateCount(item).toFixed(2)}
                                  </div>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                    placeholder="Enter quantity"
                                  />
                                </td>
                                <td>{item.unit}</td>
                                <td className="text-end">₹{pricePerUnit(item).toFixed(2)}</td>
                                <td>
                                  <div className="input-group input-group-sm">
                                    <input
                                      type="number"
                                      className="form-control"
                                      min="0"
                                      step="0.01"
                                      value={item.discount}
                                      onChange={(e) => handleItemChange(index, "discount", e.target.value)}
                                    />
                                    <select
                                      className="form-select"
                                      style={{ width: '80px' }}
                                      value={item.discount_type}
                                      onChange={(e) => handleItemChange(index, "discount_type", e.target.value)}
                                    >
                                      <option value="amount">₹</option>
                                      <option value="percentage">%</option>
                                    </select>
                                  </div>
                                </td>
                                <td className="text-end fw-bold">₹{itemTotal(item).toFixed(2)}</td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => removeItem(index)}
                                    title="Delete"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-body">
                        <h6 className="card-title">Quick Summary</h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Items:</span>
                          <strong>{items.length}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Subtotal:</span>
                          <strong>₹{totals.subtotal.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Discount:</span>
                          <strong className="text-danger">-₹{totals.totalDiscount.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Tax (18%):</span>
                          <strong>₹{totals.totalGST.toFixed(2)}</strong>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between fw-bold">
                          <span>Grand Total:</span>
                          <strong className="text-primary">₹{totals.grandTotal.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={goBackToCompany}>
                    <i className="bi bi-arrow-left me-1"></i>Back to Company
                  </button>
                  <button type="button" className="btn btn-primary" onClick={goToPreview} disabled={items.length === 0 || items.some(item => !item.item_name.trim())}>
                    Next: Preview <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Selection Popup Modal */}
      {showItemPopup && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">Add Item from Stock</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowItemPopup(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Search Stock Items</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by item name, brand code, or description..."
                    value={itemSearchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setItemSearchTerm(value);
                      if (value.trim().length > 1) {
                        const searchTerm = value.toLowerCase();
                        const filtered = stockItems.filter(item =>
                          item["Item Name"]?.toLowerCase().includes(searchTerm) ||
                          item["Brand Code"]?.toLowerCase().includes(searchTerm) ||
                          item["Brand Description"]?.toLowerCase().includes(searchTerm)
                        ).slice(0, 10);
                        setSearchResults(filtered);
                        setShowResults(true);
                      } else {
                        setSearchResults([]);
                        setShowResults(false);
                      }
                    }}
                  />
                  
                  {showResults && searchResults.length > 0 && (
                    <div className="border rounded mt-1 bg-white" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {searchResults.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className={`p-3 border-bottom ${selectedStockItem?.id === item.id ? 'bg-light' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedStockItem(item);
                            setItemSearchTerm(item["Item Name"] || "");
                            setNewItemBrandCode(item["Brand Code"] || "");
                            setShowResults(false);
                            const allBatchCodes = stockItems
                              .filter(stockItem => stockItem["Brand Code"] === item["Brand Code"])
                              .map(stockItem => stockItem["Batch Code"])
                              .filter(Boolean);
                            setAvailableBatchCodes(Array.from(new Set(allBatchCodes)));
                            setNewItemSupplierPartNo(item["Brand Code"] || "");
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="fw-bold mb-1">{item["Item Name"]}</div>
                              <div className="mb-1">
                                <span className="badge bg-primary me-1">Brand</span>
                                <strong>{item["Brand"] || "N/A"}</strong>
                              </div>
                              <div className="mb-1">
                                <span className="badge bg-secondary me-1">Code</span>
                                <strong className="text-dark">{item["Brand Code"]}</strong>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-success mb-1">MRP: ₹{parseFloat(item["MRP"] || 0).toFixed(2)}</div>
                              <div className="fw-bold text-info">Buy: ₹{parseFloat(item["Buy Price"] || 0).toFixed(2)}</div>
                            </div>
                          </div>
                          
                          <div className="row mb-2">
                            <div className="col-6">
                              {item["Width"] && item["Length"] && (
                                <div className="mb-1">
                                  <span className="badge bg-light text-dark me-1">Dimensions</span>
                                  {item["Width"]} × {item["Length"]} {item["Unit"] || "pcs"}
                                </div>
                              )}
                            </div>
                            <div className="col-6">
                              {item["Batch Code"] && (
                                <div className="mb-1">
                                  <span className="badge bg-light text-dark me-1">Batch</span>
                                  {item["Batch Code"]}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {item["Brand Description"] && (
                            <div className="small text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>
                              <span className="badge bg-light text-dark me-1"> Brand Description</span>
                              {item["Brand Description"]}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedStockItem && (
                  <div className="card mt-3">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Item Details</h6>
                      <div className="text-end">
                        <span className="badge bg-success me-2">MRP: ₹{parseFloat(selectedStockItem["MRP"] || 0).toFixed(2)}</span>
                        <span className="badge bg-info">Buy: ₹{parseFloat(selectedStockItem["Buy Price"] || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Item Name</label>
                            <input type="text" className="form-control" value={selectedStockItem["Item Name"] || ""} readOnly />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Brand</label>
                            <input type="text" className="form-control" value={selectedStockItem["Brand"] || ""} readOnly />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Brand Code</label>
                            <input type="text" className="form-control" value={selectedStockItem["Brand Code"] || ""} readOnly />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Batch Code</label>
                            <select className="form-select" value={newItemBatchCode} onChange={(e) => setNewItemBatchCode(e.target.value)}>
                              <option value="">-- Select --</option>
                              {availableBatchCodes.map((code, idx) => (
                                <option key={idx} value={code}>{code}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Unit</label>
                            <input type="text" className="form-control" value={selectedStockItem["Unit"] || "pcs"} readOnly />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Customer Part No</label>
                            <textarea
                              className="form-control"
                              rows="2"
                              value={newItemSupplierPartNo}
                              onChange={(e) => setNewItemSupplierPartNo(e.target.value)}
                              placeholder="Enter supplier part number..."
                            />
                            <div className="form-text">
                              This will be displayed as "Part No" in the quotation
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Cut Width</label>
                            <input
                              type="number"
                              className="form-control"
                              step="0.1"
                              value={newItemCutWidth}
                              onChange={(e) => setNewItemCutWidth(e.target.value)}
                              placeholder="Width"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Cut Length</label>
                            <input
                              type="number"
                              className="form-control"
                              step="0.1"
                              value={newItemLength}
                              onChange={(e) => setNewItemLength(e.target.value)}
                              placeholder="Length"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">MRP</label>
                            <input type="text" className="form-control" value={`₹${parseFloat(selectedStockItem["MRP"] || 0).toFixed(2)}`} readOnly />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Quantity</label>
                            <input
                              type="number"
                              className="form-control"
                              min="1"
                              value={newItemQuantity}
                              onChange={(e) => setNewItemQuantity(e.target.value)}
                              placeholder="Enter quantity"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Price/Unit (Calculated)</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={`₹${((parseFloat(selectedStockItem["MRP"] || 0) * (parseFloat(newItemLength) || 0) * (parseFloat(newItemCutWidth) || 0)) || 0).toFixed(2)}`} 
                              readOnly 
                            />
                            <small className="text-muted">MRP × Length × Width</small>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Count (Calculated)</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={((parseFloat(newItemLength) || 0) * (parseFloat(newItemCutWidth) || 0) * (parseFloat(newItemQuantity) || 0)).toFixed(2)} 
                              readOnly 
                            />
                            <small className="text-muted">Length × Width × Quantity</small>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Discount</label>
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                min="0"
                                step="0.01"
                                value={newItemDiscount}
                                onChange={(e) => setNewItemDiscount(e.target.value)}
                                placeholder="Discount"
                              />
                              <select
                                className="form-select"
                                style={{ width: '100px' }}
                                value={newItemDiscountType}
                                onChange={(e) => setNewItemDiscountType(e.target.value)}
                              >
                                <option value="amount">₹</option>
                                <option value="percentage">%</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Customer Description</label>
                            <textarea
                              className="form-control"
                              rows="2"
                              value={newItemCustomerDescription}
                              onChange={(e) => setNewItemCustomerDescription(e.target.value)}
                              placeholder="Enter customer description here..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Packing Charges</label>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              step="0.01"
                              value={newItemPackingCharges}
                              onChange={(e) => setNewItemPackingCharges(e.target.value)}
                              placeholder="Packing charges"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Freight Charges</label>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              step="0.01"
                              value={newItemOtherCharges}
                              onChange={(e) => setNewItemOtherCharges(e.target.value)}
                              placeholder="Freight charges"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Tax Rate (GST%)</label>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              max="100"
                              step="0.1"
                              value="18"
                              readOnly
                            />
                            <small className="text-muted">Default GST rate</small>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowItemPopup(false)}>
                          <i className="bi bi-x-circle me-1"></i>Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => {
                          if (!selectedStockItem) {
                            alert("Please select an item first!");
                            return;
                          }
                          
                          const newItem = {
                            id: idRef.current + 1,
                            item_name: selectedStockItem["Item Name"] || "",
                            brand_code: newItemBrandCode || selectedStockItem["Brand Code"] || "",
                            hsn_sac: selectedStockItem["HSN"] || "",
                            supplier_part_no: newItemSupplierPartNo || "",
                            description: selectedStockItem["Brand Description"] || "",
                            cut_width: parseFloat(newItemCutWidth) || parseFloat(selectedStockItem["Width"]) || 1,
                            length: parseFloat(newItemLength) || parseFloat(selectedStockItem["Length"]) || 1,
                            count: (parseFloat(newItemLength) || 1) * (parseFloat(newItemCutWidth) || 1) * (parseFloat(newItemQuantity) || 1),
                            batch_no: newItemBatchCode || `B-${Date.now().toString().slice(-6)}-${items.length + 1}`,
                            mrp: parseFloat(selectedStockItem["MRP"]) || 0,
                            buy_price: parseFloat(selectedStockItem["Buy Price"]) || 0,
                            quantity: parseFloat(newItemQuantity) || 1,
                            unit: selectedStockItem["Unit"] || "pcs",
                            discount: parseFloat(newItemDiscount) || 0,
                            discount_type: newItemDiscountType,
                            tax_rate: 18.0,
                            packing_charges: parseFloat(newItemPackingCharges) || 0,
                            other_charges: parseFloat(newItemOtherCharges) || 0,
                            customer_description: newItemCustomerDescription,
                            item_status: "pending"
                          };
                          
                          setItems(prev => [...prev, newItem]);
                          idRef.current = idRef.current + 1;
                          setSelectedStockItem(null);
                          setItemSearchTerm("");
                          setNewItemCutWidth("");
                          setNewItemLength("");
                          setNewItemCount("1");
                          setNewItemBatchCode("");
                          setNewItemDiscount("0");
                          setNewItemPackingCharges("0");
                          setNewItemOtherCharges("0");
                          setNewItemCustomerDescription("");
                          setNewItemSupplierPartNo("");
                          setNewItemBrandCode("");
                          setShowItemPopup(false);
                          setShowResults(false);
                        }}>
                          <i className="bi bi-plus-circle me-1"></i>Add to Quotation
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Step 3: Preview & Save</h5>
                <button type="button" className="btn-close btn-close-white" onClick={cancelQuotation}></button>
              </div>
              <div className="modal-body">
                <div ref={quotationRef}>
                  <div className="container">
                    <div className="invoice-header border-bottom pb-3 mb-3">
                      <div className="row">
                        <div className="col-2">
                          <img 
                            src={companyLogo} 
                            alt="Company Logo" 
                            className="img-fluid"
                            style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="col-5">
                          <h1 className="mb-1">{issuer.name}</h1>
                          <p className="mb-1">{issuer.address}</p>
                          <p className="mb-1">Phone: {issuer.phone} | Email: {issuer.email}</p>
                          <p className="mb-1">GSTIN: {issuer.gstin} | State: {issuer.stateCode}</p>
                        </div>
                        <div className="col-5 text-end">
                          <h2 className="text-primary mb-3">QUOTATION</h2>
                          <p className="mb-1"><strong>Quote No:</strong> {quoteNo}</p>
                          <p className="mb-1"><strong>Date:</strong> {date}</p>
                          <p className="mb-1"><strong>Time:</strong> {time}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="row mb-4">
                      <div className="col-6">
                        <h5>Bill To:</h5>
                        <p className="mb-1"><strong>{billTo}</strong></p>
                        <p className="mb-1">{companyAddress}</p>
                        {companyPincode && (
                          <p className="mb-1">
                            Pincode: <span className="badge bg-info text-white">{companyPincode}</span>
                          </p>
                        )}
                        <p className="mb-1">GSTIN: {companyGstin}</p>
                      </div>
                      <div className="col-6">
                        <h5>Contact Details:</h5>
                        <p className="mb-1"><strong>{contactPerson}</strong></p>
                        <p className="mb-1">Phone: {contactMob}</p>
                        <p className="mb-1">Email: {contactEmail}</p>
                        {ccEmail && (
                          <p className="mb-1">
                            CC: {ccEmail} <span className="badge bg-secondary">CC</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Item Name</th>
                            <th>Brand Code</th>
                            <th>Cut Width</th>
                            <th>Cut Length</th>
                            <th>Customer Part No</th>
                            <th>Customer Description</th>
                            <th>Qty</th>
                            <th>UoM</th>
                            <th>Price/Unit</th>
                            <th>GST %</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={item.id}>
                              <td>{index + 1}</td>
                              <td><strong>{item.item_name}</strong></td>
                              <td>{item.brand_code || ''}</td>
                              <td>{item.cut_width}</td>
                              <td>{item.length}</td>
                              <td>{item.supplier_part_no}</td>
                              <td>{item.customer_description || ''}</td>
                              <td>{item.quantity}</td>
                              <td>{item.unit}</td>
                              <td>₹{pricePerUnit(item).toFixed(2)}</td>
                              <td>{item.tax_rate}%</td>
                              <td><strong>₹{amountAfterDiscount(item).toFixed(2)}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="row mt-4">
                      <div className="col-7">
                        <h5 className="mb-2">Tax Summary:</h5>
                        <table className="table table-bordered table-sm">
                          <thead className="table-light">
                            <tr>
                              <th>GST %</th>
                              <th>Taxable Amount</th>
                              <th>Tax Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const taxSummary = {};
                              items.forEach(item => {
                                const taxRate = item.tax_rate || 18;
                                const taxAmount = gstAmount(item);
                                if (!taxSummary[taxRate]) {
                                  taxSummary[taxRate] = 0;
                                }
                                taxSummary[taxRate] += taxAmount;
                              });
                              
                              return Object.entries(taxSummary).map(([rate, amount]) => (
                                <tr key={rate}>
                                  <td>{rate}%</td>
                                  <td>₹{(amount / (parseFloat(rate) / 100)).toFixed(2)}</td>
                                  <td>₹{amount.toFixed(2)}</td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                      <div className="col-5">
                        <div className="card border-0">
                          <div className="card-body">
                            <h5 className="card-title">Total Summary</h5>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Subtotal:</span>
                              <strong>₹{totals.subtotal.toFixed(2)}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Discount:</span>
                              <strong className="text-danger">- ₹{totals.totalDiscount.toFixed(2)}</strong>
                            </div>
                            {totals.totalPacking > 0 && (
                              <div className="d-flex justify-content-between mb-2">
                                <span>Packing:</span>
                                <strong>₹{totals.totalPacking.toFixed(2)}</strong>
                              </div>
                            )}
                            {totals.totalFreight > 0 && (
                              <div className="d-flex justify-content-between mb-2">
                                <span>Freight:</span>
                                <strong>₹{totals.totalFreight.toFixed(2)}</strong>
                              </div>
                            )}
                            <div className="d-flex justify-content-between mb-2">
                              <span>Taxable Amount:</span>
                              <strong>₹{totals.totalBeforeGST.toFixed(2)}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Total Tax:</span>
                              <strong>₹{totals.totalGST.toFixed(2)}</strong>
                            </div>
                            <hr/>
                            <div className="d-flex justify-content-between total-row">
                              <span>Grand Total:</span>
                              <strong className="text-primary">₹{totals.grandTotal.toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bank-details mt-4 p-3" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #0d6efd' }}>
                      <h5 className="mb-2">Bank Details:</h5>
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-1"><strong>Account No:</strong> ${bankDetails.accountNo}</p>
                          <p className="mb-1"><strong>Account Title:</strong> ${bankDetails.accountTitle}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1"><strong>IFSC Code:</strong> ${bankDetails.ifscCode}</p>
                          <p className="mb-1"><strong>Bank:</strong> HDFC Bank</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-light rounded">
                      <h5>Notes:</h5>
                      <p className="mb-0">Please process this quote as per the terms mentioned. All prices are in INR and inclusive of GST. Delivery within 7-10 business days.</p>
                      <p className="mb-0 mt-2"><strong>Valid for 30 days from the date of issue.</strong></p>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer mt-3">
                  <button type="button" className="btn btn-secondary" onClick={goBackToItems}>
                    <i className="bi bi-arrow-left me-1"></i>Back to Items
                  </button>
                  <button type="button" className="btn btn-info" onClick={exportPdf}>
                    <i className="bi bi-file-pdf me-1"></i>Export PDF
                  </button>
                  <button type="button" className="btn btn-success" onClick={saveQuotation} disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-1"></i>Save Quotation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quotation Modal */}
      {showEditModal && editingQuotation && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-warning text-white">
                <h5 className="modal-title">
                  <i className="bi bi-pencil me-2"></i>
                  Edit Quotation - {editingQuotation.quote_number || editingQuotation.quoteNo}
                  <span className="badge bg-info ms-2">Re-quote → Draft</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => {
                  setShowEditModal(false);
                  setEditingQuotation(null);
                  setIsEditing(false);
                  setItems([]);
                }}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  You are editing a quotation with "requote" status. After saving, it will be changed to "draft" status.
                </div>

                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Company Details</h6>
                      <span className="badge bg-warning">Editing</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Company Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={billTo}
                            onChange={(e) => setBillTo(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Contact Person</label>
                          <input
                            type="text"
                            className="form-control"
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Contact Mobile</label>
                          <input
                            type="text"
                            className="form-control"
                            value={contactMob}
                            onChange={(e) => setContactMob(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Contact Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Company Address</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Pincode</label>
                          <input
                            type="text"
                            className="form-control"
                            value={companyPincode}
                            onChange={(e) => setCompanyPincode(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Company GSTIN</label>
                          <input
                            type="text"
                            className="form-control"
                            value={companyGstin}
                            onChange={(e) => setCompanyGstin(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Quote Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={quoteNo}
                            onChange={(e) => setQuoteNo(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    {/* CC Field in Edit Modal */}
                    <div className="mb-3">
                      <label className="form-label">
                        <i className="bi bi-person-badge me-1"></i>
                        CC Email (Carbon Copy)
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={ccEmail}
                        onChange={(e) => setCcEmail(e.target.value)}
                        placeholder="cc@example.com"
                      />
                    </div>
                    {/* Profit Percentage Input */}
                    <div className="mb-3">
                      <label className="form-label">
                        <i className="bi bi-percent me-1"></i>
                        Profit Percentage
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        max="100"
                        step="0.1"
                        value={profitPercentage}
                        onChange={(e) => setProfitPercentage(parseFloat(e.target.value) || 20)}
                        placeholder="Enter profit percentage"
                      />
                    </div>
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Items List {items.length > 0 && <span className="badge bg-primary ms-2">{items.length} items</span>}</h6>
                      <button className="btn btn-sm btn-success" onClick={addItemViaPopup}>
                        <i className="bi bi-plus-circle me-1"></i>Add Item
                      </button>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    {items.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="bi bi-box display-1 text-muted mb-3"></i>
                        <h5 className="text-muted">No items added</h5>
                        <p className="text-muted">Click "Add Item" to start adding items to your quotation</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover mb-0">
                          <thead className="table-light">
                            <tr>
                              <th width="50">#</th>
                              <th>Item Name</th>
                              <th width="120">Brand Code</th>
                              <th width="120">Part No</th>
                              <th width="80">Width</th>
                              <th width="80">Length</th>
                              <th width="80">Count</th>
                              <th width="80">Qty</th>
                              <th width="80">Unit</th>
                              <th width="100">Price/Unit</th>
                              <th width="120">Discount</th>
                              <th width="100">Total</th>
                              <th width="80">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, index) => (
                              <tr key={item.id}>
                                <td>{index + 1}</td>
                                <td>
                                  <div className="fw-bold">{item.item_name}</div>
                                  <div className="text-muted small">{item.customer_description?.substring(0, 30) || item.description?.substring(0, 30)}...</div>
                                </td>
                                <td>{item.brand_code || ''}</td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={item.supplier_part_no}
                                    onChange={(e) => handleItemChange(index, "supplier_part_no", e.target.value)}
                                    placeholder="Part No"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    min="1"
                                    step="0.1"
                                    value={item.cut_width}
                                    onChange={(e) => handleItemChange(index, "cut_width", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    min="1"
                                    step="0.1"
                                    value={item.length}
                                    onChange={(e) => handleItemChange(index, "length", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <div className="form-control form-control-sm bg-light">
                                    {calculateCount(item).toFixed(2)}
                                  </div>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                    placeholder="Enter quantity"
                                  />
                                </td>
                                <td>{item.unit}</td>
                                <td className="text-end">₹{pricePerUnit(item).toFixed(2)}</td>
                                <td>
                                  <div className="input-group input-group-sm">
                                    <input
                                      type="number"
                                      className="form-control"
                                      min="0"
                                      step="0.01"
                                      value={item.discount}
                                      onChange={(e) => handleItemChange(index, "discount", e.target.value)}
                                    />
                                    <select
                                      className="form-select"
                                      style={{ width: '80px' }}
                                      value={item.discount_type}
                                      onChange={(e) => handleItemChange(index, "discount_type", e.target.value)}
                                    >
                                      <option value="amount">₹</option>
                                      <option value="percentage">%</option>
                                    </select>
                                  </div>
                                </td>
                                <td className="text-end fw-bold">₹{itemTotal(item).toFixed(2)}</td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => removeItem(index)}
                                    title="Delete"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-body">
                        <h6 className="card-title">Quick Summary</h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Items:</span>
                          <strong>{items.length}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Subtotal:</span>
                          <strong>₹{totals.subtotal.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Discount:</span>
                          <strong className="text-danger">-₹{totals.totalDiscount.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Tax (18%):</span>
                          <strong>₹{totals.totalGST.toFixed(2)}</strong>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between fw-bold">
                          <span>Grand Total:</span>
                          <strong className="text-primary">₹{totals.grandTotal.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer mt-3">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowEditModal(false);
                    setEditingQuotation(null);
                    setIsEditing(false);
                    setItems([]);
                  }}>
                    <i className="bi bi-x-circle me-1"></i>Cancel
                  </button>
                  <button type="button" className="btn btn-warning" onClick={updateQuotation} disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-1"></i>Update Quotation (Change to Draft)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Quotation Modal */}
      {showViewModal && selectedQuotation && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">Quotation Details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="container">
                  <div className="invoice-header border-bottom pb-3 mb-3">
                    <div className="row">
                      <div className="col-2">
                        <img 
                          src={companyLogo} 
                          alt="Company Logo" 
                          className="img-fluid"
                          style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'contain' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="col-5">
                        <h1 className="mb-1">{issuer.name}</h1>
                        <p className="mb-1">{issuer.address}</p>
                        <p className="mb-1">Phone: {issuer.phone} | Email: {issuer.email}</p>
                        <p className="mb-1">GSTIN: {issuer.gstin} | State: {issuer.stateCode}</p>
                      </div>
                      <div className="col-5 text-end">
                        <h2 className="text-info mb-3">QUOTATION</h2>
                        <p className="mb-1"><strong>Quote No:</strong> {selectedQuotation.quote_number || selectedQuotation.quoteNo}</p>
                        <p className="mb-1"><strong>Date:</strong> {selectedQuotation.date || selectedQuotation.date}</p>
                        <p className="mb-1"><strong>Time:</strong> {selectedQuotation.time || selectedQuotation.time}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-4">
                    <div className="col-6">
                      <h5>Bill To:</h5>
                      <p className="mb-1"><strong>{selectedQuotation.company_name || selectedQuotation.billTo}</strong></p>
                      <p className="mb-1">{selectedQuotation.company_address || ''}</p>
                      {(selectedQuotation.company_pincode || extractPincode(selectedQuotation.company_address || '')) && (
                        <p className="mb-1">
                          Pincode: <span className="badge bg-info text-white">{selectedQuotation.company_pincode || extractPincode(selectedQuotation.company_address || '')}</span>
                        </p>
                      )}
                      <p className="mb-1">GSTIN: {selectedQuotation.company_gstin || ''}</p>
                    </div>
                    <div className="col-6">
                      <h5>Contact Details:</h5>
                      <p className="mb-1"><strong>{selectedQuotation.contact_person || selectedQuotation.contactPerson}</strong></p>
                      <p className="mb-1">Phone: {selectedQuotation.contact_mobile || selectedQuotation.contactMob}</p>
                      <p className="mb-1">Email: {selectedQuotation.contact_email || selectedQuotation.contactEmail}</p>
                      {(selectedQuotation.cc_email || selectedQuotation.ccEmail) && (
                        <p className="mb-1">
                          CC: {selectedQuotation.cc_email || selectedQuotation.ccEmail} <span className="badge bg-secondary">CC</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Item Name</th>
                          <th>Brand Code</th>
                          <th>Cut Width</th>
                          <th>Cut Length</th>
                          <th>Customer Part No</th>
                          <th>Customer Description</th>
                          <th>Qty</th>
                          <th>UoM</th>
                          <th>Price/Unit</th>
                          <th>GST %</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedQuotation.items || []).map((item, index) => {
                          let brand_code = "";
                          let customer_description = "";
                          let display_description = item.description || "";
                          
                          if (display_description) {
                            try {
                              if (display_description.includes('[BRAND_CODE:') && display_description.includes('[CUSTOMER_DESC:')) {
                                const brandCodeMatch = display_description.match(/\[BRAND_CODE:(.*?)\]/);
                                const customerDescMatch = display_description.match(/\[CUSTOMER_DESC:(.*?)\]/);
                                
                                if (brandCodeMatch) brand_code = brandCodeMatch[1];
                                if (customerDescMatch) customer_description = customerDescMatch[1];
                                
                                display_description = display_description
                                  .replace(/\[BRAND_CODE:.*?\]/, '')
                                  .replace(/\[CUSTOMER_DESC:.*?\]/, '')
                                  .trim();
                              }
                            } catch (e) {
                              console.error("Error parsing description:", e);
                            }
                          }
                          
                          // Calculate price per unit according to new formula: MRP × Length × Width
                          const pricePerUnit = (item) => {
                            const mrp = parseFloat(item.mrp) || 0;
                            const length = parseFloat(item.length) || 0;
                            const width = parseFloat(item.cut_width) || 0;
                            return parseFloat((mrp * length * width).toFixed(2)) || 0;
                          };
                          
                          const itemPricePerUnit = pricePerUnit(item);
                          
                          // Calculate total with profit: Price/Unit + (Price/Unit × profit%)
                          const profitPercentage = selectedQuotation.profit_percentage || 20;
                          const totalWithProfit = itemPricePerUnit + (itemPricePerUnit * (profitPercentage / 100));
                          
                          // Calculate amount before discount: Total with profit × Quantity
                          const amountBeforeDiscount = totalWithProfit * (item.quantity || 1);
                          
                          // Calculate discount amount
                          const discountAmount = (item) => {
                            const amount = amountBeforeDiscount;
                            const discount = parseFloat(item.discount) || 0;
                            
                            if (item.discount_type === "percentage") {
                              return parseFloat((amount * discount / 100).toFixed(2));
                            } else {
                              return parseFloat(discount.toFixed(2));
                            }
                          };
                          
                          const discount = discountAmount(item);
                          const amountAfterDiscount = amountBeforeDiscount - discount;
                          
                          return (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td><strong>{item.item_name}</strong></td>
                              <td>{brand_code || item.brand_code || ''}</td>
                              <td>{item.cut_width || ''}</td>
                              <td>{item.length || ''}</td>
                              <td>{item.supplier_part_no}</td>
                              <td>{customer_description || item.customer_description || ''}</td>
                              <td>{item.quantity}</td>
                              <td>{item.unit}</td>
                              <td>₹{itemPricePerUnit.toFixed(2)}</td>
                              <td>{item.tax_rate || 18}%</td>
                              <td><strong>₹{amountAfterDiscount.toFixed(2)}</strong></td>
                              <td>
                                <span className={`badge ${item.item_status === 'pending' ? 'bg-warning' : item.item_status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                                  {item.item_status || 'pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="row mt-4">
                    <div className="col-7">
                      <h5 className="mb-2">Tax Summary:</h5>
                      <table className="table table-bordered table-sm">
                        <thead className="table-light">
                          <tr>
                            <th>GST %</th>
                            <th>Taxable Amount</th>
                            <th>Tax Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const taxSummary = {};
                            (selectedQuotation.items || []).forEach(item => {
                              const taxRate = item.tax_rate || 18;
                              const taxAmount = item.tax_amount || 0;
                              if (!taxSummary[taxRate]) {
                                taxSummary[taxRate] = 0;
                              }
                              taxSummary[taxRate] += taxAmount;
                            });
                            
                            return Object.entries(taxSummary).map(([rate, amount]) => (
                              <tr key={rate}>
                                <td>{rate}%</td>
                                <td>₹{(amount / (parseFloat(rate) / 100)).toFixed(2)}</td>
                                <td>₹{amount.toFixed(2)}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    <div className="col-5">
                      <div className="card border-0">
                        <div className="card-body">
                          <h5 className="card-title">Total Summary</h5>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Subtotal:</span>
                            <strong>₹{(selectedQuotation.subtotal || selectedQuotation.totals?.subtotal || 0).toFixed(2)}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Discount:</span>
                            <strong className="text-danger">- ₹{(selectedQuotation.total_discount || selectedQuotation.totals?.totalDiscount || 0).toFixed(2)}</strong>
                          </div>
                          {(selectedQuotation.total_packing || selectedQuotation.totals?.totalPacking || 0) > 0 && (
                            <div className="d-flex justify-content-between mb-2">
                              <span>Packing:</span>
                              <strong>₹{(selectedQuotation.total_packing || selectedQuotation.totals?.totalPacking || 0).toFixed(2)}</strong>
                            </div>
                          )}
                          {(selectedQuotation.total_freight || selectedQuotation.totals?.totalFreight || 0) > 0 && (
                            <div className="d-flex justify-content-between mb-2">
                              <span>Freight:</span>
                              <strong>₹{(selectedQuotation.total_freight || selectedQuotation.totals?.totalFreight || 0).toFixed(2)}</strong>
                            </div>
                          )}
                          <div className="d-flex justify-content-between mb-2">
                            <span>Taxable Amount:</span>
                            <strong>₹{(selectedQuotation.total_before_gst || selectedQuotation.totals?.totalBeforeGST || 0).toFixed(2)}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Total Tax:</span>
                            <strong>₹{(selectedQuotation.total_tax || selectedQuotation.totals?.totalGST || 0).toFixed(2)}</strong>
                          </div>
                          <hr/>
                          <div className="d-flex justify-content-between total-row">
                            <span>Grand Total:</span>
                            <strong className="text-primary">₹{(selectedQuotation.grand_total || selectedQuotation.totals?.grandTotal || 0).toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bank Details Section */}
                  <div className="bank-details mt-4 p-3" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #0d6efd' }}>
                    <h5 className="mb-2">Bank Details:</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Account No:</strong> ${bankDetails.accountNo}</p>
                        <p className="mb-1"><strong>Account Title:</strong> ${bankDetails.accountTitle}</p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1"><strong>IFSC Code:</strong> ${bankDetails.ifscCode}</p>
                        <p className="mb-1"><strong>Bank:</strong> HDFC Bank</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                  <i className="bi bi-x-circle me-1"></i>Close
                </button>
                <button type="button" className="btn btn-primary" onClick={() => printQuotation(selectedQuotation)}>
                  <i className="bi bi-printer me-1"></i>Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Quotations Section */}
      <div className="card">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              Saved Quotations 
              <span className="ms-2">
                <span className="badge bg-primary">Total: {totalItems}</span>
                {statusFilter !== 'all' && (
                  <span className="badge bg-info ms-1">Filtered: {savedQuotations.length}</span>
                )}
                <span className="badge bg-secondary ms-1">User: {currentUser.username || 'You'}</span>
              </span>
            </h5>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ width: '250px' }}
                placeholder="Search by quote no, company, contact..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchTerm && (
                <button className="btn btn-sm btn-outline-danger" onClick={resetSearch} title="Clear search">
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
              <button className="btn btn-sm btn-outline-primary" onClick={fetchQuotations} disabled={loadingQuotations} title="Refresh">
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {loadingQuotations ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading quotations...</p>
            </div>
          ) : savedQuotations.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th width="50">#</th>
                      <th>Quote No</th>
                      <th>Date</th>
                      <th>Company</th>
                      <th>Contact Person</th>
                      <th>Items</th>
                      <th>Grand Total</th>
                      <th>Status</th>
                      <th width="180">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedQuotations.map((quote, index) => (
                      <tr key={quote.id}>
                        <td>{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                        <td>
                          <strong>{quote.quote_number || quote.quoteNo}</strong>
                        </td>
                        <td>
                          {quote.date || quote.date}<br/>
                          <small className="text-muted">{quote.time || quote.time}</small>
                        </td>
                        <td>
                          {quote.company_name || quote.billTo}<br/>
                          <small className="text-muted">{quote.contact_email || quote.contactEmail}</small>
                          {(quote.cc_email || quote.ccEmail) && (
                            <small className="text-muted d-block">
                              <i className="bi bi-person-badge me-1"></i>
                              CC: {quote.cc_email || quote.ccEmail}
                            </small>
                          )}
                        </td>
                        <td>
                          {quote.contact_person || quote.contactPerson}<br/>
                          <small className="text-muted">{quote.contact_mobile || quote.contactMob}</small>
                        </td>
                        <td>{(quote.items || []).length} items</td>
                        <td>
                          <strong className="text-primary">
                            ₹{((quote.grand_total || quote.totals?.grandTotal) || 0).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <span className={`badge ${quote.status === 'draft' ? 'bg-warning' : 
                                           quote.status === 'requote' ? 'bg-info' : 
                                           quote.status === 'completed' ? 'bg-success' : 'bg-secondary'}`}>
                            {quote.status || 'draft'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-info"
                              onClick={() => viewQuotation(quote)}
                              title="View"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            {quote.status === 'requote' && (
                              <button
                                className="btn btn-outline-warning"
                                onClick={() => editQuotation(quote)}
                                title="Edit (Re-quote only)"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                            )}
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => printQuotation(quote)}
                              title="Print"
                            >
                              <i className="bi bi-printer"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <div className="text-muted">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                  </div>
                  <nav aria-label="Page navigation">
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      
                      {getPaginationItems().map((pageNum, index) => (
                        <li key={index} className={`page-item ${pageNum === currentPage ? 'active' : ''} ${pageNum === '...' ? 'disabled' : ''}`}>
                          {pageNum === '...' ? (
                            <span className="page-link">...</span>
                          ) : (
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </button>
                          )}
                        </li>
                      ))}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="bi bi-file-earmark-text display-1 text-muted"></i>
              </div>
              <h5 className="text-muted">No quotations found</h5>
              <p className="text-muted">
                {searchTerm ? 'Try a different search term or ' : ''}
                {statusFilter !== 'all' ? 'Try a different status filter or ' : ''}
                Create your first quotation to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}