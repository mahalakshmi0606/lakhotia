// Sidebar.js
import React, { useEffect, useState } from "react";
import {
  FaTachometerAlt,
  FaUsers,
  FaBuilding,
  FaSitemap,
  FaIdBadge,
  FaUserShield,
  FaFileAlt,
  FaCalendarCheck,
  FaClipboardList,
  FaTasks,
  FaClipboardCheck,
  FaUserClock,
  FaListAlt,
  FaClipboard,
  FaRegFileAlt,
} from "react-icons/fa";

import { Link, useLocation } from "react-router-dom";

// ⭐ Master Module List
export const menuItems = [
  { name: "Dashboard", icon: <FaTachometerAlt />, path: "/dashboard" },
  { name: "Companies", icon: <FaBuilding />, path: "/companies" },
  { name: "Departments", icon: <FaSitemap />, path: "/departments" },
  { name: "Designations", icon: <FaIdBadge />, path: "/designations" },
  { name: "Employees", icon: <FaUsers />, path: "/employees" },


  { name: "User Types", icon: <FaUserShield />, path: "/user-types" },
  { name: "Settings", icon: <FaRegFileAlt />, path: "/Settings" },
  { name: "AccessControl", icon: <FaRegFileAlt />, path: "/accesscontrol" },

  { name: "Attendance", icon: <FaCalendarCheck />, path: "/attendance" },
  { name: "Admin Attendance", icon: <FaUserClock />, path: "/AdminAttendance" },
  { name: "Attendance Report", icon: <FaFileAlt />, path: "/AttendanceReport" },

  { name: "Visit Report", icon: <FaClipboardList />, path: "/visitreport" },
  { name: "Admin Visit Report", icon: <FaClipboardCheck />, path: "/AdminVisitReport" },

  { name: "Task", icon: <FaTasks />, path: "/Task" },
  { name: "Admin Task", icon: <FaClipboardList />, path: "/AdminTask" },
  { name: "Task Status", icon: <FaRegFileAlt />, path: "/TaskStatus" },
  { name: "Stock Upload", icon: <FaUserShield />, path: "/stockupload" },
  { name: "ESI Report", icon: <FaUserShield />, path: "/EsiReport" },
  { name: "Loan", icon: <FaListAlt />, path: "/Loan" },
  { name: "Casual Leave", icon: <FaClipboard />, path: "/CasualLeave" },
  { name: "NoESiPf", icon: <FaUserShield />, path: "/noesipf" },
  { name: "GRN", icon: <FaUserShield />, path: "/grn" },
  { name: "stocksold", icon: <FaUserShield />, path: "/stocksold" },
  { name: "Industrial Segmentation", icon: <FaUserShield />, path: "/IndustrialSegmentation" },
  { name: "Quotation", icon: <FaUserShield />, path: "/quotation" },
  {name:"mrpchange",icon:<FaUserShield />,path:"/mrpchange"}
];

const USER_TYPE_PERMISSION_API = "http://localhost:5000/api/user-type";

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [allowedModules, setAllowedModules] = useState([]);

  // ⭐ Read from localStorage
  const userTypeName = (localStorage.getItem("usertype") || "Unknown").toLowerCase();
  const userTypeId = Number(localStorage.getItem("user_type_id"));

  useEffect(() => {
    if (userTypeName && userTypeName !== "unknown") {
      fetchPermissions(userTypeName);
    }
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

  // ⭐ Admin (ID 1) gets all access
  const filteredMenu =
    userTypeId === 1
      ? menuItems
      : menuItems.filter((item) =>
          allowedModules.includes(item.name.toLowerCase())
        );

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
          {userTypeName}
        </span>
      </div>

      <ul style={styles.menu}>
        {filteredMenu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li
              key={item.name}
              style={{
                ...styles.menuItem,
                backgroundColor: isActive ? "#f5c518" : "transparent",
                color: isActive ? "#000" : "#333",
                fontWeight: isActive ? "600" : "500",
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
    </div>
  );
};

// ⭐ Styling
const styles = {
  sidebar: {
    backgroundColor: "#fff8dc",
    height: "calc(100vh - 45px)",
    padding: "10px 0 60px 0",
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
  },
  menu: {
    listStyle: "none",
    padding: 0,
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px 15px",
    margin: "5px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: "14px",
  },
  icon: {
    marginRight: "10px",
    fontSize: "16px",
    minWidth: "20px",
  },
  menuText: {
    flexGrow: 1,
    lineHeight: "1.2",
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
