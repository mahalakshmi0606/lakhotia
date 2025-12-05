import React from "react";

const Dashboard = () => {
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerSection}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Quick overview of key metrics</p>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={{ ...styles.kpiCard, backgroundColor: "#4caf50", color: "#fff" }}>
          <p style={styles.kpiLabel}>Total Employees</p>
          <h2 style={styles.kpiValue}>120</h2>
        </div>

        <div style={{ ...styles.kpiCard, backgroundColor: "#ff9800", color: "#fff" }}>
          <p style={styles.kpiLabel}>Pending Tasks</p>
          <h2 style={styles.kpiValue}>8</h2>
        </div>

        <div style={{ ...styles.kpiCard, backgroundColor: "#2196f3", color: "#fff" }}>
          <p style={styles.kpiLabel}>Attendance Rate</p>
          <h2 style={styles.kpiValue}>95%</h2>
        </div>

        <div style={{ ...styles.kpiCard, backgroundColor: "#f44336", color: "#fff" }}>
          <p style={styles.kpiLabel}>Leaves Taken</p>
          <h2 style={styles.kpiValue}>12</h2>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "Poppins, sans-serif",
    padding: "30px",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
  },
  headerSection: {
    marginBottom: "30px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#333",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    marginTop: "5px",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
  },
  kpiCard: {
    borderRadius: "12px",
    padding: "25px 20px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "transform 0.2s",
    cursor: "pointer",
  },
  kpiLabel: {
    fontSize: "14px",
    marginBottom: "10px",
  },
  kpiValue: {
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
  },
};

export default Dashboard;
