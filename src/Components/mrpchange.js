import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

// Correct API endpoints
const API_STOCK_ALL = "http://127.0.0.1:5000/api/stock/all";
const API_MRP_UPDATE = "http://127.0.0.1:5000/api/stock/update-mrp"; 
const API_SINGLE_UPDATE = "http://127.0.0.1:5000/api/stock/update";
const API_DELETE = "http://127.0.0.1:5000/api/stock/delete";

export default function MRPChangePage() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allMRP, setAllMRP] = useState([]);
  const [editData, setEditData] = useState({});

  // ----------------------------
  // Download Excel Template
  // ----------------------------
  const handleDownloadExcel = async () => {
    try {
      const res = await axios.get(API_STOCK_ALL);
      const data = res.data.data;

      if (!data.length) return alert("No stock data found!");

      const ws = XLSX.utils.json_to_sheet(
        data.map((d) => ({
          "Item Name": d["Item Name"],
          "Brand": d["Brand"],
          "Brand Code": d["Brand Code"],
          "Brand Description": d["Brand Description"],
          "MRP": d["MRP"],
        }))
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Stock");
      XLSX.writeFile(wb, "MRP_Update.xlsx");
    } catch (error) {
      console.error(error);
      alert("Failed to download Excel");
    }
  };

  // ----------------------------
  // Upload Excel + Preview
  // ----------------------------
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      setPreviewData(data);
    };
    reader.readAsBinaryString(selectedFile);
  };

  // ----------------------------
  // Update MRP from Excel File
  // ----------------------------
  const handleMRPUpdate = async () => {
    if (!file) return alert("Upload Excel first!");

    setLoading(true);
    try {
      const res = await axios.put(API_MRP_UPDATE, {
        records: previewData,
      });

      alert(res.data.message || "MRP Updated Successfully!");
      fetchAllMRP();
    } catch (error) {
      console.error(error);
      alert("Error updating MRP");
    }
    setLoading(false);
  };

  // ----------------------------
  // Fetch All MRP Records
  // ----------------------------
  const fetchAllMRP = async () => {
    try {
      const res = await axios.get(API_STOCK_ALL);
      const data = res.data.data || [];
      setAllMRP(data);

      const editable = {};
      data.forEach((item) => {
        editable[item.id] = {
          brand: item.Brand,
          mrp: item.MRP,
        };
      });

      setEditData(editable);
    } catch {
      alert("Could not fetch records");
    }
  };

  // ----------------------------
  // Inline Edit
  // ----------------------------
  const handleEditChange = (id, field, value) => {
    setEditData({
      ...editData,
      [id]: { ...editData[id], [field]: value },
    });
  };

  // ----------------------------
  // Save Single Row Edit
  // ----------------------------
  const saveEdit = async (id) => {
    try {
      await axios.put(`${API_SINGLE_UPDATE}/${id}`, editData[id]);
      alert("Updated successfully");
      fetchAllMRP();
    } catch {
      alert("Update failed");
    }
  };

  // ----------------------------
  // Delete Item
  // ----------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      await axios.delete(`${API_DELETE}/${id}`);
      fetchAllMRP();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>MRP Management</h2>

      {/* Download Excel */}
      <div style={styles.card}>
        <button style={styles.button} onClick={handleDownloadExcel}>
          Download Excel Template
        </button>
      </div>

      {/* Upload Excel */}
      <div style={styles.card}>
        <h3>Upload Excel File</h3>
        <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
      </div>

      {/* Preview */}
      {previewData.length > 0 && (
        <div style={styles.card}>
          <h3>Excel Preview</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                {Object.keys(previewData[0]).map((col) => (
                  <th key={col} style={styles.th}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} style={styles.td}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Update Button */}
      {file && (
        <button style={styles.button} onClick={handleMRPUpdate}>
          {loading ? "Updating..." : "Update MRP from Excel"}
        </button>
      )}

      {/* All MRP Records */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>All MRP Records</h3>
          <button style={styles.loadBtn} onClick={fetchAllMRP}>
            Load Records
          </button>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Brand</th>
              <th style={styles.th}>MRP</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {allMRP.map((item) => (
              <tr key={item.id}>
                <td style={styles.td}>{item.id}</td>

                <td style={styles.td}>
                  <input
                    value={editData[item.id]?.brand || ""}
                    onChange={(e) =>
                      handleEditChange(item.id, "brand", e.target.value)
                    }
                    style={styles.input}
                  />
                </td>

                <td style={styles.td}>
                  <input
                    type="number"
                    value={editData[item.id]?.mrp || ""}
                    onChange={(e) =>
                      handleEditChange(item.id, "mrp", e.target.value)
                    }
                    style={styles.input}
                  />
                </td>

                <td style={styles.td}>
                  <button
                    style={styles.smallBtnGreen}
                    onClick={() => saveEdit(item.id)}
                  >
                    Save
                  </button>

                  <button
                    style={styles.smallBtnRed}
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------
// Styles
// ----------------------------------
const styles = {
  container: { padding: "20px", maxWidth: "900px", margin: "auto" },
  heading: { textAlign: "center", marginBottom: "20px" },
  card: {
    padding: "15px",
    background: "#f8f8f8",
    borderRadius: "8px",
    border: "1px solid #ddd",
    marginBottom: "20px",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "#ffe680",
    border: "1px solid #ccc",
    padding: "8px",
    fontWeight: "bold",
    textAlign: "center",
  },
  td: { border: "1px solid #ccc", padding: "6px", textAlign: "center" },
  input: { padding: "4px", width: "90%" },
  button: {
    background: "#007bff",
    padding: "10px 16px",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  loadBtn: {
    background: "#6c5ce7",
    padding: "7px 12px",
    color: "white",
    borderRadius: "6px",
  },
  smallBtnGreen: {
    background: "#2ecc71",
    padding: "5px 10px",
    color: "white",
    borderRadius: "4px",
    marginRight: "6px",
  },
  smallBtnRed: {
    background: "#e74c3c",
    padding: "5px 10px",
    color: "white",
    borderRadius: "4px",
  },
};
