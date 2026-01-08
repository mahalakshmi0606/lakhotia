// Login.js
import React, { useState } from "react";
import { FaUserCircle, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import Logo from "./Name1.jpg"; // 🖼️ Logo Image

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔐 Main Login Function
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const empResponse = await fetch("http://localhost:5000/api/employee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const empData = await empResponse.json();

      if (empResponse.ok && empData.success) {
        handleSuccessfulLogin(empData.user, "employee");
        return;
      }

      const authResponse = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const authData = await authResponse.json();

      if (authResponse.ok && authData.success) {
        handleSuccessfulLogin(authData.user, "auth");
        return;
      }

      alert(`❌ ${empData.message || authData.message || "Login failed. Try again."}`);
    } catch (error) {
      console.error("Login Error:", error);
      alert("⚠️ Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // 🎯 SAVE LOGIN DETAILS
  const handleSuccessfulLogin = (user, loginType) => {
    alert("✅ Login successful!");

    const displayName =
      user.username ||
      user.name ||
      user.fullname ||
      "Unknown User";

    const userType =
      user.userType ||
      user.user_type ||
      user.usertype ||
      user.role ||
      "undefined";

    const userTypeId =
      user.user_type_id ||
      user.userTypeId ||
      user.usertype_id ||
      user.user_type ||
      0;

    localStorage.setItem("user_id", user.id);
    localStorage.setItem("username", displayName);
    localStorage.setItem("email", user.email);
    localStorage.setItem("login_type", loginType);
    localStorage.setItem("usertype", userType);
    localStorage.setItem("user_type_id", userTypeId);

    if (onLogin) onLogin(user);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <img src={Logo} alt="Lakotia Logo" style={styles.logo} />
          <p style={styles.subtitle}>Please sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email */}
          <div style={styles.inputGroup}>
            <FaUserCircle style={styles.icon} />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          {/* Password with Eye Icon */}
          <div style={styles.inputGroup}>
            <FaLock style={styles.icon} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
            <span
              style={styles.eyeIcon}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

// 🎨 Styling
const styles = {
  container: {
    height: "100vh",
    backgroundColor: "#fff8dc",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Poppins, sans-serif",
  },
  card: {
    background: "white",
    padding: "50px 40px",
    borderRadius: "20px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
    width: "380px",
    textAlign: "center",
  },
  header: { marginBottom: "25px" },
  logo: {
    width: "200px",
    marginBottom: "15px",
  },
  subtitle: { color: "#666", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fafafa",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "10px",
  },
  icon: { marginRight: "10px", color: "#f5c518" },
  eyeIcon: {
    cursor: "pointer",
    color: "#999",
  },
  input: {
    border: "none",
    outline: "none",
    width: "100%",
    background: "transparent",
    fontSize: "15px",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    backgroundColor: "#f5c518",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
  },
};

export default Login;
