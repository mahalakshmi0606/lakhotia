// SalaryReport.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_SAVE = "http://127.0.0.1:5000/api/salary/esipf/save";
const API_FETCH = "http://127.0.0.1:5000/api/salary/esipf/fetch";

const SalaryReport = () => {
  const [records, setRecords] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  // User input states
  const [salaryInputs, setSalaryInputs] = useState({});
  const [tdsValues, setTdsValues] = useState({});
  const [ptaxValues, setPtaxValues] = useState({});
  const [loans, setLoans] = useState({});
  const [graceDays, setGraceDays] = useState({});

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  // ---------------------------------------------------------
  // INPUT HANDLERS (Missing Earlier)
  // ---------------------------------------------------------
  const handleGraceInput = (email, value) => {
    setGraceDays((prev) => ({ ...prev, [email]: value }));
  };

  const handleSalaryInput = (email, value) => {
    setSalaryInputs((prev) => ({ ...prev, [email]: value }));
  };

  const handleTdsInput = (email, value) => {
    setTdsValues((prev) => ({ ...prev, [email]: value }));
  };

  const handlePtaxInput = (email, value) => {
    setPtaxValues((prev) => ({ ...prev, [email]: value }));
  };

  // ---------------------------------------------------------
  // Fetch eligible employees (ESI/PF)
  // ---------------------------------------------------------
  const fetchEligibleEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://127.0.0.1:5000/api/employee/all");
      const filtered = res.data.filter((emp) => emp.esiPfStatus === "ESI/PF");
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

  // ---------------------------------------------------------
  // Fetch attendance summary
  // ---------------------------------------------------------
  const fetchAttendanceSummary = async () => {
    if (!month || !year) return;
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/attendance/summary", {
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

  // ---------------------------------------------------------
  // Fetch loans
  // ---------------------------------------------------------
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

  useEffect(() => {
    fetchEligibleEmployees();
    fetchLoans();
  }, []);

  useEffect(() => {
    fetchAttendanceSummary();
    if (month && year) {
      fetchExistingSalary();
    }
  }, [month, year]);

  // ---------------------------------------------------------
  // Fetch existing saved salary
  // ---------------------------------------------------------
  const fetchExistingSalary = async () => {
    try {
      const res = await axios.get(API_FETCH, { params: { month, year } });

      if (res.data.length > 0) {
        setRecords(res.data);
        setCalculated(true);

        // Restore UI inputs
        const restoreSalaries = {};
        const restoreGrace = {};
        const restoreTds = {};
        const restorePtax = {};

        res.data.forEach((r) => {
          restoreSalaries[r.email] = r.salary_input;
          restoreGrace[r.email] = r.grace;
          restoreTds[r.email] = r.tds;
          restorePtax[r.email] = r.ptax;
        });

        setSalaryInputs(restoreSalaries);
        setGraceDays(restoreGrace);
        setTdsValues(restoreTds);
        setPtaxValues(restorePtax);
      }
    } catch (err) {
      console.error("Error fetching saved salary:", err);
    }
  };

  // ---------------------------------------------------------
  // Save salary
  // ---------------------------------------------------------
  const saveSalary = async () => {
    if (!calculated) {
      alert("Calculate salary first");
      return;
    }

    try {
      const payload = {
        month,
        year,
        records: records.map((r) => ({
          email: r.email,
          name: r.name,
          leave: r.leave,
          grace: r.grace,
          workingDays: r.workingDays,
          presentDays: r.presentDays,
          salaryInput: r.salaryInput,
          monthlySalary: r.monthlySalary,
          basic: r.basic,
          hra: r.hra,
          conv: r.conv,
          total: r.total,
          basicConv: r.basicConv,
          restrictedBasic: r.restrictedBasic,
          pf: r.pf,
          esi: r.esi,
          loan: r.loan,
          tds: r.tds,
          ptax: r.ptax,
          totalDed: r.totalDed,
          netSalary: r.netSalary,
        })),
      };

      const res = await axios.post(API_SAVE, payload);
      alert(res.data.message);
    } catch (err) {
      console.error("Error saving salary:", err);
      alert("Error saving salary");
    }
  };

  // ---------------------------------------------------------
  // Salary calculations
  // ---------------------------------------------------------
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
      const presentDays = 32 - leave;

      const salaryInput = Number(salaryInputs[rec.email] || rec.salary || 0);
      const monthlySalary = (salaryInput / 30) * presentDays;

      const basic = monthlySalary * 0.5;
      const hra = monthlySalary * 0.4;
      const conv = monthlySalary * 0.1;
      const total = basic + hra + conv;
      const basicConv = basic + conv;

      const restrictedBasic = basicConv > 15000 ? 15000 : basicConv;
      const pf = restrictedBasic * 0.12;
      const esi = total * 0.0075;

      const loan = Number(loans[rec.email] || 0);
      const tds = Number(tdsValues[rec.email] || 0);
      const ptax = Number(ptaxValues[rec.email] || 0);

      const totalDed = pf + esi + loan + tds + ptax;
      const netSalary = total - totalDed;

      return {
        ...rec,
        leave,
        grace,
        workingDays,
        presentDays,
        salaryInput: salaryInput.toFixed(2),
        monthlySalary: monthlySalary.toFixed(2),
        basic: basic.toFixed(2),
        hra: hra.toFixed(2),
        conv: conv.toFixed(2),
        total: total.toFixed(2),
        basicConv: basicConv.toFixed(2),
        restrictedBasic: restrictedBasic.toFixed(2),
        pf: pf.toFixed(2),
        esi: esi.toFixed(2),
        loan: loan.toFixed(2),
        tds: tds.toFixed(2),
        ptax: ptax.toFixed(2),
        totalDed: totalDed.toFixed(2),
        netSalary: netSalary.toFixed(2),
      };
    });

    setRecords(updated);
    setCalculated(true);
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>💼 ESI/PF Salary Report</h2>

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
              <option key={i} value={i + 1}>
                {m}
              </option>
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
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div style={{ alignSelf: "flex-end", display: "flex", gap: 10 }}>
          <button style={styles.calcBtn} onClick={calculateSalaries} disabled={loading}>
            Calculate
          </button>

          <button style={styles.saveBtn} onClick={saveSalary}>
            Save Salary
          </button>
        </div>
      </div>

      {calculated ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>S.No</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Leave</th>
                <th style={styles.th}>Grace (+)</th>
                <th style={styles.th}>Salary (Monthly)</th>
                <th style={styles.th}>Working Days</th>
                <th style={styles.th}>Present Days</th>
                <th style={styles.th}>Monthly (Prorated)</th>
                <th style={styles.th}>Basic (50%)</th>
                <th style={styles.th}>HRA (40%)</th>
                <th style={styles.th}>Conv (10%)</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Basic + Conv</th>
                <th style={styles.th}>Restricted Basic</th>
                <th style={styles.th}>PF (12%)</th>
                <th style={styles.th}>ESI (0.75%)</th>
                <th style={styles.th}>Loan</th>
                <th style={styles.th}>TDS</th>
                <th style={styles.th}>P-Tax</th>
                <th style={styles.th}>Total Deduction</th>
                <th style={styles.th}>Net Salary</th>
              </tr>
            </thead>

            <tbody>
              {records.map((rec, idx) => (
                <tr key={rec.email || idx} style={styles.tr}>
                  <td style={styles.tdCenter}>{idx + 1}</td>
                  <td style={styles.td}>{rec.name}</td>

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

                  <td style={styles.tdCenter}>
                    <input
                      type="number"
                      value={salaryInputs[rec.email] ?? ""}
                      onChange={(e) => handleSalaryInput(rec.email, e.target.value)}
                      style={styles.smallInput}
                      placeholder="0.00"
                    />
                  </td>

                  <td style={styles.tdCenter}>{rec.workingDays ?? 30}</td>
                  <td style={styles.tdCenter}>{rec.presentDays}</td>
                  <td style={styles.tdRight}>{rec.monthlySalary}</td>
                  <td style={styles.tdRight}>{rec.basic}</td>
                  <td style={styles.tdRight}>{rec.hra}</td>
                  <td style={styles.tdRight}>{rec.conv}</td>
                  <td style={styles.tdRight}>{rec.total}</td>
                  <td style={styles.tdRight}>{rec.basicConv}</td>
                  <td style={styles.tdRight}>{rec.restrictedBasic}</td>
                  <td style={styles.tdRight}>{rec.pf}</td>
                  <td style={styles.tdRight}>{rec.esi}</td>
                  <td style={styles.tdRight}>{rec.loan}</td>

                  <td style={styles.tdCenter}>
                    <input
                      type="number"
                      value={tdsValues[rec.email] ?? ""}
                      onChange={(e) => handleTdsInput(rec.email, e.target.value)}
                      style={styles.smallInput}
                      placeholder="0.00"
                    />
                  </td>

                  <td style={styles.tdCenter}>
                    <input
                      type="number"
                      value={ptaxValues[rec.email] ?? ""}
                      onChange={(e) => handlePtaxInput(rec.email, e.target.value)}
                      style={styles.smallInput}
                      placeholder="0.00"
                    />
                  </td>

                  <td style={styles.tdRight}>{rec.totalDed}</td>
                  <td style={{ ...styles.tdRight, color: "#1b8f3b", fontWeight: 700 }}>
                    {rec.netSalary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.hint}>
          Select month & year → Enter values → Click <b>Calculate</b>.
        </div>
      )}
    </div>
  );
};

/* ------------ Styles ------------ */
const styles = {
  page: { padding: 24, background: "#f5f7fb", minHeight: "100vh" },
  title: { textAlign: "center", marginBottom: 18, color: "#243447" },
  controls: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 18,
    flexWrap: "wrap",
  },
  label: { display: "block", marginBottom: 6 },
  select: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #d0d6de",
  },
  calcBtn: {
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "10px 18px",
    borderRadius: 8,
    background: "green",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  tableWrap: {
    overflowX: "auto",
    background: "#fff",
    borderRadius: 10,
    padding: 12,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "10px",
    textAlign: "center",
    background: "#0f1724",
    color: "#fff",
    position: "sticky",
    top: 0,
  },
  tr: { borderBottom: "1px solid #eef2f6" },
  td: { padding: "10px 12px" },
  tdCenter: { padding: "10px 12px", textAlign: "center" },
  tdRight: { padding: "10px 12px", textAlign: "right" },
  smallInput: {
    width: 90,
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #ccc",
    textAlign: "right",
  },
  hint: { textAlign: "center", marginTop: 16, color: "#475569" },
};

export default SalaryReport;
