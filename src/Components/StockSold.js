// StockSoldPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_COMPLETED_TASKS = "http://localhost:5000/api/tasks/completed";

// ❌ Fields to hide in View popup (due_date NOT removed)
const HIDDEN_FIELDS = [
  "hsn_sac",
  "invoice_remarks",
  "invoice_amount",
  "mrp",
  "material_type",
  "production_end_date",
  "production_start_date",
  "production_status",
  "quality_check",
  "thickness"
];

const StockSoldPage = () => {
  const [items, setItems] = useState([]);
  const [viewItem, setViewItem] = useState(null);

  useEffect(() => {
    fetchCompletedItems();
  }, []);

  const fetchCompletedItems = async () => {
    try {
      const res = await axios.get(API_COMPLETED_TASKS);
      if (res.data.success) {
        setItems(res.data.data);
      } else {
        toast.error("Failed to load completed items");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading completed items");
    }
  };

  return (
    <div style={styles.page}>
      <ToastContainer />
      <h2 style={styles.title}>Completed Stock Items</h2>

      {/* TABLE */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Item</th>
            <th style={styles.th}>Company</th>
            <th style={styles.th}>Qty</th>
            <th style={styles.th}>Unit</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan="5" style={styles.empty}>
                No completed items
              </td>
            </tr>
          ) : (
            items.map((item, i) => (
              <tr key={i}>
                <td style={styles.td}>{item.item_name}</td>
                <td style={styles.td}>{item.company_name}</td>
                <td style={styles.td}>{item.quantity}</td>
                <td style={styles.td}>{item.unit}</td>
                <td style={styles.td}>
                  <button
                    style={styles.viewBtn}
                    onClick={() => setViewItem(item)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* VIEW POPUP */}
      {viewItem && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h3 style={{ textAlign: "center" }}>Task Details</h3>

            <div style={styles.detailGrid}>
              {Object.entries(viewItem)
                .filter(([key]) => !HIDDEN_FIELDS.includes(key))
                .map(([key, value]) => (
                  <div key={key} style={styles.detailRow}>
                    <strong>
                      {key.replace(/_/g, " ").toUpperCase()}
                    </strong>
                    <span>{value ?? "-"}</span>
                  </div>
                ))}
            </div>

            <button
              style={styles.closeBtn}
              onClick={() => setViewItem(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* STYLES */
const styles = {
  page: {
    maxWidth: 1000,
    margin: "20px auto",
    padding: 16
  },
  title: {
    textAlign: "center",
    marginBottom: 20
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff"
  },
  th: {
    padding: 12,
    textAlign: "left",
    borderBottom: "2px solid #ddd",
    background: "#f8f9fa"
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #eee"
  },
  empty: {
    textAlign: "center",
    padding: 16
  },
  viewBtn: {
    padding: "6px 12px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  popup: {
    width: 520,
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    maxHeight: "80vh",
    overflowY: "auto"
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 16
  },
  detailRow: {
    display: "flex",
    flexDirection: "column",
    fontSize: 14
  },
  closeBtn: {
    marginTop: 20,
    width: "100%",
    padding: 10,
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer"
  }
};

export default StockSoldPage;
