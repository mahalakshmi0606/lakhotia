import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Login from "./Components/LoginPage";
import Header from "./Components/Header";
import Sidebar from "./Components/Sidebar";
import Dashboard from "./Components/Dashboard";
import UserTypePage from "./Components/UserType";
import EmployeePage from "./Components/Employee";
import CompanyPage from "./Components/Company";
import DepartmentPage from "./Components/Department";
import DesignationPage from "./Components/Designation";
import Footer from "./Components/Footer";
import VisitReport from "./Components/VisitReport";
import AdminVisitReport from "./Components/AdminVisitReport";
import AttendancePage from "./Components/Attendance";
import AdminAttendancePage from "./Components/AdminAttendance";
import AttendanceReport from "./Components/AttendanceReport";
import TaskPage from "./Components/Task";
import Taskstatus from "./Components/TaskStatus";
import AdminTask from "./Components/AdminTask";
import SalaryReport from "./Components/EsiSalaryReport";
import Settings from "./Components/Settings";
import AdvancePage from "./Components/AdvancePage";
import CasualLabourSalaryReport from "./Components/NoEsiPf";
import IndustrySegmentationPage from "./Components/IndustrialSegmentation";
import CasualLeave from "./Components/CasualLeave";
import AccessControlPage from "./Components/AccessControl";
import StockUploadPage from "./Components/StockUpload";
import GRNPage from "./Components/Grn";
import StockSoldPage from "./Components/StockSold";
import Quotation from "./Components/Quotation";
import MRPChangePage from "./Components/mrpchange";
import QuotationReportPage from "./Components/QuotationReport";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <AppContent
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
        email={email}
        setEmail={setEmail}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    </Router>
  );
}

function AppContent({
  isAuthenticated,
  setIsAuthenticated,
  email,
  setEmail,
  sidebarOpen,
  setSidebarOpen,
}) {
  const navigate = useNavigate();

  const handleLogin = (enteredEmail) => {
    setEmail(enteredEmail);
    setIsAuthenticated(true);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail("");
    navigate("/");
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div style={styles.appContainer}>
      {isAuthenticated ? (
        <>
          <Header
            email={email}
            onLogout={handleLogout}
            onToggleSidebar={handleToggleSidebar}
          />

          <Sidebar isOpen={sidebarOpen} />

          <div
            style={{
              ...styles.mainContent,
              marginLeft: sidebarOpen ? 200 : 0,
            }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/user-types" element={<UserTypePage />} />
              <Route path="/employees" element={<EmployeePage />} />
              <Route path="/companies" element={<CompanyPage />} />
              <Route path="/departments" element={<DepartmentPage />} />
              <Route path="/designations" element={<DesignationPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/AdminAttendance" element={<AdminAttendancePage />} />
              <Route path="/visitreport" element={<VisitReport />} />
              <Route path="/AdminVisitReport" element={<AdminVisitReport />} />
              <Route path="/Task" element={<TaskPage />} />
              <Route path="/Taskstatus" element={<Taskstatus />} />
              <Route path="/AdminTask" element={<AdminTask />} />
              <Route path="/AttendanceReport" element={<AttendanceReport />} />
              <Route path="/EsiReport" element={<SalaryReport />} />
              <Route path="/Settings" element={<Settings />} />
              <Route path="/Loan" element={<AdvancePage />} />
              <Route path="/CasualLeave" element={<CasualLeave />} />
              <Route path="/noesipf" element={<CasualLabourSalaryReport />} />
              <Route path="/accesscontrol" element={<AccessControlPage />} />
              <Route path="/quotationreport" element={<QuotationReportPage />} />

              <Route path="/stockupload" element={<StockUploadPage />} />
              <Route path="/stocksold" element={<StockSoldPage />} />
              <Route path="/grn" element={<GRNPage />} />
              <Route path="/quotation" element={<Quotation />} />

              {/* FIXED MRP ROUTE */}
              <Route path="/mrpchange" element={<MRPChangePage />} />

              {/* FIXED OTHER ROUTE */}
              <Route
                path="/IndustrialSegmentation"
                element={<IndustrySegmentationPage />}
              />

              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>

          <Footer />
        </>
      ) : (
        <Routes>
          <Route path="/" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </div>
  );
}

const styles = {
  appContainer: {
    fontFamily: "Poppins, sans-serif",
    minHeight: "100vh",
    backgroundColor: "#ffffffff",
    position: "relative",
  },
  mainContent: {
    transition: "margin 0.3s ease",
    padding: "20px",
    minHeight: "calc(100vh - 60px)",
  },
};

export default App;
