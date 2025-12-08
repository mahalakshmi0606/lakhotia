// === GRNPage.jsx (UPDATED: COMPANY NAME + SEARCH + VIEW POPUP) ===

import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEye } from "react-icons/fa";

const GRNPage = () => {
  const todayDate = new Date().toISOString().slice(0, 10);

  // --------------------------------------------------
  // FORM STATE
  // --------------------------------------------------
  const [formData, setFormData] = useState({
    company_name: "",
    customer_name: "",
    item_name: "",
    brand: "",
    length: "",
    width: "",
    buy_price: "",
    batch_code: "",
    invoice_number: "",
    invoice_date: todayDate,
    customer_part_no: "",
    customer_description: "",
  });

  // --------------------------------------------------
  // STATES
  // --------------------------------------------------
  const [stockData, setStockData] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [companyList, setCompanyList] = useState([]);
  const [filteredCompany, setFilteredCompany] = useState([]);
  const [filteredCustomer, setFilteredCustomer] = useState([]);

  const [grnList, setGrnList] = useState([]);
  const [tempItems, setTempItems] = useState([]);

  const [openPopup, setOpenPopup] = useState(false);
  const [viewData, setViewData] = useState(null);

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------
  useEffect(() => {
    fetchStock();
    fetchGRN();
    fetchCompanies();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/stock/all");
      if (res.data.success) setStockData(res.data.data);
    } catch (err) {
      console.log("Error loading stock", err);
    }
  };

  const fetchGRN = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/grn/all");
      if (res.data.success) setGrnList(res.data.data);
    } catch (err) {
      console.log("Error loading GRN", err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get("http://localhost:5000/company");
      setCompanyList(res.data);
    } catch (err) {
      console.log("Error fetching company list", err);
    }
  };

  // --------------------------------------------------
  // TYPING SEARCH
  // --------------------------------------------------

  // --- ITEM SEARCH ---
  const handleItemTyping = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, item_name: value });

    if (!value) return setFilteredItems([]);

    const results = stockData.filter((x) =>
      x["Item Name"].toLowerCase().includes(value.toLowerCase())
    );

    setFilteredItems(results);
  };

  const handleSuggestionSelect = (item) => {
    setFormData({
      ...formData,
      item_name: item["Item Name"],
      brand: item.Brand,
    });
    setFilteredItems([]);
    generateBatchCode(item.Brand);
  };

  // --- COMPANY SEARCH ---
  const handleCompanyTyping = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, company_name: value });

    if (!value) return setFilteredCompany([]);

    const results = companyList.filter((c) =>
      c.company_name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredCompany(results);
  };

  const selectCompany = (company) => {
    setFormData({
      ...formData,
      company_name: company.company_name,
      customer_name: company.customer_name,
    });
    setFilteredCompany([]);
  };

  // --- CUSTOMER SEARCH ---
  const handleCustomerTyping = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, customer_name: value });

    if (!value) return setFilteredCustomer([]);

    const results = companyList.filter((c) =>
      c.customer_name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredCustomer(results);
  };

  const selectCustomer = (company) => {
    setFormData({
      ...formData,
      customer_name: company.customer_name,
      company_name: company.company_name,
    });
    setFilteredCustomer([]);
  };

  // --------------------------------------------------
  // BATCH CODE GENERATION
  // --------------------------------------------------
  const generateBatchCode = (brandValue) => {
    if (!brandValue) return;

    const brand = brandValue.substring(0, 3).toUpperCase();

    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, "0") +
      String(today.getDate()).padStart(2, "0");

    let count = grnList.filter((g) =>
      g.batch_code?.startsWith(`${brand}-${dateStr}`)
    ).length;

    count++;

    setFormData({
      ...formData,
      batch_code: `${brand}-${dateStr}-${count}`,
    });
  };

  // --------------------------------------------------
  // INPUT CHANGE HANDLER
  // --------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "brand") {
      setFormData({ ...formData, brand: value });
      if (value.length >= 3) generateBatchCode(value);
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  // --------------------------------------------------
  // ADD ITEM TO TEMP
  // --------------------------------------------------
  const handleNext = () => {
    if (!formData.item_name || !formData.brand || !formData.length) {
      toast.error("Please fill required fields!");
      return;
    }

    setTempItems([...tempItems, formData]);

    setFormData({
      ...formData,
      item_name: "",
      brand: "",
      length: "",
      width: "",
      buy_price: "",
      batch_code: "",
    });
  };

  // --------------------------------------------------
  // SUBMIT ALL ITEMS
  // --------------------------------------------------
  const handleSubmitAll = async () => {
    if (tempItems.length === 0) {
      toast.error("No items added!");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/grn/save-multiple", {
        company_name: formData.company_name,
        customer_name: formData.customer_name,
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        customer_part_no: formData.customer_part_no,
        customer_description: formData.customer_description,
        items: tempItems,
      });

      toast.success("GRN Saved!");
      setTempItems([]);
      fetchGRN();
      setOpenPopup(false);
    } catch (err) {
      toast.error("Error saving GRN");
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="container mt-4">
      <ToastContainer />

      <h2 className="text-center mb-4 fw-bold">GRN Management</h2>

      <button className="btn btn-success mb-3" onClick={() => setOpenPopup(true)}>
        + Add GRN
      </button>

      {/* --------------------------------------------------
          POPUP
      -------------------------------------------------- */}
      {openPopup && (
        <div className="modal fade show d-block" style={{ background: "#0005" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">New GRN Entry</h5>
                <button className="btn-close" onClick={() => setOpenPopup(false)} />
              </div>

              <div className="modal-body">
                {/* FORM */}
                <div className="row g-3">

                  {/* COMPANY NAME */}
                  <div className="col-md-6 position-relative">
                    <label className="fw-bold">Company Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleCompanyTyping}
                      placeholder="Search company"
                    />
                    {filteredCompany.length > 0 && (
                      <div className="list-group position-absolute w-100">
                        {filteredCompany.map((c, i) => (
                          <button
                            key={i}
                            className="list-group-item list-group-item-action"
                            onClick={() => selectCompany(c)}
                          >
                            {c.company_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CUSTOMER NAME */}
                  <div className="col-md-6 position-relative">
                    <label className="fw-bold">Customer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleCustomerTyping}
                      placeholder="Search customer"
                    />
                    {filteredCustomer.length > 0 && (
                      <div className="list-group position-absolute w-100">
                        {filteredCustomer.map((c, i) => (
                          <button
                            key={i}
                            className="list-group-item list-group-item-action"
                            onClick={() => selectCustomer(c)}
                          >
                            {c.customer_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* INVOICE */}
                  <div className="col-md-4">
                    <label className="fw-bold">Invoice Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="invoice_number"
                      value={formData.invoice_number}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="fw-bold">Invoice Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="invoice_date"
                      value={formData.invoice_date}
                      readOnly
                    />
                  </div>

                  {/* PART + DESC */}
                  <div className="col-md-6">
                    <label className="fw-bold">Customer Part No</label>
                    <input
                      type="text"
                      className="form-control"
                      name="customer_part_no"
                      value={formData.customer_part_no}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold">Customer Description</label>
                    <input
                      type="text"
                      className="form-control"
                      name="customer_description"
                      value={formData.customer_description}
                      onChange={handleChange}
                    />
                  </div>

                  {/* ITEM SEARCH */}
                  <div className="col-md-6 position-relative">
                    <label className="fw-bold">Item Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="item_name"
                      value={formData.item_name}
                      onChange={handleItemTyping}
                      placeholder="Search item"
                    />
                    {filteredItems.length > 0 && (
                      <div className="list-group position-absolute w-100">
                        {filteredItems.map((item, i) => (
                          <button
                            key={i}
                            className="list-group-item list-group-item-action"
                            onClick={() => handleSuggestionSelect(item)}
                          >
                            {item["Item Name"]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* BRAND */}
                  <div className="col-md-6">
                    <label className="fw-bold">Brand</label>
                    <input
                      type="text"
                      className="form-control"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                    />
                  </div>

                  {/* LENGTH */}
                  <div className="col-md-6">
                    <label className="fw-bold">Length</label>
                    <input
                      type="text"
                      className="form-control"
                      name="length"
                      value={formData.length}
                      onChange={handleChange}
                    />
                  </div>

                  {/* WIDTH */}
                  <div className="col-md-6">
                    <label className="fw-bold">Width</label>
                    <input
                      type="text"
                      className="form-control"
                      name="width"
                      value={formData.width}
                      onChange={handleChange}
                    />
                  </div>

                  {/* PRICE */}
                  <div className="col-md-6">
                    <label className="fw-bold">Buy Price</label>
                    <input
                      type="text"
                      className="form-control"
                      name="buy_price"
                      value={formData.buy_price}
                      onChange={handleChange}
                    />
                  </div>

                  {/* BATCH */}
                  <div className="col-md-6">
                    <label className="fw-bold">Batch Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="batch_code"
                      value={formData.batch_code}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="mt-4 d-flex justify-content-between">
                  <button className="btn btn-info" onClick={handleNext}>
                    Next ➜ Add Item
                  </button>
                  <button className="btn btn-success" onClick={handleSubmitAll}>
                    Submit All
                  </button>
                  <button className="btn btn-secondary" onClick={() => setOpenPopup(false)}>
                    Cancel
                  </button>
                </div>

                {/* PREVIEW TABLE */}
                <h5 className="mt-4 fw-bold">Preview Items</h5>
                <div className="table-responsive">
                  <table className="table table-bordered mt-3">
                    <thead className="table-dark">
                      <tr>
                        <th>Item</th>
                        <th>Brand</th>
                        <th>Length</th>
                        <th>Width</th>
                        <th>Price</th>
                        <th>Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempItems.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No Items Added
                          </td>
                        </tr>
                      ) : (
                        tempItems.map((row, i) => (
                          <tr key={i}>
                            <td>{row.item_name}</td>
                            <td>{row.brand}</td>
                            <td>{row.length}</td>
                            <td>{row.width}</td>
                            <td>{row.buy_price}</td>
                            <td>{row.batch_code}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------
          VIEW POPUP
      -------------------------------------------------- */}
      {viewData && (
        <div className="modal fade show d-block" style={{ background: "#0005" }}>
          <div className="modal-dialog">
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">GRN Details</h5>
                <button className="btn-close" onClick={() => setViewData(null)} />
              </div>

              <div className="modal-body">
                <div className="card shadow p-3">
                  <h5 className="fw-bold text-primary">{viewData.item_name}</h5>

                  <p><b>Company:</b> {viewData.company_name}</p>
                  <p><b>Customer:</b> {viewData.customer_name}</p>

                  <p><b>Invoice:</b> {viewData.invoice_number}</p>
                  <p><b>Date:</b> {viewData.invoice_date?.slice(0, 10)}</p>

                  <p><b>Part No:</b> {viewData.customer_part_no}</p>
                  <p><b>Description:</b> {viewData.customer_description}</p>

                  <p><b>Brand:</b> {viewData.brand}</p>
                  <p><b>Length:</b> {viewData.length}</p>
                  <p><b>Width:</b> {viewData.width}</p>
                  <p><b>Price:</b> {viewData.buy_price}</p>
                  <p><b>Batch:</b> {viewData.batch_code}</p>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-danger" onClick={() => setViewData(null)}>
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------
          GRN TABLE LIST
      -------------------------------------------------- */}
      <h4 className="mt-4 fw-bold">GRN List</h4>

      <div className="table-responsive">
        <table className="table table-striped table-bordered mt-3">
          <thead className="table-dark">
            <tr>
              <th>Company</th>
              <th>Customer</th>
              <th>Invoice</th>
              <th>Date</th>
              <th>Item</th>
              <th>Brand</th>
              <th>Length</th>
              <th>Width</th>
              <th>Price</th>
              <th>Batch</th>
              <th>View</th>
            </tr>
          </thead>

          <tbody>
            {grnList.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center">
                  No Records Found
                </td>
              </tr>
            ) : (
              grnList.map((row, i) => (
                <tr key={i}>
                  <td>{row.company_name}</td>
                  <td>{row.customer_name}</td>
                  <td>{row.invoice_number}</td>
                  <td>{row.invoice_date?.slice(0, 10)}</td>
                  <td>{row.item_name}</td>
                  <td>{row.brand}</td>
                  <td>{row.length}</td>
                  <td>{row.width}</td>
                  <td>{row.buy_price}</td>
                  <td>{row.batch_code}</td>
                  <td className="text-center">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => setViewData(row)}>
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GRNPage;
