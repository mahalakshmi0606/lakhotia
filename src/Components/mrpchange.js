import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const API_MRP_UPDATE = "http://127.0.0.1:5000/api/mrp/update";
const API_MRP_ALL = "http://127.0.0.1:5000/api/mrp/all";
const API_MRP_DELETE = "http://127.0.0.1:5000/api/mrp/delete";
const API_MRP_EDIT = "http://127.0.0.1:5000/api/mrp/edit";

export default function MRPChangePage() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [insertedItems, setInsertedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allMRP, setAllMRP] = useState([]);

  // Track editable values for all rows
  const [editData, setEditData] = useState({});

  // File Upload
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      setPreviewData(data);
    };
    reader.readAsBinaryString(selectedFile);
  };

  // Insert Excel Records
  const handleMRPInsert = async () => {
    if (!file) {
      alert("Please upload a file first");
      return;
    }

    setInsertedItems([]);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(API_MRP_UPDATE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setInsertedItems(res.data.inserted || []);
      alert(`Inserted ${res.data.inserted_count} records`);
    } catch (err) {
      alert("Error inserting records");
    }

    setLoading(false);
  };

  // Load all records
  const fetchAllMRP = async () => {
    try {
      const res = await axios.get(API_MRP_ALL);
      setAllMRP(res.data.data || []);

      // Load editable values
      const editable = {};
      res.data.data.forEach((item) => {
        editable[item.id] = { brand: item.brand, mrp: item.mrp };
      });
      setEditData(editable);
    } catch (err) {
      alert("Error fetching records");
    }
  };

  // Handle edit change
  const handleEditChange = (id, field, value) => {
    setEditData({
      ...editData,
      [id]: {
        ...editData[id],
        [field]: value,
      },
    });
  };

  // Save edited row
  const saveEdit = async (id) => {
    try {
      await axios.put(`${API_MRP_EDIT}/${id}`, editData[id]);
      alert("Updated successfully");
      fetchAllMRP();
    } catch {
      alert("Error updating");
    }
  };

  // Delete row
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;

    try {
      await axios.delete(`${API_MRP_DELETE}/${id}`);
      fetchAllMRP();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>MRP Management</h2>

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

      {/* Insert */}
      {file && (
        <button style={styles.button} onClick={handleMRPInsert} disabled={loading}>
          {loading ? "Inserting..." : "Insert Records"}
        </button>
      )}

      {/* Display All */}
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
                    type="text"
                    style={styles.input}
                    value={editData[item.id]?.brand || ""}
                    onChange={(e) =>
                      handleEditChange(item.id, "brand", e.target.value)
                    }
                  />
                </td>

                <td style={styles.td}>
                  <input
                    type="number"
                    style={styles.input}
                    value={editData[item.id]?.mrp || ""}
                    onChange={(e) =>
                      handleEditChange(item.id, "mrp", e.target.value)
                    }
                  />
                </td>

                <td style={styles.td}>
                  <button style={styles.smallBtnGreen} onClick={() => saveEdit(item.id)}>
                    Save
                  </button>
                  <button style={styles.smallBtnRed} onClick={() => handleDelete(item.id)}>
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

  heading: { textAlign: "center", fontSize: "22px", marginBottom: "20px" },

  card: {
    padding: "15px",
    background: "#fafafa",
    borderRadius: "8px",
    border: "1px solid #ddd",
    marginBottom: "20px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },

  th: {
    background: "#ffe680",
    border: "1px solid #ccc",
    padding: "8px",
    fontWeight: "bold",
    textAlign: "center",
  },

  td: {
    border: "1px solid #ccc",
    padding: "6px",
    textAlign: "center",
  },

  input: {
    width: "90%",
    padding: "4px",
    border: "1px solid #bbb",
    borderRadius: "4px",
    fontSize: "14px",
  },

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
    padding: "8px 14px",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
  },

  smallBtnGreen: {
    background: "#2ecc71",
    padding: "5px 10px",
    fontSize: "12px",
    color: "white",
    border: "none",
    borderRadius: "4px",
    marginRight: "6px",
    cursor: "pointer",
  },

  smallBtnRed: {
    background: "#e74c3c",
    padding: "5px 10px",
    fontSize: "12px",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
