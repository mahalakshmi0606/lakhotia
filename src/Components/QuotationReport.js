// src/components/InvoiceModal.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/*
  InvoiceModal.jsx
  - Popup modal opened by button "New Quote / Invoice"
  - Inline styles only
  - Fetches companies from GET /company and fills contact fields
  - Add/Delete items, calculations, export to PDF
*/

export default function InvoiceModal() {
  // idRef must be declared before createEmptyItem / items init
  const idRef = useRef(1000);

  // helper to create item
  function createEmptyItem(seq) {
    idRef.current += 1;
    return {
      id: idRef.current,
      itemName: "",
      hsnSac: "",
      supplierPartNo: "",
      custDescription: "",
      cutWidth: 1,
      length: 1,
      batchNo: `B-${Date.now().toString().slice(-6)}-${seq}`,
      mrp: autoMrp(""),
      quantity: 1,
      unit: "pcs",
      discount: 0,
    };
  }

  // Quote metadata
  const [quoteNo] = useState(() => `Q-${Date.now().toString().slice(-8)}`);
  const [date] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [time] = useState(() => dayjs().format("HH:mm:ss"));

  // Issuer static details
  const issuer = {
    name: "Lakhotia",
    address: "64/3A Sidco Industrial Estate, Ambatur, Chennai",
    phone: "7845663338",
    email: "vivek@lakhotia.net",
    gstin: "33AABFL9981E1Z7",
    stateCode: "33-Tamil Nadu",
    placeOfSupply: "33-Tamil Nadu",
  };

  // Backend companies list
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [billTo, setBillTo] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactMob, setContactMob] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactEmailSame, setContactEmailSame] = useState(false);

  // Items state (initialized after idRef)
  const [items, setItems] = useState(() => [createEmptyItem(1)]);

  // Modal open
  const [modalOpen, setModalOpen] = useState(false);

  // DOM ref for invoice content to convert to PDF
  const invoiceRef = useRef(null);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        // 🔥 FIXED: Actual API URL
        const res = await axios.get("http://127.0.0.1:5000/api/company");

        if (Array.isArray(res.data)) setCompanies(res.data);
        else setCompanies([]);
      } catch (err) {
        console.error("fetch companies failed:", err.message || err);
        setCompanies([]);
      }
    };
    fetchCompanies();
  }, []);

  // When company selected, autofill data
  useEffect(() => {
    if (!selectedCompanyId) return;
    const c = companies.find((x) => Number(x.id) === Number(selectedCompanyId));
    if (!c) return;

    setBillTo(c.company_name || "");
    setContactPerson(c.customer_name || "");
    setContactMob(c.customer_mobile || "");
    setContactEmail(c.customer_email || "");
  }, [selectedCompanyId, companies]);

  useEffect(() => {
    if (contactEmailSame) setContactEmail(issuer.email);
  }, [contactEmailSame]);

  function autoMrp(partNo) {
    const lookup = { "SP-001": 120.0, "SP-002": 250.0 };
    if (partNo && lookup[partNo]) return lookup[partNo];
    return parseFloat((Math.random() * 200 + 20).toFixed(2));
  }

  function handleItemChange(index, field, value) {
    const copy = items.map((it) => ({ ...it }));
    let val = value;
    if (["cutWidth", "length", "mrp", "quantity", "discount"].includes(field)) {
      val = parseFloat(value || 0);
    }
    copy[index][field] = val;
    if (field === "supplierPartNo") {
      copy[index].mrp = autoMrp(val);
    }
    setItems(copy);
  }

  function addItem() {
    setItems((old) => [...old, createEmptyItem(old.length + 1)]);
  }

  function removeItem(index) {
    setItems((old) => old.filter((_, i) => i !== index));
  }

  const pricePerUnit = (it) => {
    const p = (parseFloat(it.mrp || 0) * parseFloat(it.cutWidth || 0)) || 0;
    return parseFloat(p.toFixed(2));
  };

  const amount = (it) => {
    const a = (parseFloat(it.quantity || 0) * pricePerUnit(it)) || 0;
    return parseFloat(a.toFixed(2));
  };

  const gstAmount = (it) => {
    const g = amount(it) * 0.18;
    return parseFloat(g.toFixed(2));
  };

  const totals = () => {
    const subtotal = items.reduce((s, it) => s + amount(it), 0);
    const gst = items.reduce((s, it) => s + gstAmount(it), 0);
    const discount = items.reduce((s, it) => s + (parseFloat(it.discount || 0)), 0);
    const grand = subtotal + gst - discount;
    return {
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      discount: discount.toFixed(2),
      grand: grand.toFixed(2),
    };
  };

  async function exportPdf() {
    if (!invoiceRef.current) return;
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${quoteNo}.pdf`);
  }

  async function saveDraft() {
    const payload = {
      quoteNo,
      date,
      time,
      issuer,
      companyId: selectedCompanyId,
      billTo,
      contactPerson,
      contactMob,
      contactEmail,
      items,
      totals: totals(),
    };
    try {
      console.log("Draft payload:", payload);
      alert("Draft logged to console. Replace with API call to save if needed.");
    } catch (err) {
      console.error("Save draft failed:", err);
      alert("Save failed - see console.");
    }
  }

  // ----------------------------------------------------
  // STYLES + JSX (UNCHANGED)
  // ----------------------------------------------------

  const styles = {
    root: { fontFamily: "Arial, Helvetica, sans-serif", padding: 18, color: "#222" },
    topActions: { marginBottom: 12 },
    btn: { background: "#f0f0f0", border: "1px solid #ccc", padding: "8px 12px", borderRadius: 4, cursor: "pointer", marginRight: 8 },
    primaryBtn: { background: "#1f6feb", color: "#fff", borderColor: "#165ec7" },
    dangerBtn: { background: "#e74c3c", color: "#fff", borderColor: "#c0392b" },
    modalBackdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    },
    modal: {
      width: "94%",
      maxWidth: 1120,
      maxHeight: "92vh",
      overflow: "auto",
      background: "#fff",
      borderRadius: 8,
      boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
      padding: 18,
    },
    modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    modalBody: { padding: "6px 0" },
    row: { display: "flex", flexDirection: "row" },
    col: { flex: 1 },
    gap: { gap: 18, display: "flex" },
    spaceBetween: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    card: { border: "1px solid #e6e6e6", padding: 12, borderRadius: 6, background: "#fafafa" },
    label: { display: "block", marginTop: 8, marginBottom: 6, fontWeight: 600, fontSize: 13 },
    input: { width: "100%", boxSizing: "border-box", padding: 8, border: "1px solid #d6d6d6", borderRadius: 4, fontSize: 14, marginBottom: 6 },
    textarea: { width: "100%", boxSizing: "border-box", padding: 8, border: "1px solid #d6d6d6", borderRadius: 4, fontSize: 14 },
    itemsTable: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    thtd: { border: "1px solid #ddd", padding: 8, verticalAlign: "middle", textAlign: "left" },
    mono: { fontFamily: "'Courier New', monospace", textAlign: "right" },
    totalsBox: { width: 320, border: "1px solid #e3e3e3", padding: 12, borderRadius: 6, background: "#fff" },
    small: { fontSize: 12, color: "#444" },
    note: { marginTop: 14, color: "#666", fontSize: 14 },
  };

  return (
    <div style={styles.root}>
      <div style={styles.topActions}>
        <button
          style={{ ...styles.btn, ...styles.primaryBtn }}
          onClick={() => setModalOpen(true)}
        >
          New Quote / Invoice
        </button>
      </div>

      {!modalOpen && (
        <div style={styles.note}>
          Click <strong>New Quote / Invoice</strong> to open the popup. Companies are loaded from <code>GET /company</code>.
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Create Quote / Invoice</h3>
              <div>
                <button
                  style={{ ...styles.btn }}
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={styles.modalBody} ref={invoiceRef}>
              {/* issuer + meta */}
              <div style={{ ...styles.row, justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ maxWidth: 520 }}>
                  <h2 style={{ margin: 0 }}>{issuer.name}</h2>
                  <div style={styles.small}>{issuer.address}</div>
                  <div style={styles.small}>Phone: {issuer.phone} | Email: {issuer.email}</div>
                  <div style={styles.small}>GSTIN: {issuer.gstin}</div>
                  <div style={styles.small}>State: {issuer.stateCode}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div><strong>Quote No:</strong> {quoteNo}</div>
                  <div><strong>Date:</strong> {date}</div>
                  <div><strong>Time:</strong> {time}</div>
                  <div><strong>Place of Supply:</strong> {issuer.placeOfSupply}</div>
                </div>
              </div>

              {/* contact + billto */}
              <div style={{ marginTop: 12, ...styles.card }}>
                <div style={{ display: "flex", gap: 18 }}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Select Company (from backend)</label>

                    {/* 🔥 Company dropdown now works */}
                    <select
                      style={styles.input}
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                    >
                      <option value="">-- Choose company --</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name} ({c.customer_name}) - {c.customer_mobile}
                        </option>
                      ))}
                    </select>

                    <label style={styles.label}>Contact Person</label>
                    <input style={styles.input} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />

                    <label style={styles.label}>Contact Mobile</label>
                    <input style={styles.input} value={contactMob} onChange={(e) => setContactMob(e.target.value)} />

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <input type="checkbox" id="sameEmail" checked={contactEmailSame} onChange={(e) => setContactEmailSame(e.target.checked)} />
                      <label htmlFor="sameEmail" style={styles.small}>Use issuer email for contact</label>
                    </div>

                    <label style={styles.label}>Contact Email</label>
                    <input style={styles.input} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Bill To (Company)</label>
                    <input style={styles.input} value={billTo} onChange={(e) => setBillTo(e.target.value)} />

                    <label style={{ ...styles.label, marginTop: 6 }}>Bill To Contact No</label>
                    <input style={{ ...styles.input, background: "#f6f6f6" }} value={contactMob} readOnly />

                    <label style={styles.label}>Notes</label>
                    <textarea style={{ ...styles.textarea, height: 96 }} defaultValue={`Note the created address: ${issuer.address}\nGSTIN: ${issuer.gstin}`} />
                  </div>
                </div>
              </div>

              {/* Item table */}
              <div style={{ marginTop: 12, ...styles.card }}>
                <div style={{ overflowX: "auto", marginTop: 6 }}>
                  <table style={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th style={styles.thtd}>#</th>
                        <th style={styles.thtd}>Item name</th>
                        <th style={styles.thtd}>Hsn/Sac</th>
                        <th style={styles.thtd}>Supplier Part no</th>
                        <th style={styles.thtd}>Customer Description</th>
                        <th style={styles.thtd}>Cut Width</th>
                        <th style={styles.thtd}>Length</th>
                        <th style={styles.thtd}>Batch No</th>
                        <th style={styles.thtd}>MRP</th>
                        <th style={styles.thtd}>Qty</th>
                        <th style={styles.thtd}>Unit</th>
                        <th style={styles.thtd}>Price/unit</th>
                        <th style={styles.thtd}>Discount</th>
                        <th style={styles.thtd}>GST(18%)</th>
                        <th style={styles.thtd}>Amount</th>
                        <th style={styles.thtd}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={it.id}>
                          <td style={styles.thtd}>{idx + 1}</td>

                          <td style={styles.thtd}>
                            <input style={styles.input} value={it.itemName} onChange={(e) => handleItemChange(idx, "itemName", e.target.value)} />
                          </td>

                          <td style={styles.thtd}>
                            <input style={styles.input} value={it.hsnSac} onChange={(e) => handleItemChange(idx, "hsnSac", e.target.value)} />
                          </td>

                          <td style={styles.thtd}>
                            <input style={styles.input} value={it.supplierPartNo} onChange={(e) => handleItemChange(idx, "supplierPartNo", e.target.value)} />
                          </td>

                          <td style={styles.thtd}>
                            <input style={styles.input} value={it.custDescription} onChange={(e) => handleItemChange(idx, "custDescription", e.target.value)} />
                          </td>

                          <td style={styles.thtd}>
                            <input type="number" style={styles.input} value={it.cutWidth} onChange={(e) => handleItemChange(idx, "cutWidth", e.target.value)} />
                          </td>

                          <td style={styles.thtd}>
                            <input type="number" style={styles.input} value={it.length} onChange={(e) => handleItemChange(idx, "length", e.target.value)} />
                          </td>

                          <td style={styles.thtd}>
                            <input readOnly style={{ ...styles.input, background: "#f6f6f6" }} value={it.batchNo} />
                          </td>

                          <td style={styles.thtd}>
                            <input type="number" style={styles.input} value={it.mrp} onChange={(e) => handleItemChange(idx, "mrp", e.target.value)} />
                          </td>

                          <td style={styles.thtd}>
                            <input type="number" style={styles.input} value={it.quantity} onChange={(e) => handleItemChange(idx, "quantity", e.target.value)} />
                          </td>

                          <td style={styles.thtd}>
                            <input readOnly style={{ ...styles.input, background: "#f6f6f6" }} value={it.unit} />
                          </td>

                          <td style={{ ...styles.thtd, textAlign: "right" }}>
                            {pricePerUnit(it).toFixed(2)}
                          </td>

                          <td style={styles.thtd}>
                            <input type="number" style={styles.input} value={it.discount} onChange={(e) => handleItemChange(idx, "discount", e.target.value)} />
                          </td>

                          <td style={{ ...styles.thtd, textAlign: "right" }}>
                            {gstAmount(it).toFixed(2)}
                          </td>

                          <td style={{ ...styles.thtd, textAlign: "right" }}>
                            {amount(it).toFixed(2)}
                          </td>

                          <td style={styles.thtd}>
                            <button style={{ ...styles.btn, ...styles.dangerBtn }} onClick={() => removeItem(idx)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "flex-start" }}>
                  <div>
                    <button style={styles.btn} onClick={addItem}>Add Item</button>
                  </div>

                  <div style={styles.totalsBox}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Subtotal</span><strong>{totals().subtotal}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Total GST (18%)</span><strong>{totals().gst}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Total Discount</span><strong>- {totals().discount}</strong>
                    </div>
                    <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
                      <span>Grand Total</span><strong>{totals().grand}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button style={{ ...styles.btn, ...styles.primaryBtn }} onClick={exportPdf}>Export PDF</button>
                  <button style={styles.btn} onClick={saveDraft}>Save Draft</button>
                  <button style={styles.btn} onClick={() => setModalOpen(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
