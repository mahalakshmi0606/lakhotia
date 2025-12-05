// ✅ SettingsMatrix.js
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { menuItems } from "./Sidebar"; // ✅ Static modules from Sidebar.js

const USER_TYPE_API = "http://localhost:5000/api/usertype";
const PERMISSION_API = "http://localhost:5000/api/permissions";

const SettingsMatrix = () => {
  const [userTypes, setUserTypes] = useState([]);
  const [modules, setModules] = useState([]);
  const [accessMatrix, setAccessMatrix] = useState({});

  // ✅ Fetch user types & modules initially
  useEffect(() => {
    fetchUserTypes();
    setModules(menuItems);
  }, []);

  // ✅ Fetch all user types
  const fetchUserTypes = async () => {
    try {
      const res = await fetch(USER_TYPE_API);
      const data = await res.json();

      if (data.success) {
        setUserTypes(data.data);
        initializeMatrix(data.data);
        fetchPermissions(data.data);
      } else {
        toast.error("Failed to load user types!");
      }
    } catch (error) {
      console.error("UserType Fetch Error:", error);
      toast.error("Error loading user types!");
    }
  };

  // ✅ Initialize empty access matrix
  const initializeMatrix = (userTypesList) => {
    const initialMatrix = {};
    userTypesList.forEach((ut) => {
      initialMatrix[ut.id] = {};
      menuItems.forEach((mod) => {
        initialMatrix[ut.id][mod.name] = false;
      });
    });
    setAccessMatrix(initialMatrix);
  };

  // ✅ Fetch permissions and update matrix
  const fetchPermissions = async (userTypesList) => {
    try {
      const res = await fetch(PERMISSION_API);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const updatedMatrix = {};
        userTypesList.forEach((ut) => {
          updatedMatrix[ut.id] = {};
          menuItems.forEach((mod) => {
            const permission = data.data.find(
              (p) =>
                p.user_type_id === ut.id && p.module_name === mod.name
            );
            updatedMatrix[ut.id][mod.name] = permission
              ? permission.can_view === true || permission.can_view === 1
              : false;
          });
        });
        setAccessMatrix(updatedMatrix);
      } else {
        toast.error("Failed to load permissions!");
      }
    } catch (error) {
      console.error("Permission Fetch Error:", error);
      toast.error("Error loading permissions!");
    }
  };

  // ✅ Handle checkbox toggle
  const handleCheckboxChange = (userTypeId, moduleName) => {
    setAccessMatrix((prev) => ({
      ...prev,
      [userTypeId]: {
        ...prev[userTypeId],
        [moduleName]: !prev[userTypeId][moduleName],
      },
    }));
  };

  // ✅ Save settings to backend
  const handleSave = async () => {
    const updates = [];

    Object.entries(accessMatrix).forEach(([userTypeId, modulesAccess]) => {
      Object.entries(modulesAccess).forEach(([moduleName, hasAccess]) => {
        updates.push({
          user_type_id: parseInt(userTypeId),
          module_name: moduleName,
          can_view: hasAccess ? 1 : 0,
        });
      });
    });

    try {
      const res = await fetch(`${PERMISSION_API}/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Settings updated successfully!");
      } else {
        toast.error("Failed to update settings!");
      }
    } catch (error) {
      console.error("Save Error:", error);
      toast.error("Error saving settings!");
    }
  };

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />
      <h2 style={styles.heading}>User Type vs Module Access</h2>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User Type</th>
              {modules.map((mod, index) => (
                <th key={index} style={styles.th}>
                  {mod.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {userTypes.map((ut) => (
              <tr key={ut.id}>
                <td style={styles.td}>{ut.name}</td>
                {modules.map((mod, index) => (
                  <td key={index} style={styles.td}>
                    <input
                      type="checkbox"
                      checked={accessMatrix[ut.id]?.[mod.name] || false}
                      onChange={() => handleCheckboxChange(ut.id, mod.name)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button style={styles.saveButton} onClick={handleSave}>
        Save Settings
      </button>
    </div>
  );
};

// ✅ Styles
const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
    fontFamily: "Arial, Helvetica, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heading: {
    marginBottom: "25px",
    color: "#333",
    fontWeight: "600",
    fontSize: "22px",
  },
  tableWrapper: {
    width: "95%",
    overflowX: "auto",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    borderRadius: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
  },
  th: {
    padding: "12px",
    backgroundColor: "#f5c518",
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
    fontSize: "14px",
    borderBottom: "2px solid #f1f1f1",
  },
  td: {
    padding: "12px",
    textAlign: "center",
    borderBottom: "1px solid #eee",
    fontSize: "13px",
  },
  saveButton: {
    marginTop: "20px",
    backgroundColor: "#f5c518",
    border: "none",
    padding: "10px 25px",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    color: "#333",
  },
};

export default SettingsMatrix;
