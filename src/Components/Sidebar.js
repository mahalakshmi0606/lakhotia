// Sidebar.js
import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaIndustry,
  FaLayerGroup,
  FaUserTag,
  FaUserTie,
  FaUserCog,
  FaCogs,
  FaKey,
  FaClock,
  FaUserCheck,
  FaChartLine,
  FaRoute,
  FaClipboardCheck,
  FaTasks,
  FaClipboardList,
  FaUpload,
  FaFileMedical,
  FaHandHoldingUsd,
  FaCalendarAlt,
  FaBan,
  FaWarehouse,
  FaShoppingCart,
  FaProjectDiagram,
  FaFileInvoice,
  FaExchangeAlt,
  FaBuilding,
  FaUsers,
  FaUserShield,
  FaChartBar,
  FaListAlt,
  FaBoxOpen,
  FaFileContract,
  FaDollarSign,
  FaChevronDown,
  FaChevronRight,
  FaFolder,
  FaUserFriends,
  FaClipboard,
  FaTruck,
  FaFileAlt,
  FaBan as FaBanIcon,
  FaWarehouse as FaWarehouseIcon
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

// ⭐ Master Module List - Grouped by Category (6-7 main categories)
export const menuItems = [
  // ========== DASHBOARD ==========
  {
    category: "Dashboard",
    items: [
      { name: "Dashboard", icon: <FaHome />, path: "/dashboard" },
      { name: "Customer Dashboard", path: "/company-dashboard" },
      { name: "Admin Dashboard", path: "/dashboardsetter" },
      
    ]
  },

  // ========== COMPANY MASTER ==========
  {
    category: "Company Master",
    items: [
      { name: "Companies", icon: <FaIndustry />, path: "/companies" },
    ]
  },

  // ========== USER & SYSTEM ==========
  {
    category: "User & System",
    items: [
      { name: "Departments", icon: <FaLayerGroup />, path: "/departments" },
      { name: "Designations", icon: <FaUserTag />, path: "/designations" },
      { name: "Employees", icon: <FaUserTie />, path: "/employees" },
      { name: "User Types", icon: <FaUserCog />, path: "/user-types" },
      { name: "Settings", icon: <FaCogs />, path: "/Settings" },
      { name: "AccessControl", icon: <FaKey />, path: "/accesscontrol" }
    ]
  },

  // ========== ATTENDANCE & REPORTS ==========
  {
    category: "Attendance & Reports",
    items: [
      { name: "Attendance", icon: <FaClock />, path: "/attendance" },
      { name: "Admin Attendance", icon: <FaUserCheck />, path: "/AdminAttendance" },
      { name: "Attendance Report", icon: <FaChartLine />, path: "/AttendanceReport" },
      { name: "Visit Report", icon: <FaRoute />, path: "/visitreport" },
      { name: "Admin Visit Report", icon: <FaClipboardCheck />, path: "/AdminVisitReport" }
    ]
  },

  // ========== TASK MANAGEMENT ==========
  {
    category: "Task Management",
    items: [
      { name: "Task", icon: <FaTasks />, path: "/Task" },
      { name: "Admin Task", icon: <FaClipboardList />, path: "/AdminTask" },
      { name: "Task Status", icon: <FaClipboardCheck />, path: "/TaskStatus" }
    ]
  },

  // ========== LABOUR MANAGEMENT ==========
  {
    category: "Labour Management",
    items: [
      { name: "ESI Labours", icon: <FaFileMedical />, path: "/EsiReport" },
      { name: "Casual Labours", icon: <FaCalendarAlt />, path: "/CasualLeave" },
      { name: "NoESiPf Labours", icon: <FaBan />, path: "/noesipf" },
      { name: "Loan", icon: <FaHandHoldingUsd />, path: "/Loan" }
    ]
  },

  // ========== STOCK & SALES ==========
  {
    category: "Stock & Sales",
    items: [
      { name: "Stock Upload", icon: <FaUpload />, path: "/stockupload" },
      { name: "GRN", icon: <FaWarehouse />, path: "/grn" },
      { name: "Stock sold", icon: <FaShoppingCart />, path: "/stocksold" },
      { name: "Mrp Update", icon: <FaExchangeAlt />, path: "/mrpchange" },
      { name: "Sales Order", icon: <FaUpload />, path: "/salesorder" },
      { name: "Lost Order", icon: <FaUpload />, path: "/rejected" },
      { name: "Purchase Order", icon: <FaUpload />, path: "/PurchaseOrder" },///PurchaseOrderapproval
      { name: "Purchase Order approval", icon: <FaUpload />, path: "/PurchaseOrderapproval" }

    ]
  },

  // ========== QUOTATION & PROJECTS ==========
  {
    category: "Quotation & Projects",
    items: [
      { name: "Enquiry", icon: <FaFileInvoice />, path: "/enquiry" },
      { name: "Quotation", icon: <FaFileInvoice />, path: "/quotation" },
      { name: "Quotation Approval", icon: <FaClipboardList />, path: "/quotationreport" },
      { name: "Industrial Segmentation", icon: <FaProjectDiagram />, path: "/IndustrialSegmentation" },
      { name: "Enquiry Report", icon: <FaFileInvoice />, path: "/enquiryreport" },
      { name: "Quotation Report", icon: <FaFileInvoice />, path: "/QuotationWholeReport" }

    ]
  }
];

const USER_TYPE_PERMISSION_API = "http://localhost:5000/api/user-type";

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [allowedModules, setAllowedModules] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // ⭐ Read from localStorage
  const userTypeName = (localStorage.getItem("usertype") || "").toLowerCase();
  const userTypeId = Number(localStorage.getItem("user_type_id"));

  useEffect(() => {
    // Only fetch permissions if userTypeName exists and is not "undefined"
    if (userTypeName && userTypeName !== "undefined" && userTypeName !== "unknown") {
      fetchPermissions(userTypeName);
    }
    // Expand all categories by default
    const initialExpanded = {};
    menuItems.forEach((category) => {
      initialExpanded[category.category] = true;
    });
    setExpandedCategories(initialExpanded);
  }, [userTypeName]);

  // ⭐ Fetch allowed modules based on user type
  const fetchPermissions = async (typeName) => {
    try {
      const res = await fetch(`${USER_TYPE_PERMISSION_API}/${typeName}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.permissions)) {
        setAllowedModules(
          data.permissions.map((m) => m.toLowerCase().trim())
        );
      }
    } catch (err) {
      console.error("Permission fetch error:", err);
    }
  };

  // ⭐ Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // ⭐ Filter menu items based on permissions
  const getFilteredMenu = () => {
    // Show all modules if:
    // 1. User type is admin (userTypeId === 1)
    // 2. User type is undefined, "undefined", or empty
    // 3. User type is "unknown" (from original logic)
    const showAllModules = 
      userTypeId === 1 || 
      !userTypeName || 
      userTypeName === "common" || 
      userTypeName === "unknown";

    if (showAllModules) {
      return menuItems.map(category => ({
        ...category,
        items: category.items
      }));
    }

    // Filter based on permissions
    return menuItems.map(category => ({
      ...category,
      items: category.items.filter(item =>
        allowedModules.includes(item.name.toLowerCase())
      )
    })).filter(category => category.items.length > 0);
  };

  const filteredMenu = getFilteredMenu();

  return (
    <div
      style={{
        ...styles.sidebar,
        left: isOpen ? "0" : "-220px",
      }}
    >
      {/* Header UserType Display */}
      <div style={styles.header}>
        <FaUserShield style={{ marginRight: "8px" }} />
        <span style={{ textTransform: "capitalize" }}>
          {userTypeName || "All Access"}
        </span>
      </div>

      <div style={styles.menuContainer}>
        {filteredMenu.map((category) => {
          const isExpanded = expandedCategories[category.category] !== false;
          
          return (
            <div key={category.category} style={styles.categoryContainer}>
              {/* Category Header */}
              <div 
                style={styles.categoryHeader}
                onClick={() => toggleCategory(category.category)}
              >
                <span style={styles.categoryIcon}>
                  {getCategoryIcon(category.category)}
                </span>
                <span style={styles.categoryText}>
                  {category.category}
                </span>
                <span style={styles.chevron}>
                  {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                </span>
              </div>

              {/* Category Items */}
              {isExpanded && (
                <ul style={styles.menu}>
                  {category.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <li
                        key={item.name}
                        style={{
                          ...styles.menuItem,
                          backgroundColor: isActive ? "#f5c518" : "transparent",
                          color: isActive ? "#000" : "#333",
                          fontWeight: isActive ? "600" : "500",
                          borderLeft: isActive ? "3px solid #f5c518" : "3px solid transparent",
                        }}
                      >
                        <Link to={item.path} style={styles.link}>
                          <span style={styles.icon}>{item.icon}</span>
                          <span style={styles.menuText}>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ⭐ Helper function to get category icons
const getCategoryIcon = (category) => {
  switch(category) {
    case "Dashboard": return <FaHome />;
    case "Company Master": return <FaBuilding />;
    case "User & System": return <FaUserFriends />;
    case "Attendance & Reports": return <FaChartBar />;
    case "Task Management": return <FaClipboard />;
    case "Labour Management": return <FaUsers />;
    case "Stock & Sales": return <FaTruck />;
    case "Quotation & Projects": return <FaFileAlt />;
    default: return <FaFolder />;
  }
};

// ⭐ Styling
const styles = {
  sidebar: {
    backgroundColor: "#fff8dc",
    height: "calc(100vh - 45px)",
    position: "fixed",
    top: "45px",
    left: "0",
    width: "220px",
    boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
    fontFamily: "Poppins, sans-serif",
    transition: "left 0.3s ease-in-out",
    overflowY: "auto",
    zIndex: 9,
    scrollbarWidth: "thin",
  },
  header: {
    backgroundColor: "#f5c518",
    color: "#000",
    fontWeight: "600",
    padding: "12px",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderBottom: "1px solid #e0e0e0",
    fontSize: "14px",
    textTransform: "capitalize",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  menuContainer: {
    padding: "10px 0",
  },
  categoryContainer: {
    marginBottom: "5px",
  },
  categoryHeader: {
    display: "flex",
    alignItems: "center",
    padding: "10px 15px",
    backgroundColor: "#ffeaa7",
    color: "#2d3436",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    userSelect: "none",
    transition: "background-color 0.2s",
    borderBottom: "1px solid #fdcb6e",
  },
  categoryIcon: {
    marginRight: "10px",
    fontSize: "12px",
  },
  categoryText: {
    flexGrow: 1,
    fontSize: "13px",
  },
  chevron: {
    fontSize: "10px",
    opacity: 0.7,
  },
  menu: {
    listStyle: "none",
    padding: "5px 0",
    margin: 0,
    backgroundColor: "#fffef5",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    padding: "8px 15px 8px 30px",
    margin: "2px 0",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: "13px",
    borderLeft: "3px solid transparent",
  },
  icon: {
    marginRight: "10px",
    fontSize: "14px",
    minWidth: "20px",
    opacity: 0.8,
  },
  menuText: {
    flexGrow: 1,
    lineHeight: "1.2",
    fontSize: "13px",
  },
  link: {
    textDecoration: "none",
    color: "inherit",
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
};

export default Sidebar;