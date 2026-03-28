import React, { useState, useEffect } from "react";
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
import CompanyDashboard from "./Components/CompanyDashboard";

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
import SalesOrder from "./Components/SalesOrder";
import RejectedItemsPage from "./Components/RejectedReport";
import Purchaseorder from "./Components/PurchaseOrder";
import PurchaseOrderPage from "./Components/PurchaseOreder_Approval";
import EnquiryModal from "./Components/enquiry";
import QuotationWholeReport from "./Components/QuotationWholeReport";
import Enquiryreport from "./Components/EnquiryReport";
import Dashboardsetter from "./Components/Dashboardsetter";
import EmployeeReportPage from "./Components/EmployeeReport";
import PurchaseOrderReceiptPage from "./Components/PurchaseOrderReceived";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Auto-open sidebar on desktop, auto-close on mobile
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    handleResize(); // Call initially
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Router>
      <AppContent
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
        email={email}
        setEmail={setEmail}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
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
  isMobile,
}) {
  const navigate = useNavigate();

  // ✅ LOGIN HANDLER (ROLE AWARE)
  const handleLogin = (enteredEmail) => {
    setEmail(enteredEmail);
    setIsAuthenticated(true);

    const loginType = localStorage.getItem("login_type");

    if (loginType === "company") {
      navigate("/company-dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail("");
    localStorage.clear();
    navigate("/");
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getHomeRoute = () => {
    return localStorage.getItem("login_type") === "company"
      ? "/company-dashboard"
      : "/dashboard";
  };

  // Handle click on main content to close sidebar on mobile
  const handleContentClick = (e) => {
    // Only close if clicking on the content area itself (not on children that might need interaction)
    if (isMobile && sidebarOpen && e.target === e.currentTarget) {
      setSidebarOpen(false);
    }
  };

  return (
    <div style={styles.appContainer}>
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop={true} 
        closeOnClick 
        pauseOnHover 
        theme="colored"
        style={{ zIndex: 999999, top: '10px', right: '10px' }}
      />
      {isAuthenticated ? (
        <>
          <Header
            email={email}
            onLogout={handleLogout}
            onToggleSidebar={handleToggleSidebar}
          />

          <div style={styles.layoutContainer}>
            <Sidebar 
              isOpen={sidebarOpen} 
              setIsOpen={setSidebarOpen}
              isMobile={isMobile}
            />
            
            <div
              style={{
                ...styles.mainContent,
                // On desktop: add margin when sidebar is open
                marginLeft: !isMobile && sidebarOpen ? "280px" : "0",
                // On mobile: no margin shift, just overlay effect
                opacity: isMobile && sidebarOpen ? 0.5 : 1,
                pointerEvents: isMobile && sidebarOpen ? "none" : "auto",
                transition: "margin-left 0.3s ease, opacity 0.3s ease",
              }}
              onClick={handleContentClick}
            >
              <Routes>
                {/* 🔥 DEFAULT ROUTE */}
                <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />

                {/* DASHBOARDS */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/company-dashboard"
                  element={<CompanyDashboard />}
                />

                {/* OTHER ROUTES */}
                <Route path="/user-types" element={<UserTypePage />} />
                <Route path="/employees" element={<EmployeePage />} />
                <Route path="/companies" element={<CompanyPage />} />
                <Route path="/departments" element={<DepartmentPage />} />
                <Route path="/designations" element={<DesignationPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route
                  path="/AdminAttendance"
                  element={<AdminAttendancePage />}
                />
                <Route path="/visitreport" element={<VisitReport />} />
                <Route
                  path="/AdminVisitReport"
                  element={<AdminVisitReport />}
                />
                <Route path="/Task" element={<TaskPage />} />
                <Route path="/Taskstatus" element={<Taskstatus />} />
                <Route path="/AdminTask" element={<AdminTask />} />
                <Route
                  path="/AttendanceReport"
                  element={<AttendanceReport />}
                />
                <Route path="/EsiReport" element={<SalaryReport />} />
                <Route path="/Settings" element={<Settings />} />
                <Route path="/Loan" element={<AdvancePage />} />
                <Route path="/CasualLeave" element={<CasualLeave />} />
                <Route
                  path="/noesipf"
                  element={<CasualLabourSalaryReport />}
                />
                <Route path="/accesscontrol" element={<AccessControlPage />} />
                <Route
                  path="/quotationreport"
                  element={<QuotationReportPage />}
                />
                <Route path="/salesorder" element={<SalesOrder />} />
                <Route path="/stockupload" element={<StockUploadPage />} />
                <Route path="/stocksold" element={<StockSoldPage />} />
                <Route path="/grn" element={<GRNPage />} />
                <Route path="/quotation" element={<Quotation />} />
                <Route path="/rejected" element={<RejectedItemsPage />} />
                <Route path="/PurchaseOrder" element={<Purchaseorder />} />
                <Route path="/enquiry" element={<EnquiryModal />} />
                <Route path="/QuotationWholeReport" element={<QuotationWholeReport />} />
                <Route path="/PurchaseOrderapproval" element={<PurchaseOrderPage />} />
                <Route path="/EmployeeReport" element={<EmployeeReportPage />} />
                <Route path="/mrpchange" element={<MRPChangePage />} />
                <Route path="/enquiryreport" element={<Enquiryreport />}/>
                <Route path="/dashboardsetter" element={<Dashboardsetter />} />
                <Route path="/orderdelivered" element={<PurchaseOrderReceiptPage />} />
                <Route path="/IndustrialSegmentation" element={<IndustrySegmentationPage />} />

                {/* 🔁 FALLBACK */}
                <Route
                  path="*"
                  element={<Navigate to={getHomeRoute()} replace />}
                />
              </Routes>
            </div>
          </div>

          <Footer />
        </>
      ) : (
        <Routes>
          <Route path="/" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
  layoutContainer: {
    display: "flex",
    minHeight: "calc(100vh - 105px)", // Account for header + footer
    position: "relative",
  },
  mainContent: {
    flex: 1,
    padding: "20px",
    width: "100%",
    backgroundColor: "#ffffff",
    position: "relative",
    zIndex: 1,
    minHeight: "calc(100vh - 105px)",
  },
};

export default App;