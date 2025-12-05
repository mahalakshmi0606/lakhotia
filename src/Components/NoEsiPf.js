// CasualLabourSalaryReport.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_SAVE = "http://127.0.0.1:5000/api/salary/noesi/save";
const API_FETCH = "http://127.0.0.1:5000/api/salary/noesi";

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

  /* -----------------------------------------------------------
     NEW FUNCTION: Get Previous Month
  ----------------------------------------------------------- */
  const getPreviousMonth = (m, y) => {
    if (m === 1) return { month: 12, year: y - 1 };
    return { month: m - 1, year: y };
  };

  /* -----------------------------------------------------------
     NEW FUNCTION: Fetch nearest previous month salary
  ----------------------------------------------------------- */
  const fetchPreviousMonthSalary = async (selectedMonth, selectedYear) => {
    let m = Number(selectedMonth);
    let y = Number(selectedYear);

    for (let i = 0; i < 12; i++) {
      const { month: prevMonth, year: prevYear } = getPreviousMonth(m, y);

      try {
        const res = await axios.get(API_FETCH, {
          params: { month: prevMonth, year: prevYear },
        });

        if (res.data.length > 0) {
          console.log("Found previous salary in:", prevMonth, prevYear);

          const newSalaryInputs = {};
          res.data.forEach((row) => {
            newSalaryInputs[row.email] = parseFloat(row.salary);
          });

          setSalaryInputs((prev) => ({ ...prev, ...newSalaryInputs }));
          return; // Stop searching further
        }
      } catch (e) {
        console.error("Error fetching previous salary", e);
      }

      m = prevMonth;
      y = prevYear;
    }
  };

  /* -----------------------------------------------------------
     Fetch employees - No ESI/PF
  ----------------------------------------------------------- */
  const fetchCasualEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://127.0.0.1:5000/api/employee/all");

      const filtered = res.data.filter(
        (emp) => emp.esiPfStatus === "No ESI/PF"
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

  /* -----------------------------------------------------------
     Fetch attendance summary
  ----------------------------------------------------------- */
  const fetchAttendanceSummary = async () => {
    if (!month || !year) return;
    try {
      const res = await axios.get(
        "http://127.0.0.1:5000/api/attendance/summary",
        {
          params: { month, year },
        }
      );

      const leaveData = res.data.map((a) => ({
        email: a.email,
        leave: a.absent || 0,
      }));

      setAttendanceData(leaveData);
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
    }
  };

  /* -----------------------------------------------------------
     Fetch loans
  ----------------------------------------------------------- */
  const fetchLoans = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/loan/all");
      const loanData = {};

      res.data.forEach((loan) => {
        loanData[loan.email] = parseFloat(loan.amount || 0);
      });

      setLoans(loanData);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  /* -----------------------------------------------------------
     ON PAGE LOAD
  ----------------------------------------------------------- */
  useEffect(() => {
    fetchCasualEmployees();
    fetchLoans();
  }, []);

  /* -----------------------------------------------------------
     ON MONTH/YEAR CHANGE → Fetch attendance + previous salaries
  ----------------------------------------------------------- */
  useEffect(() => {
    if (month && year) {
      fetchAttendanceSummary();
      fetchPreviousMonthSalary(month, year); // New auto-previous salary loader
    }
  }, [month, year]);

  /* -----------------------------------------------------------
     Input Handlers
  ----------------------------------------------------------- */
  const handleSalaryInput = (email, value) => {
    setSalaryInputs((prev) => ({
      ...prev,
      [email]: parseFloat(value) || 0,
    }));
  };

  const handleGraceInput = (email, value) => {
    setGraceDays((prev) => ({
      ...prev,
      [email]: parseFloat(value) || 0,
    }));
  };

  /* -----------------------------------------------------------
     Calculate Salaries
  ----------------------------------------------------------- */
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

      const workingDays = 32;
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

  /* -----------------------------------------------------------
     SAVE REPORT
  ----------------------------------------------------------- */
  const saveReport = async () => {
    if (!calculated) return alert("Please calculate first!");
    if (!month || !year) return alert("Select month & year!");

    try {
      await axios.post(API_SAVE, { month, year, records });
      alert("Report saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving report");
    }
  };

  /* -----------------------------------------------------------
     LOAD SAVED REPORT
  ----------------------------------------------------------- */
  const loadSavedReport = async () => {
    if (!month || !year) return alert("Select month & year!");

    try {
      const res = await axios.get(API_FETCH, { params: { month, year } });

      if (res.data.length === 0) {
        alert("No saved report for this month & year");
        return;
      }

      setRecords(res.data);
      setCalculated(true);

      alert("Saved report loaded!");
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Error loading saved report");
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>👷 No ESI/PF Salary Report</h2>

      <div style={styles.controls}>
        {/* Month */}
        <div>
          <label style={styles.label}>Month</label>
          <select
            style={styles.select}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">Select Month</option>
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label style={styles.label}>Year</label>
          <select
            style={styles.select}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>

        <button style={styles.calcBtn} onClick={calculateSalaries}>
          Calculate
        </button>

        <button style={styles.loadBtn} onClick={loadSavedReport}>
          Load Saved Report
        </button>

        <button style={styles.saveBtn} onClick={saveReport}>
          Save Report
        </button>
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
                <tr key={idx} style={styles.tr}>
                  <td style={styles.tdCenter}>{idx + 1}</td>
                  <td style={styles.td}>{rec.name}</td>
                  <td style={styles.td}>{rec.email}</td>
                  <td style={styles.tdCenter}>{rec.leave}</td>

                  <td style={styles.tdCenter}>
                    <input
                      type="number"
                      value={graceDays[rec.email] ?? rec.grace ?? ""}
                      onChange={(e) =>
                        handleGraceInput(rec.email, e.target.value)
                      }
                      style={styles.smallInput}
                    />
                  </td>

                  <td style={styles.tdCenter}>{rec.workingDays}</td>
                  <td style={styles.tdCenter}>{rec.presentDays}</td>

                  <td style={styles.tdCenter}>
                    <input
                      type="number"
                      value={salaryInputs[rec.email] ?? rec.salaryInput ?? ""}
                      onChange={(e) =>
                        handleSalaryInput(rec.email, e.target.value)
                      }
                      style={styles.smallInput}
                    />
                  </td>

                  <td style={styles.tdRight}>{rec.salaryPayable}</td>
                  <td style={styles.tdRight}>{rec.loan}</td>
                  <td
                    style={{
                      ...styles.tdRight,
                      color: "green",
                      fontWeight: 700,
                    }}
                  >
                    {rec.netSalary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.hint}>Select month & year then click Calculate.</div>
      )}
    </div>
  );
};

/* ------------ STYLES ------------ */
const styles = {
  page: {
    padding: 24,
    background: "#f6f7fb",
    minHeight: "100vh",
    fontFamily: "Inter",
  },
  title: {
    textAlign: "center",
    marginBottom: 15,
  },
  controls: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  label: { marginBottom: 6, fontSize: 13 },
  select: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
  },
  calcBtn: {
    padding: "10px 18px",
    background: "#2563eb",
    color: "white",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "10px 18px",
    background: "green",
    color: "white",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  loadBtn: {
    padding: "10px 18px",
    background: "#444",
    color: "white",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  tableWrap: {
    background: "#fff",
    padding: 12,
    borderRadius: 8,
    overflowX: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: 10,
    background: "#1a1a1a",
    color: "white",
  },
  td: {
    padding: 10,
  },
  tdCenter: {
    padding: 10,
    textAlign: "center",
  },
  tdRight: {
    padding: 10,
    textAlign: "right",
  },
  tr: {
    borderBottom: "1px solid #ddd",
  },
  smallInput: {
    width: 90,
    padding: 6,
  },
  hint: {
    textAlign: "center",
    marginTop: 15,
  },
};

export default CasualLabourSalaryReport;
