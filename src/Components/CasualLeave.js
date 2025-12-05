// CasualLabourSalaryReport.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_FETCH_EMP = "http://127.0.0.1:5000/api/employee/all";
const API_FETCH_ATT = "http://127.0.0.1:5000/api/attendance/summary";
const API_FETCH_LOAN = "http://127.0.0.1:5000/api/advance";  // UPDATED ✔

// 🔥 UPDATED API — SAVE CASUAL SALARY
const API_SAVE_SALARY = "http://127.0.0.1:5000/api/casual/save"; // UPDATED ✔

// 🔥 UPDATED API — FETCH PRE-SAVED REPORT
const API_GET_SAVED = "http://127.0.0.1:5000/api/casual/fetch"; // UPDATED ✔

const CasualLabourSalaryReport = () => {
  const [records, setRecords] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const [salaryInputs, setSalaryInputs] = useState({});
  const [graceDays, setGraceDays] = useState({});
  const [loans, setLoans] = useState({});

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  // -------------------------------------------------------------
  // FETCH SAVED CASUAL SALARY REPORT — UPDATED URL ✔
  // -------------------------------------------------------------
  const fetchSavedReport = async () => {
    if (!month || !year) return;
    try {
      const res = await axios.get(API_GET_SAVED, {
        params: { month, year },
      });

      if (res.data.length > 0) {
        setRecords(res.data);
        setCalculated(true);
      }
    } catch (e) {
      console.log("No saved report found");
    }
  };

  // -------------------------------------------------------------
  // Fetch Casual Labour Employees
  // -------------------------------------------------------------
  const fetchCasualEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_FETCH_EMP);
      const filtered = res.data.filter(
        (emp) => emp.esiPfStatus === "Casual Labour"
      );

      setRecords(filtered);

      const initSalary = {};
      filtered.forEach((emp) => {
        initSalary[emp.email] = parseFloat(emp.salary || 0);
      });
      setSalaryInputs(initSalary);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Fetch Attendance Summary
  // -------------------------------------------------------------
  const fetchAttendanceSummary = async () => {
    if (!month || !year) return;
    try {
      const res = await axios.get(API_FETCH_ATT, {
        params: { month, year },
      });
      const leaveData = res.data.map((a) => ({
        email: a.email,
        leave: a.absent || 0,
      }));
      setAttendanceData(leaveData);
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
    }
  };

  // -------------------------------------------------------------
  // Fetch Loans — UPDATED URL ✔
  // -------------------------------------------------------------
  const fetchLoans = async () => {
    try {
      const res = await axios.get(API_FETCH_LOAN);
      const loanData = {};
      res.data.forEach((loan) => {
        loanData[loan.email] = parseFloat(loan.amount || 0);
      });
      setLoans(loanData);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  useEffect(() => {
    fetchCasualEmployees();
    fetchLoans();
  }, []);

  useEffect(() => {
    fetchAttendanceSummary();
    fetchSavedReport();
  }, [month, year]);

  // -------------------------------------------------------------
  // Input Handlers
  // -------------------------------------------------------------
  const handleSalaryInput = (email, value) => {
    setSalaryInputs((prev) => ({ ...prev, [email]: parseFloat(value) || 0 }));
  };
  const handleGraceInput = (email, value) => {
    setGraceDays((prev) => ({ ...prev, [email]: parseFloat(value) || 0 }));
  };

  // -------------------------------------------------------------
  // Main Calculation
  // -------------------------------------------------------------
  const calculateSalaries = () => {
    if (!month || !year) {
      alert("Please select month and year");
      return;
    }

    const updated = records.map((rec) => {
      const leaveObj = attendanceData.find((a) => a.email === rec.email);
      let leave = leaveObj ? Number(leaveObj.leave) : 0;

      const grace = Number(graceDays[rec.email] || 0);
      leave = Math.max(0, leave - grace);

      const workingDays = 30;
      const presentDays = workingDays - leave;

      const salaryInput = Number(salaryInputs[rec.email] || rec.salary || 0);
      const salaryPayable = (presentDays / workingDays) * salaryInput;

      const loan = Number(loans[rec.email] || 0);
      const netSalary = salaryPayable - loan;

      return {
        ...rec,
        leave,
        grace,
        workingDays,
        presentDays,
        salaryInput: salaryInput.toFixed(2),
        salaryPayable: salaryPayable.toFixed(2),
        loan: loan.toFixed(2),
        netSalary: netSalary.toFixed(2),
      };
    });

    setRecords(updated);
    setCalculated(true);
  };

  // -------------------------------------------------------------
  // Save Salary Report — UPDATED URL ✔
  // -------------------------------------------------------------
  const saveReport = async () => {
    try {
      const payload = {
        month,
        year,
        records,
      };

      await axios.post(API_SAVE_SALARY, payload);
      alert("Salary report saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save salary report");
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>👷 Casual Labour Salary Report</h2>

      <div style={styles.controls}>
        <div>
          <label style={styles.label}>Month</label>
          <select
            style={styles.select}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">Select Month</option>
            {[
              "January","February","March","April","May","June",
              "July","August","September","October","November","December",
            ].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={styles.label}>Year</label>
          <select
            style={styles.select}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">Select Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={styles.calcBtn} onClick={calculateSalaries}>
            Calculate
          </button>

          {calculated && (
            <button style={styles.saveBtn} onClick={saveReport}>
              Save Report
            </button>
          )}
        </div>
      </div>

      {calculated ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>S.No</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Leave</th>
                <th style={styles.th}>Grace (+)</th>
                <th style={styles.th}>Working Days</th>
                <th style={styles.th}>Present Days</th>
                <th style={styles.th}>Salary</th>
                <th style={styles.th}>Salary Payable</th>
                <th style={styles.th}>Loan</th>
                <th style={styles.th}>Net Salary</th>
              </tr>
            </thead>

            <tbody>
              {records.map((rec, idx) => (
                <tr key={rec.email || idx} style={styles.tr}>
                  <td style={styles.tdCenter}>{idx + 1}</td>
                  <td style={styles.td}>{rec.name}</td>
                  <td style={styles.td}>{rec.email}</td>
                  <td style={styles.tdCenter}>{rec.leave ?? 0}</td>

                  <td style={styles.tdCenter}>
                    <input
                      type="number"
                      value={graceDays[rec.email] ?? ""}
                      onChange={(e) => handleGraceInput(rec.email, e.target.value)}
                      style={styles.smallInput}
                      placeholder="0"
                    />
                  </td>

                  <td style={styles.tdCenter}>{rec.workingDays ?? 30}</td>
                  <td style={styles.tdCenter}>{rec.presentDays ?? (30 - (rec.leave || 0))}</td>

                  <td style={styles.tdCenter}>
                    <input
                      type="number"
                      value={salaryInputs[rec.email] ?? ""}
                      onChange={(e) => handleSalaryInput(rec.email, e.target.value)}
                      style={styles.smallInput}
                      placeholder="0.00"
                    />
                  </td>

                  <td style={styles.tdRight}>{rec.salaryPayable ?? "-"}</td>
                  <td style={styles.tdRight}>{rec.loan ?? (loans[rec.email] ?? "0.00")}</td>
                  <td style={{ ...styles.tdRight, color: "#1b8f3b", fontWeight: 700 }}>
                    {rec.netSalary ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.hint}>
          Select month & year, enter salary and grace days, then click <b>Calculate</b>.
        </div>
      )}
    </div>
  );
};

/* ------------ Styles ------------ */
const styles = {
  page: {
    padding: 24,
    background: "#f5f7fb",
    minHeight: "100vh",
  },
  title: {
    textAlign: "center",
    marginBottom: 18,
    color: "#243447",
  },
  controls: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  label: { display: "block", marginBottom: 6, fontSize: 13 },
  select: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #d0d6de",
    minWidth: 160,
    background: "#fff",
  },
  calcBtn: {
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  saveBtn: {
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  tableWrap: {
    overflowX: "auto",
    background: "#fff",
    borderRadius: 10,
    padding: 12,
    boxShadow: "0 8px 24px rgba(35,54,90,0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1100,
  },
  th: {
    padding: "10px 12px",
    background: "#0f1724",
    color: "#fff",
    textAlign: "center",
  },
  tr: {
    borderBottom: "1px solid #eef2f6",
  },
  td: { padding: "10px 12px" },
  tdCenter: { padding: "10px 12px", textAlign: "center" },
  tdRight: { padding: "10px 12px", textAlign: "right" },
  smallInput: {
    width: 90,
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    textAlign: "right",
  },
  hint: {
    textAlign: "center",
    color: "#475569",
    marginTop: 16,
  },
};

export default CasualLabourSalaryReport;
