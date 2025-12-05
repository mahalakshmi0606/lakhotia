// StockSoldPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_GRN = "http://localhost:5000/api/grn/all";
const API_SOLD = "http://localhost:5000/api/stock_sold";

const StockSoldPage = () => {
  const [formData, setFormData] = useState({
    item_name: "",
    sold_qty: "",
    date: "",
    customer_name: "",
    remarks: ""
  });

  const [grnItems, setGrnItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  const [soldList, setSoldList] = useState([]);
  const [openPopup, setOpenPopup] = useState(false);

  useEffect(() => {
    fetchGRN();
    fetchSold();
  }, []);

  // fetch item names from GRN saved entries
  const fetchGRN = async () => {
    try {
      const res = await axios.get(API_GRN);
      if (res.data.success) {
        // res.data.data is expected array of GRN objects
        setGrnItems(res.data.data);
      } else {
        toast.error("Failed to load GRN items");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading GRN items");
    }
  };

  const fetchSold = async () => {
    try {
      const res = await axios.get(`${API_SOLD}/all`);
      if (res.data.success) {
        setSoldList(res.data.data);
      } else {
        toast.error("Failed to load sold records");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading sold records");
    }
  };

  // Item search (typeahead)
  const handleItemSearch = (e) => {
    const v = e.target.value;
    setFormData({ ...formData, item_name: v });

    if (!v) {
      setShowItemDropdown(false);
      return;
    }

    const filtered = grnItems.filter((g) =>
      (g.item_name || "").toLowerCase().includes(v.toLowerCase())
    );

    setFilteredItems(filtered);
    setShowItemDropdown(true);
  };

  const handleSelectItem = (item) => {
    setFormData((p) => ({ ...p, item_name: item.item_name }));
    setShowItemDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic validation
    if (!formData.item_name || !formData.sold_qty || !formData.date) {
      toast.error("Please fill item, qty and date");
      return;
    }

    try {
      const payload = {
        item_name: formData.item_name,
        sold_qty: Number(formData.sold_qty),
        date: formData.date,
        customer_name: formData.customer_name || "",
        remarks: formData.remarks || ""
      };

      const res = await axios.post(`${API_SOLD}/save`, payload);
      if (res.data.success) {
        toast.success("Stock sold saved");
        setFormData({
          item_name: "",
          sold_qty: "",
          date: "",
          customer_name: "",
          remarks: ""
        });
        setOpenPopup(false);
        fetchSold();
      } else {
        toast.error("Save failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving sold record");
    }
  };

  return (
    <div style={styles.page}>
      <ToastContainer />
      <h2 style={styles.title}>Stock Sold</h2>

      <button style={styles.addBtn} onClick={() => setOpenPopup(true)}>
        + Add Sold
      </button>

      {/* Popup */}
      {openPopup && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h3 style={{ textAlign: "center" }}>Add Stock Sold</h3>

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>Item Name</label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleItemSearch}
                autoComplete="off"
                style={styles.input}
                required
              />
              {showItemDropdown && (
                <ul style={styles.dropdown}>
                  {filteredItems.length === 0 ? (
                    <li style={styles.noItem}>No items</li>
                  ) : (
                    filteredItems.map((it, i) => (
                      <li
                        key={i}
                        style={styles.listItem}
                        onClick={() => handleSelectItem(it)}
                      >
                        {it.item_name} — {it.brand}
                      </li>
                    ))
                  )}
                </ul>
              )}

              <label style={styles.label}>Sold Quantity</label>
              <input
                type="number"
                name="sold_qty"
                value={formData.sold_qty}
                onChange={handleChange}
                style={styles.input}
                required
              />

              <label style={styles.label}>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={styles.input}
                required
              />

              <label style={styles.label}>Customer Name</label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                style={styles.input}
              />

              <label style={styles.label}>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                style={{ ...styles.input, minHeight: 80 }}
              />

              <div style={styles.buttonRow}>
                <button type="submit" style={styles.saveBtn}>Save</button>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setOpenPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <h3 style={{ marginTop: 30 }}>Sold Records</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Item</th>
            <th style={styles.th}>Qty</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {soldList.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: 12 }}>
                No records
              </td>
            </tr>
          ) : (
            soldList.map((r, i) => (
              <tr key={i}>
                <td style={styles.td}>{r.item_name}</td>
                <td style={styles.td}>{r.sold_qty}</td>
                <td style={styles.td}>{r.date}</td>
                <td style={styles.td}>{r.customer_name}</td>
                <td style={styles.td}>{r.remarks}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Inline styles
const styles = {
  page: { maxWidth: 900, margin: "20px auto", padding: 16 },
  title: { textAlign: "center", marginBottom: 12 },
  addBtn: {
    padding: "10px 16px",
    background: "#28a745",
    color: "#fff",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    marginBottom: 12
  },
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 999
  },
  popup: {
    width: 480, background: "#fff", padding: 20, borderRadius: 10,
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
  },
  form: { display: "flex", flexDirection: "column" },
  label: { marginTop: 10, marginBottom: 6, fontWeight: 600 },
  input: {
    padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 14
  },
  dropdown: {
    position: "absolute", background: "#fff", width: 420, maxHeight: 160,
    overflowY: "auto", border: "1px solid #ccc", borderRadius: 6, zIndex: 1000,
    marginTop: 4, listStyle: "none", paddingLeft: 0
  },
  listItem: { padding: 10, cursor: "pointer", borderBottom: "1px solid #eee" },
  noItem: { padding: 10, color: "#777", textAlign: "center" },
  buttonRow: { display: "flex", justifyContent: "space-between", marginTop: 16 },
  saveBtn: { background: "#007bff", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 6, cursor: "pointer" },
  cancelBtn: { background: "gray", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 6, cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 12, background: "#fff" },
  th: { textAlign: "left", padding: 10, borderBottom: "1px solid #ddd" },
  td: { padding: 10, borderBottom: "1px solid #eee" }
};

export default StockSoldPage;
