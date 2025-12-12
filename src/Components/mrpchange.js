import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const API_STOCK_ALL = "http://127.0.0.1:5000/api/stock/all";
const API_MRP_UPDATE = "http://127.0.0.1:5000/api/stock/update-mrp";

export default function MRPChangePage() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [itemNames, setItemNames] = useState([]);
  const [brands, setBrands] = useState([]);

  const [selectedItemName, setSelectedItemName] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      const res = await axios.get(API_STOCK_ALL);
      const data = res.data.data;

      setItemNames([...new Set(data.map((d) => d["Item Name"]))]);
      setBrands([...new Set(data.map((d) => d["Brand"]))]);
    } catch (error) {
      console.error("Error loading filters", error);
    }
  };

  // Download Excel
  const handleDownloadExcel = async () => {
    try {
      const res = await axios.get(API_STOCK_ALL);
      let data = res.data.data;

      if (!data.length) return alert("No stock data found!");

      if (selectedItemName)
        data = data.filter((d) => d["Item Name"] === selectedItemName);

      if (selectedBrand)
        data = data.filter((d) => d["Brand"] === selectedBrand);

      if (!data.length) return alert("No records found for filters!");

      const ws = XLSX.utils.json_to_sheet(
        data.map((d) => ({
          "Item Name": d["Item Name"],
          Brand: d["Brand"],
          "Brand Code": d["Brand Code"],
          "Brand Description": d["Brand Description"],
          MRP: d["MRP"],
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

  // Upload Preview
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

  // Update MRP
  const handleMRPUpdate = async () => {
    if (!file) return alert("Upload Excel first!");

    setLoading(true);
    try {
      const res = await axios.put(API_MRP_UPDATE, {
        records: previewData,
      });

      alert(res.data.message || "MRP Updated Successfully!");
    } catch (error) {
      console.error(error);
      alert("Error updating MRP");
    }
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center fw-bold mb-4">MRP Management</h2>

      {/* FILTER CARD */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h4 className="fw-semibold mb-3">Download Filters</h4>

          {/* SMALL INPUTS INLINE */}
          <div className="d-flex gap-2 flex-wrap align-items-center mb-3">

            <select
              className="form-select form-select-sm"
              style={{ width: "200px" }}
              value={selectedItemName}
              onChange={(e) => setSelectedItemName(e.target.value)}
            >
              <option value="">Item Name</option>
              {itemNames.map((v, i) => (
                <option key={i} value={v}>{v}</option>
              ))}
            </select>

            <select
              className="form-select form-select-sm"
              style={{ width: "200px" }}
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">Brand</option>
              {brands.map((v, i) => (
                <option key={i} value={v}>{v}</option>
              ))}
            </select>

            <input
              type="file"
              accept=".xlsx,.xls"
              className="form-control form-control-sm"
              style={{ width: "200px" }}
              onChange={handleFileUpload}
            />

            <button
              className="btn btn-primary btn-sm px-2 py-1"
              onClick={handleDownloadExcel}
            >
              Download Excel
            </button>

            <button
              className="btn btn-success btn-sm px-2 py-1"
              onClick={handleMRPUpdate}
              disabled={!file}
            >
              {loading ? "Updating..." : "Update MRP"}
            </button>
          </div>
        </div>
      </div>

      {/* PREVIEW TABLE */}
      {previewData.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-body">
            <h4 className="fw-semibold mb-3">Excel Preview</h4>

            <div className="table-responsive">
              <table className="table table-bordered table-sm">
                <thead className="table-warning">
                  <tr>
                    {Object.keys(previewData[0]).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j}>{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
