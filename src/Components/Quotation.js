import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function QuotationModal() {
  const idRef = useRef(1000);

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
      batch_no: `B-${Date.now().toString().slice(-6)}-${seq}`,
      mrp: 0,
      quantity: 1,
      unit: "pcs",
      discount: 0,
      discount_type: "amount",
      tax_rate: 18.0,
      item_status: "pending" // New: Add status for each item
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

  // State variables
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companyError, setCompanyError] = useState(null);
  
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [billTo, setBillTo] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyGstin, setCompanyGstin] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactMob, setContactMob] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactEmailSame, setContactEmailSame] = useState(false);

  // Items state
  const [items, setItems] = useState(() => [createEmptyItem(1)]);

  // Stock items for autocomplete
  const [stockItems, setStockItems] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockError, setStockError] = useState(null);
  
  // Typeahead states for each item
  const [typeaheadSuggestions, setTypeaheadSuggestions] = useState({});
  const [activeTypeaheadIndex, setActiveTypeaheadIndex] = useState({});
  const [showTypeahead, setShowTypeahead] = useState({});

  // Modal open
  const [modalOpen, setModalOpen] = useState(false);

  // Saved quotations state
  const [savedQuotations, setSavedQuotations] = useState([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [saving, setSaving] = useState(false);

  // Statistics
  const [statistics, setStatistics] = useState(null);

  // DOM ref for quotation content
  const quotationRef = useRef(null);

  // Ref for typeahead input
  const typeaheadRefs = useRef({});

  // API base URL
  const API_BASE_URL = "http://127.0.0.1:5000";

  // Fetch saved quotations from backend on component mount
  useEffect(() => {
    fetchQuotations();
  }, []);

  // Load saved quotations from backend
  const fetchQuotations = async () => {
    setLoadingQuotations(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/quotations`, {
        params: { page: 1, per_page: 50 }
      });
      
      if (response.data.success) {
        const fetchedQuotations = response.data.data;
        
        // Ensure each item has a status field
        const quotationsWithItemStatus = fetchedQuotations.map(quotation => ({
          ...quotation,
          items: quotation.items.map(item => ({
            ...item,
            item_status: item.item_status || "pending" // Default status if not present
          }))
        }));
        
        setSavedQuotations(quotationsWithItemStatus);
        console.log(`✅ Loaded ${quotationsWithItemStatus.length} quotations from backend`);
      }
    } catch (err) {
      console.error("❌ Error loading quotations:", err);
      // Fallback to localStorage if API fails
      const saved = localStorage.getItem("savedQuotations");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSavedQuotations(parsed);
        } catch (e) {
          console.error("Error loading from localStorage:", e);
        }
      }
    } finally {
      setLoadingQuotations(false);
    }
  };

  // Load statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/quotations/statistics`);
        if (response.data.success) {
          setStatistics(response.data.data);
        }
      } catch (err) {
        console.error("Error loading statistics:", err);
      }
    };

    fetchStatistics();
  }, []);

  // Fetch companies with error handling
  useEffect(() => {
    if (!modalOpen) return;
    
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      setCompanyError(null);
      try {
        console.log("📡 Fetching companies from API...");
        
        const endpoints = [
          `${API_BASE_URL}/api/company`,
          "http://localhost:5000/api/company",
          "http://127.0.0.1:5000/company"
        ];
        
        let response = null;
        let lastError = null;
        
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
          
          if (companiesData.length === 1) {
            const company = companiesData[0];
            setSelectedCompanyId(company.id || company.ID || "");
            setSelectedCompany(company);
            setBillTo(company.company_name || company.companyName || "");
            setCompanyAddress(company.company_address || company.companyAddress || "");
            setCompanyGstin(company.gstin || company.gst_no || "");
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
        
        const mockCompanies = [
          {
            id: 1,
            company_name: "ABC Corporation",
            company_address: "123 Main St, Chennai",
            gstin: "33AAAAA0000A1Z5",
            customer_name: "John Doe",
            customer_mobile: "9876543210",
            customer_email: "john@abccorp.com"
          },
          {
            id: 2,
            company_name: "XYZ Industries",
            company_address: "456 Park Ave, Bangalore",
            gstin: "29BBBBB0000B1Z5",
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

  // Fetch stock items when modal opens
  useEffect(() => {
    if (!modalOpen) return;
    
    const fetchStockItems = async () => {
      setLoadingStock(true);
      setStockError(null);
      try {
        console.log("📦 Fetching stock items...");
        
        const endpoints = [
          `${API_BASE_URL}/api/stock/all`,
          "http://localhost:5000/api/stock/all",
          "http://127.0.0.1:5000/stock/all"
        ];
        
        let response = null;
        
        for (const endpoint of endpoints) {
          try {
            response = await axios.get(endpoint, {
              timeout: 5000,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            break;
          } catch (err) {
            console.log(`Failed with endpoint: ${endpoint}`, err.message);
          }
        }
        
        if (!response) {
          throw new Error("Stock API endpoints failed");
        }
        
        console.log("📦 Stock API response:", response.data);
        
        let stockData = [];
        
        if (response.data.success && Array.isArray(response.data.data)) {
          stockData = response.data.data;
        } else if (Array.isArray(response.data)) {
          stockData = response.data;
        }
        
        console.log(`✅ Loaded ${stockData.length} stock items`);
        setStockItems(stockData);
        
        // Provide mock data if API fails
        if (stockData.length === 0) {
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
              "Unit": "pcs",
              "GST": 18.0
            },
            {
              "id": 2,
              "Item Name": "Steel Cutting Disc",
              "Brand": "Makita",
              "Brand Code": "MAK-SCD-102",
              "Brand Description": "4.5 inch cutting disc for steel and metal",
              "HSN": "84659320",
              "Batch Code": "BATCH-2024-002",
              "MRP": 890.00,
              "Buy Price": 620.00,
              "Width": 4.5,
              "Length": 1.2,
              "Unit": "pcs",
              "GST": 18.0
            },
            {
              "id": 3,
              "Item Name": "Diamond Core Bit",
              "Brand": "Hilti",
              "Brand Code": "HIL-DCB-205",
              "Brand Description": "Wet diamond core bit for concrete drilling",
              "HSN": "84641010",
              "Batch Code": "BATCH-2024-003",
              "MRP": 4200.00,
              "Buy Price": 3150.00,
              "Width": 100,
              "Length": 450,
              "Unit": "pcs",
              "GST": 18.0
            }
          ];
          
          setStockItems(mockStock);
          setStockError("Using mock stock data. Real API failed.");
        }
        
      } catch (err) {
        console.error("❌ Fetch stock failed:", err);
        
        // Provide comprehensive mock data
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
            "Unit": "pcs",
            "GST": 18.0
          },
          {
            "id": 2,
            "Item Name": "Steel Cutting Disc",
            "Brand": "Makita",
            "Brand Code": "MAK-SCD-102",
            "Brand Description": "4.5 inch cutting disc for steel and metal",
            "HSN": "84659320",
            "Batch Code": "BATCH-2024-002",
            "MRP": 890.00,
            "Buy Price": 620.00,
            "Width": 4.5,
            "Length": 1.2,
            "Unit": "pcs",
            "GST": 18.0
          }
        ];
        
        setStockItems(mockStock);
        setStockError("Using mock stock data. API Error: " + (err.message || "Connection failed"));
      } finally {
        setLoadingStock(false);
      }
    };
    
    fetchStockItems();
  }, [modalOpen]);

  // When company selected, autofill data
  useEffect(() => {
    if (!selectedCompanyId) return;
    
    const company = companies.find(c => {
      const id = c.id || c.ID || c.Id;
      return id && id.toString() === selectedCompanyId.toString();
    });
    
    if (!company) return;
    
    setSelectedCompany(company);
    const companyName = company.company_name || company.companyName || "";
    const companyAddr = company.company_address || company.companyAddress || "";
    const companyGst = company.gstin || company.gst_no || "";
    const customerName = company.customer_name || company.customerName || "";
    const customerMobile = company.customer_mobile || company.customerMobile || "";
    const customerEmail = company.customer_email || company.customerEmail || "";
    
    setBillTo(companyName);
    setCompanyAddress(companyAddr);
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

  // Reset form when modal opens
  useEffect(() => {
    if (modalOpen) {
      setItems([createEmptyItem(1)]);
      setSelectedCompanyId("");
      setSelectedCompany(null);
      setBillTo("");
      setCompanyAddress("");
      setCompanyGstin("");
      setContactPerson("");
      setContactMob("");
      setContactEmail("");
      setContactEmailSame(false);
      // Reset typeahead states
      setTypeaheadSuggestions({});
      setActiveTypeaheadIndex({});
      setShowTypeahead({});
      // Generate new quote number
      setQuoteNo(`Q-${Date.now().toString().slice(-8)}`);
    }
  }, [modalOpen]);

  // Handle item field changes including status
  function handleItemChange(index, field, value) {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      let newValue = value;
      
      if (["cut_width", "length", "mrp", "quantity", "discount", "tax_rate"].includes(field)) {
        newValue = parseFloat(value) || 0;
      }
      
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: newValue
      };
      
      // If item name changes, update typeahead suggestions
      if (field === "item_name") {
        handleItemNameChange(index, newValue);
      }
      
      return updatedItems;
    });
  }

  // Handle item status change
  function handleItemStatusChange(index, status) {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        item_status: status
      };
      return updatedItems;
    });
  }

  // Handle item name change with typeahead
  function handleItemNameChange(index, value) {
    if (!value || value.trim().length < 1) {
      setTypeaheadSuggestions(prev => ({...prev, [index]: []}));
      setShowTypeahead(prev => ({...prev, [index]: false}));
      return;
    }
    
    const searchTerm = value.toLowerCase();
    const suggestions = stockItems
      .filter(item => 
        item["Item Name"]?.toLowerCase().includes(searchTerm) ||
        item["Brand Code"]?.toLowerCase().includes(searchTerm) ||
        item["Brand Description"]?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 5); // Limit to 5 suggestions
    
    setTypeaheadSuggestions(prev => ({...prev, [index]: suggestions}));
    setActiveTypeaheadIndex(prev => ({...prev, [index]: -1}));
    setShowTypeahead(prev => ({...prev, [index]: true}));
  }

  // Handle item selection from typeahead
  function handleItemSelect(index, stockItem) {
    if (!stockItem) return;
    
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        item_name: stockItem["Item Name"] || "",
        hsn_sac: stockItem["HSN"] || "",
        supplier_part_no: stockItem["Brand Code"] || "",
        description: stockItem["Brand Description"] || "",
        mrp: parseFloat(stockItem["MRP"]) || 0,
        // Use width if available, otherwise keep existing
        cut_width: stockItem["Width"] ? parseFloat(stockItem["Width"]) : updatedItems[index].cut_width,
        // Use length if available, otherwise keep existing
        length: stockItem["Length"] ? parseFloat(stockItem["Length"]) : updatedItems[index].length,
        unit: stockItem["Unit"] || "pcs",
        tax_rate: stockItem["GST"] || 18.0
      };
      return updatedItems;
    });
    
    // Hide typeahead
    setShowTypeahead(prev => ({...prev, [index]: false}));
    setTypeaheadSuggestions(prev => ({...prev, [index]: []}));
  }

  // Handle keyboard navigation in typeahead
  function handleTypeaheadKeyDown(index, e) {
    const suggestions = typeaheadSuggestions[index] || [];
    const activeIndex = activeTypeaheadIndex[index] || -1;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (activeIndex + 1) % suggestions.length;
      setActiveTypeaheadIndex(prev => ({...prev, [index]: nextIndex}));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
      setActiveTypeaheadIndex(prev => ({...prev, [index]: prevIndex}));
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      handleItemSelect(index, suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowTypeahead(prev => ({...prev, [index]: false}));
    }
  }

  // Close typeahead when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      Object.keys(typeaheadRefs.current).forEach(index => {
        const ref = typeaheadRefs.current[index];
        if (ref && !ref.contains(e.target)) {
          setShowTypeahead(prev => ({...prev, [index]: false}));
        }
      });
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add new item
  function addItem() {
    setItems(prevItems => [...prevItems, createEmptyItem(prevItems.length + 1)]);
  }

  // Remove item
  function removeItem(index) {
    if (items.length > 1) {
      setItems(prevItems => prevItems.filter((_, i) => i !== index));
      // Clean up typeahead refs
      delete typeaheadRefs.current[index];
      setTypeaheadSuggestions(prev => {
        const newSuggestions = {...prev};
        delete newSuggestions[index];
        return newSuggestions;
      });
      setShowTypeahead(prev => {
        const newShow = {...prev};
        delete newShow[index];
        return newShow;
      });
    } else {
      setItems([createEmptyItem(1)]);
    }
  }

  // Calculate price per unit (MRP × Cut Width)
  const pricePerUnit = (item) => {
    const mrp = parseFloat(item.mrp) || 0;
    const cut_width = parseFloat(item.cut_width) || 0;
    const price = mrp * cut_width;
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

  // Calculate GST amount (based on tax_rate)
  const gstAmount = (item) => {
    const amount = amountAfterDiscount(item);
    const tax_rate = parseFloat(item.tax_rate) || 18.0;
    const gst = amount * (tax_rate / 100);
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
    
    setSaving(true);
    
    const totals = calculateTotals();
    
    // Prepare items with calculated fields and status
    const preparedItems = items.map(item => ({
      item_name: item.item_name,
      hsn_sac: item.hsn_sac,
      supplier_part_no: item.supplier_part_no,
      description: item.description,
      cut_width: item.cut_width,
      length: item.length,
      batch_no: item.batch_no,
      mrp: item.mrp,
      quantity: item.quantity,
      unit: item.unit,
      discount: item.discount,
      discount_type: item.discount_type,
      tax_rate: item.tax_rate,
      item_status: item.item_status, // Include item status
      price_per_unit: pricePerUnit(item),
      amount_before_discount: amountBeforeDiscount(item),
      discount_amount: discountAmount(item),
      amount_after_discount: amountAfterDiscount(item),
      tax_amount: gstAmount(item),
      item_total: itemTotal(item)
    }));
    
    const quotationData = {
      quote_number: quoteNo,
      date: date,
      time: time,
      issuer_details: issuer,
      company_id: selectedCompanyId,
      company_name: billTo,
      company_address: companyAddress,
      company_gstin: companyGstin,
      contact_person: contactPerson,
      contact_mobile: contactMob,
      contact_email: contactEmail,
      subtotal: totals.subtotal,
      total_discount: totals.totalDiscount,
      total_tax: totals.totalGST,
      grand_total: totals.grandTotal,
      notes: `Please process this quote as per the terms mentioned.\nAll prices are in INR and inclusive of GST.\nDelivery within 7-10 business days.`,
      status: "draft",
      items: preparedItems
    };
    
    console.log("💾 Saving quotation to backend:", quotationData);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/quotations`, quotationData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        alert(`✅ Quotation saved successfully!\n\nQuote: ${quoteNo}\nCompany: ${billTo}\nGrand Total: ₹${totals.grandTotal}`);
        
        // Refresh quotations list
        await fetchQuotations();
        
        setModalOpen(false);
      } else {
        throw new Error(response.data.message || "Failed to save quotation");
      }
      
    } catch (err) {
      console.error("Save quotation failed:", err);
      
      // Fallback to localStorage if API fails
      const quotationData = {
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
        items: preparedItems,
        totals,
        createdAt: new Date().toISOString(),
        status: "draft"
      };
      
      const updatedQuotations = [quotationData, ...savedQuotations];
      setSavedQuotations(updatedQuotations);
      localStorage.setItem("savedQuotations", JSON.stringify(updatedQuotations));
      
      alert(`✅ Quotation saved to local storage!\n\nQuote: ${quoteNo}\nCompany: ${billTo}\nGrand Total: ₹${totals.grandTotal}\n\nNote: Backend API failed, using local storage.`);
      
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  // Delete saved quotation
  async function deleteQuotation(quoteId) {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/quotations/${quoteId}`);
        
        if (response.data.success) {
          // Refresh quotations list
          await fetchQuotations();
        }
      } catch (err) {
        console.error("Delete failed, using localStorage:", err);
        const updatedQuotations = savedQuotations.filter(quote => quote.id !== quoteId);
        setSavedQuotations(updatedQuotations);
        localStorage.setItem("savedQuotations", JSON.stringify(updatedQuotations));
      }
    }
  }

  // Update item status in a quotation
  async function updateItemStatus(quotationId, itemId, newStatus) {
    try {
      // Get the quotation
      const quotation = savedQuotations.find(q => q.id === quotationId);
      if (!quotation) return;

      // Update the item status locally
      const updatedItems = quotation.items.map(item => 
        item.id === itemId ? { ...item, item_status: newStatus } : item
      );

      // Update the quotation
      const updatedQuotation = { ...quotation, items: updatedItems };
      
      // Send to backend
      const response = await axios.put(`${API_BASE_URL}/api/quotations/${quotationId}`, updatedQuotation);
      
      if (response.data.success) {
        // Refresh quotations list
        await fetchQuotations();
        alert(`Item status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error("Error updating item status:", err);
      alert("Could not update item status. Please try again.");
    }
  }

  // Print quotation
  function printQuotation(quotation) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation ${quotation.quote_number || quotation.quoteNo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .company-info { margin-bottom: 30px; }
          .totals { margin-top: 30px; border-top: 2px solid #333; padding-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>QUOTATION</h1>
          <h3>${quotation.quote_number || quotation.quoteNo}</h3>
          <p>Date: ${quotation.date} | Time: ${quotation.time}</p>
        </div>
        
        <div class="company-info">
          <h3>Issuer:</h3>
          <p>${quotation.issuer_details?.name || 'Lakhotia'}</p>
          <p>${quotation.issuer_details?.address || '64/3A Sidco Industrial Estate, Ambatur, Chennai'}</p>
          
          <h3>Bill To:</h3>
          <p>${quotation.company_name || quotation.billTo}</p>
          <p>${quotation.company_address || ''}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${(quotation.items || []).map(item => `
              <tr>
                <td>${item.item_name}</td>
                <td>${item.quantity} ${item.unit}</td>
                <td>₹${item.price_per_unit || 0}</td>
                <td>₹${item.item_total || 0}</td>
                <td>${item.item_status || 'pending'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <h3>Summary</h3>
          <p>Subtotal: ₹${quotation.subtotal || quotation.totals?.subtotal || 0}</p>
          <p>Tax: ₹${quotation.total_tax || quotation.totals?.totalGST || 0}</p>
          <p><strong>Grand Total: ₹${quotation.grand_total || quotation.totals?.grandTotal || 0}</strong></p>
        </div>
        
        <div class="no-print">
          <button onclick="window.print()">Print</button>
          <button onclick="window.close()">Close</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Get status badge style for items
  const getItemStatusBadgeStyle = (status) => {
    switch(status.toLowerCase()) {
      case 'pending': return { background: "#f39c12", color: "white" };
      case 'approved': return { background: "#2ecc71", color: "white" };
      case 'rejected': return { background: "#e74c3c", color: "white" };
      case 'dispatched': return { background: "#3498db", color: "white" };
      case 'delivered': return { background: "#9b59b6", color: "white" };
      default: return { background: "#95a5a6", color: "white" };
    }
  };

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
    savedQuotationsTable: {
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
    typeaheadContainer: {
      position: "relative",
      width: "100%"
    },
    typeaheadList: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      backgroundColor: "white",
      border: "1px solid #ddd",
      borderTop: "none",
      borderRadius: "0 0 4px 4px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      zIndex: 1000,
      maxHeight: "200px",
      overflowY: "auto",
      marginTop: "-6px"
    },
    typeaheadItem: {
      padding: "8px 12px",
      cursor: "pointer",
      borderBottom: "1px solid #f0f0f0",
      fontSize: "13px",
      transition: "background-color 0.2s"
    },
    typeaheadItemHover: {
      backgroundColor: "#f0f7ff"
    },
    typeaheadItemActive: {
      backgroundColor: "#e3f2fd",
      fontWeight: "bold"
    },
    typeaheadItemName: {
      fontWeight: "bold",
      color: "#333",
      marginBottom: "2px"
    },
    typeaheadItemDetails: {
      fontSize: "11px",
      color: "#666",
      display: "flex",
      justifyContent: "space-between"
    },
    statsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
      marginBottom: "20px"
    },
    statCard: {
      background: "white",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "15px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    },
    statValue: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: "5px"
    },
    statLabel: {
      fontSize: "14px",
      color: "#7f8c8d",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    itemStatusSelect: {
      padding: "2px 6px",
      fontSize: "12px",
      borderRadius: "3px",
      border: "1px solid #ddd",
      cursor: "pointer",
      width: "100%"
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
          <span>📄</span> New Quotation
        </button>
        
        <button
          style={styles.btn}
          onClick={fetchQuotations}
          title="Refresh quotations"
        >
          <span>🔄</span> Refresh
        </button>
        
        {statistics && (
          <div style={{ marginLeft: "auto", fontSize: 14, color: "#666", display: "flex", gap: "15px" }}>
            <span>📋 Total: {statistics.total}</span>
            <span>📤 Sent: {statistics.status_counts?.sent || 0}</span>
            <span>✅ Accepted: {statistics.status_counts?.accepted || 0}</span>
            <span>💰 Paid: {statistics.status_counts?.paid || 0}</span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.total || 0}</div>
            <div style={styles.statLabel}>Total Quotations</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.status_counts?.draft || 0}</div>
            <div style={styles.statLabel}>Draft</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.status_counts?.sent || 0}</div>
            <div style={styles.statLabel}>Sent</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.status_counts?.accepted || 0}</div>
            <div style={styles.statLabel}>Accepted</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.status_counts?.paid || 0}</div>
            <div style={styles.statLabel}>Paid</div>
          </div>
        </div>
      )}

      {!modalOpen && (
        <div style={styles.note}>
          Click <strong>New Quotation</strong> to create a new quotation. Saved quotations will appear below.
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, color: "#2c3e50" }}>Create Quotation</h2>
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

            <div style={styles.modalBody} ref={quotationRef}>
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

                    <label style={styles.label}>Company Address</label>
                    <textarea 
                      style={{ ...styles.textarea, height: 60 }} 
                      value={companyAddress} 
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />

                    <label style={styles.label}>Company GSTIN</label>
                    <input 
                      style={styles.input} 
                      value={companyGstin} 
                      onChange={(e) => setCompanyGstin(e.target.value)}
                    />

                    <label style={styles.label}>Notes</label>
                    <textarea 
                      style={{ ...styles.textarea, height: 60 }} 
                      defaultValue={`Please process this quote as per the terms mentioned.\nAll prices are in INR and inclusive of GST.\nDelivery within 7-10 business days.`}
                    />
                  </div>
                </div>
              </div>

              {/* Items Table Section */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Items & Pricing</div>
                
                {loadingStock && (
                  <div style={styles.loading}>
                    ⏳ Loading stock items from database...
                  </div>
                )}
                
                {stockError && (
                  <div style={styles.error}>
                    ⚠️ {stockError}
                  </div>
                )}
                
                {!loadingStock && stockItems.length > 0 && (
                  <div style={styles.success}>
                    ✅ {stockItems.length} stock items loaded for autocomplete
                  </div>
                )}
                
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
                        <th style={styles.thtd}>Status</th>
                        <th style={styles.thtd}>Price/Unit</th>
                        <th style={styles.thtd}>Discount</th>
                        <th style={styles.thtd}>Amount</th>
                        <th style={styles.thtd}>GST(%)</th>
                        <th style={styles.thtd}>Tax Amt</th>
                        <th style={styles.thtd}>Total</th>
                        <th style={{...styles.thtd, width: "70px"}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td style={styles.thtd}>{index + 1}</td>
                          
                          <td style={{...styles.thtd, position: "relative"}}>
                            <div 
                              ref={el => typeaheadRefs.current[index] = el}
                              style={styles.typeaheadContainer}
                            >
                              <input 
                                style={styles.input} 
                                value={item.item_name} 
                                onChange={(e) => handleItemChange(index, "item_name", e.target.value)}
                                onKeyDown={(e) => handleTypeaheadKeyDown(index, e)}
                                onFocus={() => {
                                  if (item.item_name && stockItems.length > 0) {
                                    handleItemNameChange(index, item.item_name);
                                  }
                                }}
                                placeholder="Start typing for suggestions..."
                              />
                              
                              {showTypeahead[index] && (typeaheadSuggestions[index] || []).length > 0 && (
                                <div style={styles.typeaheadList}>
                                  {(typeaheadSuggestions[index] || []).map((suggestion, sIndex) => (
                                    <div
                                      key={`${suggestion.id || sIndex}-${index}`}
                                      style={{
                                        ...styles.typeaheadItem,
                                        ...(sIndex === (activeTypeaheadIndex[index] || -1) ? styles.typeaheadItemActive : {}),
                                        ...styles.typeaheadItemHover
                                      }}
                                      onClick={() => handleItemSelect(index, suggestion)}
                                      onMouseEnter={() => setActiveTypeaheadIndex(prev => ({...prev, [index]: sIndex}))}
                                    >
                                      <div style={styles.typeaheadItemName}>
                                        {suggestion["Item Name"]}
                                      </div>
                                      <div style={styles.typeaheadItemDetails}>
                                        <span>Part: {suggestion["Brand Code"]}</span>
                                        <span>MRP: ₹{parseFloat(suggestion["MRP"] || 0).toFixed(2)}</span>
                                      </div>
                                      <div style={{...styles.typeaheadItemDetails, fontSize: "10px"}}>
                                        <span>{suggestion["Brand Description"]?.substring(0, 50)}...</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              style={styles.input} 
                              value={item.hsn_sac} 
                              onChange={(e) => handleItemChange(index, "hsn_sac", e.target.value)}
                              placeholder="HSN/SAC"
                            />
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              style={styles.input} 
                              value={item.supplier_part_no} 
                              onChange={(e) => handleItemChange(index, "supplier_part_no", e.target.value)}
                              placeholder="Supplier Part No"
                            />
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              style={styles.input} 
                              value={item.description} 
                              onChange={(e) => handleItemChange(index, "description", e.target.value)}
                              placeholder="Description"
                            />
                          </td>

                          <td style={styles.thtd}>
                            <input 
                              type="number" 
                              min="0.1"
                              step="0.1"
                              style={styles.input} 
                              value={item.cut_width} 
                              onChange={(e) => handleItemChange(index, "cut_width", e.target.value)}
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

                          <td style={styles.thtd}>
                            <select
                              style={styles.itemStatusSelect}
                              value={item.item_status}
                              onChange={(e) => handleItemStatusChange(index, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="dispatched">Dispatched</option>
                              <option value="delivered">Delivered</option>
                            </select>
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

                          <td style={styles.thtd}>
                            <input 
                              type="number" 
                              min="0"
                              step="0.1"
                              style={styles.input} 
                              value={item.tax_rate} 
                              onChange={(e) => handleItemChange(index, "tax_rate", e.target.value)}
                              placeholder="Tax %"
                            />
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
                      <span>Total Tax:</span>
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
                  onClick={saveQuotation}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Quotation"}
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

      {/* Saved Quotations Table */}
      <div style={{ marginTop: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={styles.sectionTitle}>Saved Quotations</h3>
          <button
            style={styles.btn}
            onClick={fetchQuotations}
            disabled={loadingQuotations}
          >
            {loadingQuotations ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>
        
        {loadingQuotations ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#3498db" }}>
            Loading quotations...
          </div>
        ) : savedQuotations.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.savedQuotationsTable}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Quote No</th>
                  <th style={styles.tableHeader}>Date</th>
                  <th style={styles.tableHeader}>Company</th>
                  <th style={styles.tableHeader}>Contact Person</th>
                  <th style={styles.tableHeader}>Items</th>
                  <th style={styles.tableHeader}>Item Status</th>
                  <th style={styles.tableHeader}>Grand Total</th>
                  <th style={styles.tableHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedQuotations.map((quote) => {
                  const items = quote.items || [];
                  const pendingItems = items.filter(item => item.item_status === 'pending').length;
                  const approvedItems = items.filter(item => item.item_status === 'approved').length;
                  const deliveredItems = items.filter(item => item.item_status === 'delivered').length;
                  
                  return (
                    <tr key={quote.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>
                        <strong>{quote.quote_number || quote.quoteNo}</strong>
                      </td>
                      <td style={styles.tableCell}>
                        {quote.date || quote.date}<br/>
                        <span style={styles.small}>{quote.time || quote.time}</span>
                      </td>
                      <td style={styles.tableCell}>
                        {quote.company_name || quote.billTo}<br/>
                        <span style={styles.small}>{quote.contact_email || quote.contactEmail}</span>
                      </td>
                      <td style={styles.tableCell}>
                        {quote.contact_person || quote.contactPerson}<br/>
                        <span style={styles.small}>{quote.contact_mobile || quote.contactMob}</span>
                      </td>
                      <td style={styles.tableCell}>
                        {items.length} items
                      </td>
                      <td style={styles.tableCell}>
                        <div style={{ fontSize: "12px" }}>
                          <div>✅ Approved: {approvedItems}</div>
                          <div>⏳ Pending: {pendingItems}</div>
                          <div>🚚 Delivered: {deliveredItems}</div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <strong style={{ color: "#2980b9" }}>
                          ₹{((quote.grand_total || quote.totals?.grandTotal) || 0).toFixed(2)}
                        </strong>
                      </td>
                      <td style={styles.tableCell}>
                        <button 
                          style={styles.actionBtn}
                          onClick={() => {
                            alert(`Quotation Details:\n\n` +
                                  `Quote No: ${quote.quote_number || quote.quoteNo}\n` +
                                  `Date: ${quote.date} Time: ${quote.time}\n` +
                                  `Company: ${quote.company_name || quote.billTo}\n` +
                                  `Address: ${quote.company_address || ''}\n` +
                                  `GSTIN: ${quote.company_gstin || ''}\n` +
                                  `Contact: ${quote.contact_person || quote.contactPerson} (${quote.contact_mobile || quote.contactMob})\n` +
                                  `Email: ${quote.contact_email || quote.contactEmail}\n` +
                                  `Items: ${items.length}\n` +
                                  `Subtotal: ₹${quote.subtotal || quote.totals?.subtotal || 0}\n` +
                                  `Discount: ₹${quote.total_discount || quote.totals?.totalDiscount || 0}\n` +
                                  `Tax: ₹${quote.total_tax || quote.totals?.totalGST || 0}\n` +
                                  `Grand Total: ₹${quote.grand_total || quote.totals?.grandTotal || 0}\n` +
                                  `Created: ${new Date(quote.created_at || quote.createdAt).toLocaleDateString()}`);
                          }}
                          title="View Details"
                        >
                          👁️ View
                        </button>
                        <button 
                          style={{ ...styles.actionBtn, ...styles.primaryBtn }}
                          onClick={() => printQuotation(quote)}
                          title="Print"
                        >
                          🖨️ Print
                        </button>
                        <button 
                          style={{ ...styles.actionBtn, ...styles.dangerBtn }}
                          onClick={() => deleteQuotation(quote.id)}
                          title="Delete"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ marginBottom: 8 }}>No saved quotations yet</div>
            <div style={styles.small}>Create and save your first quotation to see it here</div>
          </div>
        )}
      </div>
    </div>
  );
}