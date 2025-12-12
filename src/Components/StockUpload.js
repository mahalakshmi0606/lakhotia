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

  // Configuration for duplicate detection
  const duplicateDetectionFields = [
    "Item Name",
    "Brand", 
    "Batch Code",
    "HSN"
  ];

  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [unmatched, setUnmatched] = useState([]); // For both unmatched brands and duplicates
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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
  // Utility: Duplicate checker
  // ----------------------------------------------------
  const checkForDuplicates = (newRows, existingRows, checkFields = duplicateDetectionFields) => {
    const duplicates = [];
    const uniqueNewRows = [];

    for (const newRow of newRows) {
      let isDuplicate = false;
      
      for (const existingRow of existingRows) {
        const allMatch = checkFields.every(field => {
          const newValue = String(newRow[field] || "").trim().toLowerCase();
          const existingValue = String(existingRow[field] || "").trim().toLowerCase();
          return newValue === existingValue && newValue !== "";
        });

        if (allMatch) {
          isDuplicate = true;
          duplicates.push({
            ...newRow,
            duplicateOf: existingRow,
            duplicateFields: checkFields
          });
          break;
        }
      }

      if (!isDuplicate) {
        uniqueNewRows.push(newRow);
      }
    }

    return { duplicates, uniqueNewRows };
  };

  // ----------------------------------------------------
  // Search functionality
  // ----------------------------------------------------
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredRows(rows);
      setCurrentPage(1);
      return;
    }
    
    const searchLower = term.toLowerCase();
    const filtered = rows.filter(row => {
      return fixedHeaders.some(header => {
        const value = row[header];
        return value && String(value).toLowerCase().includes(searchLower);
      });
    });
    
    setFilteredRows(filtered);
    setCurrentPage(1);
  };

  // Update filtered rows when rows change
  useEffect(() => {
    setFilteredRows(rows);
  }, [rows]);

  // ----------------------------------------------------
  // Pagination calculations
  // ----------------------------------------------------
  const displayRows = searchTerm ? filteredRows : rows;
  const totalPages = Math.ceil(displayRows.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = displayRows.slice(indexOfFirstRow, indexOfLastRow);

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
  }, [rows.length, searchTerm]);

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
          setFilteredRows(finalRows);
        } else {
          // If API returns differently, tolerate gracefully
          if (Array.isArray(data)) {
            const finalRows = data.map((row, index) => ({
              ...row,
              _id: index + "_" + Math.random().toString(36).slice(2, 7),
            }));
            setRows(finalRows);
            setFilteredRows(finalRows);
          } else {
            setRows([]);
            setFilteredRows([]);
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
  // Handle Excel upload (parse & normalize) with duplicate detection
  // ----------------------------------------------------
  const handleFile = (e) => {
    setError("");
    setSuccess("");
    setUnmatched([]);
    setSearchTerm("");

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

        // Duplicate detection logic
        const existingRows = rows;
        const { duplicates, uniqueNewRows } = checkForDuplicates(finalRows, existingRows);

        // Ask user what to do with duplicates
        if (duplicates.length > 0) {
          const shouldSkipDuplicates = window.confirm(
            `Found ${duplicates.length} duplicate row(s) based on:\n` +
            `${duplicateDetectionFields.join(", ")}\n\n` +
            `Do you want to skip duplicates and add only ${uniqueNewRows.length} unique rows?\n\n` +
            `Click OK to skip duplicates\n` +
            `Click Cancel to add all ${finalRows.length} rows (including duplicates)`
          );

          if (shouldSkipDuplicates) {
            // Option 1: Skip duplicates (only add unique rows)
            setRows(prev => [...prev, ...uniqueNewRows]);
            setSuccess(`Added ${uniqueNewRows.length} unique rows. Skipped ${duplicates.length} duplicate(s).`);
            
            // Show duplicate details
            const duplicateDisplay = duplicates.map(dup => ({
              Item: dup["Item Name"] || "(No Item Name)",
              Brand: dup.Brand || "(Empty Brand)",
              Batch: dup["Batch Code"] || "(No Batch)",
              HSN: dup.HSN || "(No HSN)",
              MRP: dup.MRP || "(No MRP)",
              Status: "Duplicate - Skipped"
            }));
            
            // Keep existing unmatched plus new duplicates
            setUnmatched(prev => [...prev, ...duplicateDisplay]);
          } else {
            // Option 2: Add all rows (including duplicates)
            setRows(prev => [...prev, ...finalRows]);
            setSuccess(`Added all ${finalRows.length} rows (including ${duplicates.length} duplicates).`);
          }
        } else {
          // No duplicates found, add all rows
          setRows(prev => [...prev, ...finalRows]);
          setSuccess(`Added ${finalRows.length} unique rows successfully.`);
        }

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

      } catch (err) {
        console.error(err);
        setError("Invalid Excel file. Upload a valid .xlsx/.xls file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ----------------------------------------------------
  // Download unmatched Excel
  // ----------------------------------------------------
  const handleDownloadUnmatched = () => {
    if (unmatched.length === 0) {
      alert("No issues to download.");
      return;
    }
    downloadExcel(unmatched, "issues_found.xlsx", "Issues");
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
  const deleteRow = (id) => {
    setRows((prev) => prev.filter((r) => r._id !== id));
  };
  
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

      {/* Issues box (for both unmatched brands and duplicates) */}
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
            Issues Found ({unmatched.length})
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ minWidth: 180, fontWeight: 600 }}>Item</div>
            <div style={{ minWidth: 120, fontWeight: 600 }}>Brand</div>
            <div style={{ minWidth: 100, fontWeight: 600 }}>Batch</div>
            <div style={{ minWidth: 80, fontWeight: 600 }}>MRP</div>
            <div style={{ minWidth: 120, fontWeight: 600 }}>Status</div>
          </div>

          <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
            {unmatched.map((u, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "4px 0" }}>
                <div style={{ minWidth: 180, color: u.Status?.includes('Duplicate') ? "#d84315" : "#0288d1" }}>
                  {u.Item || "(No Item)"}
                </div>
                <div style={{ minWidth: 120 }}>{u.Brand}</div>
                <div style={{ minWidth: 100 }}>{u.Batch}</div>
                <div style={{ minWidth: 80 }}>{u.MRP}</div>
                <div style={{ 
                  minWidth: 120, 
                  color: u.Status?.includes('Duplicate') ? "#d84315" : "#0288d1",
                  fontWeight: 600 
                }}>
                  {u.Status}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
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
              Download Issues (Excel)
            </button>
            
            <button
              onClick={() => setUnmatched([])}
              style={{
                background: "#78909c",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              Clear Issues
            </button>
          </div>
        </div>
      )}

      {/* Header + actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
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
            onClick={saveToBackend}
            style={{ background: "green", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
            {saving && <span style={spinnerStyle} />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8,
          backgroundColor: "#f8f9fa",
          padding: "12px 16px",
          borderRadius: "6px",
          border: "1px solid #dee2e6"
        }}>
          <div style={{ fontWeight: 600, minWidth: 100 }}>Search:</div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search in all columns..."
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #ced4da",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
          <div style={{ 
            color: "#6c757d", 
            fontSize: "14px",
            minWidth: 120,
            textAlign: "right"
          }}>
            {searchTerm ? `Found: ${filteredRows.length} items` : `Total: ${rows.length} items`}
          </div>
          {searchTerm && (
            <button
              onClick={() => handleSearch("")}
              style={{
                background: "#6c757d",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Clear Search
            </button>
          )}
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
      {displayRows.length > 0 && (
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
            Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, displayRows.length)} of {displayRows.length} entries
            {searchTerm && <span style={{ color: "#007bff", marginLeft: 8 }}>(Filtered)</span>}
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
      <div style={{ overflowX: "auto", marginTop: displayRows.length > 0 ? 0 : 16 }}>
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
                  {loadingStock 
                    ? "Loading stock..." 
                    : searchTerm 
                    ? `No results found for "${searchTerm}"` 
                    : "No data uploaded. Click Bulk Upload."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls - BOTTOM */}
      {displayRows.length > 0 && totalPages > 1 && (
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