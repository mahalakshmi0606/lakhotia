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
  // Fixed icons - using available ones
  FaChartPie,
  FaSitemap,
  FaFileExport,
  FaFileImport,
  FaShieldAlt,
  FaUserClock,
  FaMoneyBillWave,
  FaTruckLoading,
  FaBox,
  FaTags,
  FaCheckCircle,
  FaTimesCircle,
  FaFileDownload,
  FaRegFileAlt,
  FaRegChartBar,
  FaRegFile,
  FaFileExcel,
  FaRegClipboard,
  FaBriefcase,
  FaIndustry as FaIndustryIcon,
  FaChartArea,
  FaRegListAlt,
  FaUserMd,
  FaHardHat,
  FaCoins,
  FaStore,
  FaEdit,
  FaThumbsUp,
  FaThumbsDown,
  FaSearchDollar,
  FaBusinessTime,
  FaFileInvoiceDollar,
  FaRegCalendarCheck,
  FaReceipt,
  FaFileSignature,
  FaArchive
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

// ⭐ Master Module List - Grouped by Category (6-7 main categories)
export const menuItems = [
  // ========== DASHBOARD ==========
  {
    category: "Dashboard",
    items: [
      { name: "Dashboard", icon: <FaHome />, path: "/dashboard" },
      { name: "Customer Dashboard", icon: <FaChartPie />, path: "/company-dashboard" },
      { name: "Admin Dashboard", icon: <FaUserShield />, path: "/dashboardsetter" },
    ]
  },

  // ========== COMPANY MASTER ==========
  {
    category: "Partner Masters",
    items: [
      { name: "Partners", icon: <FaBuilding />, path: "/companies" },
    ]
  },

  // ========== USER & SYSTEM ==========
  {
    category: "User & System",
    items: [
      { name: "Departments", icon: <FaSitemap />, path: "/departments" },
      { name: "Designations", icon: <FaUserTag />, path: "/designations" },
      { name: "Employees", icon: <FaUserTie />, path: "/employees" },
      { name: "User Types", icon: <FaUserCog />, path: "/user-types" },
      { name: "Settings", icon: <FaCogs />, path: "/Settings" },
      { name: "AccessControl", icon: <FaShieldAlt />, path: "/accesscontrol" }
    ]
  },

  // ========== ATTENDANCE & REPORTS ==========
  {
    category: "Attendance & Reports",
    items: [
      { name: "Attendance", icon: <FaUserClock />, path: "/attendance" },
      { name: "Admin Attendance", icon: <FaUserCheck />, path: "/AdminAttendance" },
      { name: "Attendance Report", icon: <FaChartBar />, path: "/AttendanceReport" },
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
      { name: "Task Status", icon: <FaCheckCircle />, path: "/TaskStatus" }
    ]
  },

  // ========== LABOUR MANAGEMENT ==========
  {
    category: "Labour Management",
    items: [
      { name: "ESI Labours", icon: <FaUserMd />, path: "/EsiReport" },
      { name: "Casual Labours", icon: <FaHardHat />, path: "/CasualLeave" },
      { name: "NoESiPf Labours", icon: <FaBan />, path: "/noesipf" },
      { name: "Loan", icon: <FaCoins />, path: "/Loan" }
    ]
  },

  // ========== STOCK & SALES ==========
  {
    category: "Stock & Sales",
    items: [
      { name: "Stock Upload", icon: <FaUpload />, path: "/stockupload" },
      { name: "GRN", icon: <FaTruckLoading />, path: "/grn" },
      { name: "Stock sold", icon: <FaShoppingCart />, path: "/stocksold" },
      { name: "Mrp Update", icon: <FaTags />, path: "/mrpchange" },
      { name: "Sales Order", icon: <FaReceipt />, path: "/salesorder" },
      { name: "Lost Order", icon: <FaTimesCircle />, path: "/rejected" },
      { name: "Purchase Order", icon: <FaFileSignature />, path: "/PurchaseOrder" },
      { name: "Purchase Order approval", icon: <FaThumbsUp />, path: "/PurchaseOrderapproval" }
    ]
  },

  // ========== QUOTATION & PROJECTS ==========
  {
    category: "Quotation & Projects",
    items: [
      { name: "Enquiry", icon: <FaSearchDollar />, path: "/enquiry" },
      { name: "Quotation", icon: <FaFileInvoiceDollar />, path: "/quotation" },
      { name: "Quotation Approval", icon: <FaThumbsUp />, path: "/quotationreport" },
      { name: "Industrial Segmentation", icon: <FaIndustryIcon />, path: "/IndustrialSegmentation" },
      { name: "Enquiry Report", icon: <FaRegFileAlt />, path: "/enquiryreport" },
      { name: "Employee Report", icon: <FaFileExport />, path: "/EmployeeReport" }
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
    if (userTypeName && userTypeName !== "common" && userTypeName !== "unknown") {
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
    case "Dashboard": return <FaChartArea />;
    case "Company Master": return <FaBriefcase />;
    case "User & System": return <FaUsers />;
    case "Attendance & Reports": return <FaRegCalendarCheck />;
    case "Task Management": return <FaRegClipboard />;
    case "Labour Management": return <FaHardHat />;
    case "Stock & Sales": return <FaStore />;
    case "Quotation & Projects": return <FaBusinessTime />;
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