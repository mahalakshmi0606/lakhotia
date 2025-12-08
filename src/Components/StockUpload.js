import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

export default function StockUploadPage() {
  const fixedHeaders = [
    "Item Name",
    "Brand",
    "Brand Code",
    "Brand Description",
    "HSN",
    "Batch Code",
    "MRP",
    "Buy Price",
    "Width",
    "Length",
    "Unit",
    "GST",
  ];

  const [rows, setRows] = useState([]);
  const [unmatched, setUnmatched] = useState([]); // { Brand, MRP }
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Loading states
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingMRP, setLoadingMRP] = useState(false);
  const [applyingMRP, setApplyingMRP] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const fileInputRef = useRef(null);

  // -------------------------
  // Utility: Excel download
  // -------------------------
  const downloadExcel = (data, filename = "unmatched_brands.xlsx", sheetName = "Unmatched") => {
    if (!data || data.length === 0) {
      alert("No data to download");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };

  // ----------------------------------------------------
  // Pagination calculations
  // ----------------------------------------------------
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = rows.slice(indexOfFirstRow, indexOfLastRow);

  // ----------------------------------------------------
  // Pagination handlers
  // ----------------------------------------------------
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleFirstPage = () => goToPage(1);
  const handleLastPage = () => goToPage(totalPages);
  const handlePrevPage = () => goToPage(currentPage - 1);
  const handleNextPage = () => goToPage(currentPage + 1);

  // Reset to first page when rows change (upload, delete, etc.)
  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  // ----------------------------------------------------
  // Add multiple empty rows (prompt count)
  // ----------------------------------------------------
  const handleAddRows = () => {
    const count = prompt("Enter number of rows to add:");
    if (!count) return;
    const n = Number(count);
    if (!Number.isFinite(n) || n <= 0) {
      alert("Enter a valid positive number");
      return;
    }
    const emptyRows = Array.from({ length: n }).map(() => {
      const row = {};
      fixedHeaders.forEach((h) => (row[h] = ""));
      return { ...row, _id: Math.random().toString(36).slice(2, 9) };
    });
    setRows((prev) => [...prev, ...emptyRows]);
  };

  // ----------------------------------------------------
  // Fetch stock (initial load) — optimized
  // ----------------------------------------------------
  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoadingStock(true);
        setError("");
        const res = await fetch("http://localhost:5000/api/stock/all");
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          const finalRows = data.data.map((row, index) => ({
            ...row,
            _id: index + "_" + Math.random().toString(36).slice(2, 7),
          }));
          setRows(finalRows);
        } else {
          // If API returns differently, tolerate gracefully
          if (Array.isArray(data)) {
            const finalRows = data.map((row, index) => ({
              ...row,
              _id: index + "_" + Math.random().toString(36).slice(2, 7),
            }));
            setRows(finalRows);
          } else {
            setRows([]);
          }
        }
      } catch (e) {
        console.error("Error loading stock:", e);
        setError("Error loading stock data.");
      } finally {
        setLoadingStock(false);
      }
    };

    fetchStock();
  }, []);

  // ----------------------------------------------------
  // Handle Excel upload (parse & normalize) — optimized
  // ----------------------------------------------------
  const handleFile = (e) => {
    setError("");
    setSuccess("");

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!Array.isArray(json) || json.length === 0) {
          setError("Excel file is empty.");
          return;
        }

        // Normalize keys once and map to fixed headers
        const finalRows = json.map((rawRow, idx) => {
          // Build lowercase keyed map for quick lookup
          const lookup = {};
          Object.keys(rawRow).forEach((k) => {
            if (!k) return;
            lookup[k.trim().toLowerCase()] = rawRow[k];
          });

          const mapped = {};
          for (const header of fixedHeaders) {
            const keyLower = header.toLowerCase();
            mapped[header] =
              lookup[keyLower] ??
              lookup[keyLower.replace(/ /g, "")] ??
              lookup[keyLower.replace(/[-_]/g, "")] ??
              "";
          }

          return {
            ...mapped,
            _id: idx + "_" + Math.random().toString(36).slice(2, 7),
          };
        });

        setRows(finalRows);
      } catch (err) {
        console.error(err);
        setError("Invalid Excel file. Upload a valid .xlsx/.xls file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ----------------------------------------------------
  // MRP Change: fetch MRP list, apply to rows, collect unmatched
  // - Efficient: build map of mrp once and single pass over rows
  // ----------------------------------------------------
  const handleMRPChange = async () => {
    if (rows.length === 0) {
      alert("No stock rows available to update.");
      return;
    }

    setError("");
    setSuccess("");
    setApplyingMRP(true);
    setUnmatched([]);

    try {
      setLoadingMRP(true);
      const res = await fetch("http://localhost:5000/api/mrp/all");
      const data = await res.json();
      setLoadingMRP(false);

      if (!data || !Array.isArray(data.data) || data.data.length === 0) {
        setError("No MRP records found in backend.");
        setApplyingMRP(false);
        return;
      }

      // Build a map for O(1) lookups: brandLower -> mrp
      const mrpMap = new Map();
      for (const item of data.data) {
        if (item && item.brand) {
          mrpMap.set(String(item.brand).trim().toLowerCase(), item.mrp);
        }
      }

      // Single pass over rows to update and collect unmatched
      const unmatchedList = [];
      const updatedRows = rows.map((row) => {
        const brandRaw = row["Brand"];
        const brandLower = brandRaw ? String(brandRaw).trim().toLowerCase() : "";
        if (brandLower && mrpMap.has(brandLower)) {
          // Update MRP only
          const newMRP = mrpMap.get(brandLower);
          return { ...row, MRP: newMRP };
        } else {
          // Unmatched — include Brand and show "Not Found" for MRP (Option A)
          unmatchedList.push({
            Brand: brandRaw || "(Empty Brand)",
            MRP: "Not Found",
          });
          return row;
        }
      });

      setRows(updatedRows);
      setUnmatched(unmatchedList);
      setSuccess(
        `MRP change applied. ${unmatchedList.length} unmatched row(s) found.`
      );
    } catch (err) {
      console.error("MRP Change error:", err);
      setError("Error fetching or applying MRP change.");
    } finally {
      setApplyingMRP(false);
      setLoadingMRP(false);
    }
  };

  // ----------------------------------------------------
  // Download unmatched Excel
  // ----------------------------------------------------
  const handleDownloadUnmatched = () => {
    if (unmatched.length === 0) {
      alert("No unmatched rows to download.");
      return;
    }
    downloadExcel(unmatched, "unmatched_brands.xlsx", "Unmatched");
  };

  // ----------------------------------------------------
  // Save to backend with loading indicator
  // ----------------------------------------------------
  const saveToBackend = async () => {
    if (rows.length === 0) {
      setError("Upload a file before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Clean once
      const cleaned = rows.map((r) => {
        const copy = { ...r };
        delete copy._id;
        return copy;
      });

      const res = await fetch("http://localhost:5000/api/stock/bulk-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: cleaned }),
      });
      const data = await res.json();

      if (data && data.success) {
        setSuccess("Stock data saved successfully!");
      } else {
        setError(data?.message || "Failed to save data.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Backend error. Check API connection.");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // Small helpers: update / delete
  // ----------------------------------------------------
  const deleteRow = (id) => setRows((prev) => prev.filter((r) => r._id !== id));
  const updateCell = (id, key, value) =>
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, [key]: value } : r)));

  // ----------------------------------------------------
  // Simple inline spinner style
  // ----------------------------------------------------
  const spinnerStyle = {
    display: "inline-block",
    width: 14,
    height: 14,
    border: "2px solid rgba(0,0,0,0.2)",
    borderTopColor: "rgba(0,0,0,0.6)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    marginLeft: 8,
  };

  // Add keyframes via style tag for spinner animation
  const Keyframes = () => (
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  );

  // ----------------------------------------------------
  // Render page numbers
  // ----------------------------------------------------
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) pageNumbers.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // ----------------------------------------------------
  // Render UI
  // ----------------------------------------------------
  return (
    <div style={{ width: "100%", padding: 20, fontFamily: "Segoe UI, Arial" }}>
      <Keyframes />

      {/* Unmatched box */}
      {unmatched.length > 0 && (
        <div
          style={{
            background: "#fff8e1",
            padding: 12,
            marginBottom: 18,
            borderRadius: 6,
            border: "1px solid #ffcc80",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            Unmatched Brands ({unmatched.length})
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ minWidth: 220, fontWeight: 600 }}>Brand</div>
            <div style={{ minWidth: 120, fontWeight: 600 }}>MRP</div>
          </div>

          <div style={{ marginTop: 8 }}>
            {unmatched.map((u, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "4px 0" }}>
                <div style={{ minWidth: 220, color: "#d84315" }}>{u.Brand}</div>
                <div style={{ minWidth: 120 }}>{u.MRP}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10 }}>
            <button
              onClick={handleDownloadUnmatched}
              style={{
                background: "#ff5722",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              Download Unmatched (Excel)
            </button>
          </div>
        </div>
      )}

      {/* Header + actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Stock Bulk Upload</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={handleAddRows}
            style={{ background: "#009688", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" }}
            disabled={loadingStock || loadingMRP || applyingMRP || saving}
            title="Add empty rows"
          >
            + Add Row
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ background: "#1e73e8", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" }}
            disabled={loadingStock || loadingMRP || applyingMRP || saving}
          >
            Bulk Upload
            {loadingStock && <span style={spinnerStyle} />}
          </button>

          <button
            onClick={handleMRPChange}
            style={{ background: "#ff9800", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" }}
            disabled={loadingMRP || applyingMRP}
            title="Fetch MRP and update rows"
          >
            {applyingMRP ? "Applying MRP..." : "MRP Change"}
            {(loadingMRP || applyingMRP) && <span style={spinnerStyle} />}
          </button>

          <button
            onClick={saveToBackend}
            style={{ background: "green", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
            {saving && <span style={spinnerStyle} />}
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFile} />

      {/* Status messages */}
      <div style={{ marginTop: 12 }}>
        {loadingStock && (
          <div style={{ color: "#333", marginBottom: 6 }}>
            Loading stock...
            <span style={spinnerStyle} />
          </div>
        )}
        {loadingMRP && (
          <div style={{ color: "#333", marginBottom: 6 }}>
            Loading MRP data...
            <span style={spinnerStyle} />
          </div>
        )}
        {error && (
          <div style={{ color: "red", fontWeight: 700, marginBottom: 6 }}>{error}</div>
        )}
        {success && (
          <div style={{ color: "green", fontWeight: 700, marginBottom: 6 }}>{success}</div>
        )}
      </div>

      {/* Pagination info and controls - TOP */}
      {rows.length > 0 && (
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          margin: "16px 0", 
          padding: "12px 16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "6px",
          border: "1px solid #dee2e6"
        }}>
          <div style={{ fontWeight: 600 }}>
            Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, rows.length)} of {rows.length} entries
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handleFirstPage}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px",
                border: "1px solid #ddd",
                background: currentPage === 1 ? "#f5f5f5" : "#fff",
                color: currentPage === 1 ? "#999" : "#333",
                cursor: currentPage === 1 ? "default" : "pointer",
                borderRadius: "4px"
              }}
              title="First Page"
            >
              «
            </button>
            
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px",
                border: "1px solid #ddd",
                background: currentPage === 1 ? "#f5f5f5" : "#fff",
                color: currentPage === 1 ? "#999" : "#333",
                cursor: currentPage === 1 ? "default" : "pointer",
                borderRadius: "4px"
              }}
              title="Previous Page"
            >
              ‹
            </button>
            
            {renderPageNumbers().map((page, index) => (
              page === "..." ? (
                <span key={`ellipsis-${index}`} style={{ padding: "0 8px" }}>...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #ddd",
                    background: currentPage === page ? "#007bff" : "#fff",
                    color: currentPage === page ? "#fff" : "#333",
                    cursor: "pointer",
                    borderRadius: "4px",
                    fontWeight: currentPage === page ? "bold" : "normal"
                  }}
                >
                  {page}
                </button>
              )
            ))}
            
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px",
                border: "1px solid #ddd",
                background: currentPage === totalPages ? "#f5f5f5" : "#fff",
                color: currentPage === totalPages ? "#999" : "#333",
                cursor: currentPage === totalPages ? "default" : "pointer",
                borderRadius: "4px"
              }}
              title="Next Page"
            >
              ›
            </button>
            
            <button
              onClick={handleLastPage}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px",
                border: "1px solid #ddd",
                background: currentPage === totalPages ? "#f5f5f5" : "#fff",
                color: currentPage === totalPages ? "#999" : "#333",
                cursor: currentPage === totalPages ? "default" : "pointer",
                borderRadius: "4px"
              }}
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto", marginTop: rows.length > 0 ? 0 : 16 }}>
        <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f3f3f3", position: "sticky", top: 0 }}>
            <tr>
              <th style={{ minWidth: 36 }}>#</th>
              {fixedHeaders.map((h) => (
                <th key={h} style={{ minWidth: 120 }}>{h}</th>
              ))}
              <th style={{ minWidth: 120 }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {currentRows.length > 0 ? (
              currentRows.map((row, idx) => (
                <tr key={row._id || idx}>
                  <td style={{ width: 36 }}>{indexOfFirstRow + idx + 1}</td>

                  {fixedHeaders.map((h) => (
                    <td key={h}>
                      <input
                        value={row[h] ?? ""}
                        onChange={(e) => updateCell(row._id, h, e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: 6 }}
                      />
                    </td>
                  ))}

                  <td>
                    <button
                      onClick={() => deleteRow(row._id)}
                      style={{ background: "#e74c3c", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={fixedHeaders.length + 2} style={{ textAlign: "center", padding: 12 }}>
                  {loadingStock ? "Loading stock..." : "No data uploaded. Click Bulk Upload."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls - BOTTOM */}
      {rows.length > 0 && totalPages > 1 && (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          marginTop: "20px", 
          gap: "8px"
        }}>
          <button
            onClick={handleFirstPage}
            disabled={currentPage === 1}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              background: currentPage === 1 ? "#f5f5f5" : "#fff",
              color: currentPage === 1 ? "#999" : "#333",
              cursor: currentPage === 1 ? "default" : "pointer",
              borderRadius: "4px"
            }}
            title="First Page"
          >
            « First
          </button>
          
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              background: currentPage === 1 ? "#f5f5f5" : "#fff",
              color: currentPage === 1 ? "#999" : "#333",
              cursor: currentPage === 1 ? "default" : "pointer",
              borderRadius: "4px"
            }}
            title="Previous Page"
          >
            Previous
          </button>
          
          <div style={{ padding: "0 12px", fontWeight: 600 }}>
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              background: currentPage === totalPages ? "#f5f5f5" : "#fff",
              color: currentPage === totalPages ? "#999" : "#333",
              cursor: currentPage === totalPages ? "default" : "pointer",
              borderRadius: "4px"
            }}
            title="Next Page"
          >
            Next
          </button>
          
          <button
            onClick={handleLastPage}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              background: currentPage === totalPages ? "#f5f5f5" : "#fff",
              color: currentPage === totalPages ? "#999" : "#333",
              cursor: currentPage === totalPages ? "default" : "pointer",
              borderRadius: "4px"
            }}
            title="Last Page"
          >
            Last »
          </button>
        </div>
      )}
    </div>
  );
}