import { useState } from "react";
import axios from "axios";
import "./login.css";

const API = "http://127.0.0.1:8000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      const data = res.data;

      // Save data
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "admin") {
        window.location.href = "/admin/dashboard";
      } else if (data.user.role === "teacher") {
        window.location.href = "/teacher/dashboard";
      } else if (data.user.role === "student") {
        window.location.href = "/student/dashboard";
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const autoFill = (role) => {
    setEmail(`${role}@example.com`);
    setPassword("password123");
    setError("");
  };

  return (
    <div className="login-container">
      {/* Background Blobs */}
      <div className="login-bg-blob blob-1"></div>
      <div className="login-bg-blob blob-2"></div>

      <div className="login-glass-card animate-fade-in-up">
        <div className="login-header">
          <div className="login-logo-wrapper">
            <span className="login-logo-icon">💠</span>
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to AI Attendance System</p>
        </div>

        {error && (
          <div className="login-error animate-fade-in-up">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="login-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="demo-credentials">
          Test Roles: 
          <span onClick={() => autoFill('admin')}>Admin</span> | 
          <span onClick={() => autoFill('teacher')}>Teacher</span> | 
          <span onClick={() => autoFill('student')}>Student</span>
        </div>
      </div>
    </div>
  );
}