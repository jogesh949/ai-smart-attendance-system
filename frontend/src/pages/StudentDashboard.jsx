import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./StudentDashboard.css";

const API = "http://127.0.0.1:8000";

export default function StudentDashboard() {
  const [summary, setSummary] = useState([]);
  const [overall, setOverall] = useState(0);
  const [stats, setStats] = useState({ total: 0, present: 0 });
  const [profile] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchData = useCallback(async () => {
    if (!token) {
      alert("Please login again");
      window.location.href = "/login";
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get(`${API}/student/attendance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSummary(res.data.summary || []);
      setOverall(res.data.overall_percentage || 0);
      setStats({
        total: res.data.total_sessions || 0,
        present: res.data.total_present || 0
      });
    } catch (err) {
      console.log("Student Attendance Error:", err);
      alert(err.response?.data?.detail || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    load();
  }, [fetchData]);

  const downloadReport = () => {
    if (summary.length === 0) {
      alert("No attendance data available");
      return;
    }

    let csv = "Subject,Attended,Total,Percentage\n";

    summary.forEach((a) => {
      csv += `${a.subject},${a.attended},${a.total},${a.percentage || 0}%\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "student_attendance_report.csv";
    a.click();
  };

  return (
    <div className="student-dashboard">
      <aside className="sidebar">
        <h2>Student Panel</h2>

        <ul>
          <li className="active">Dashboard</li>
          <li onClick={() => fetchData()}>Refresh Attendance</li>
          <li onClick={() => (window.location.href = "/student/upload-face")}>
            Upload Face
          </li>
          <li onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>Logout</li>
        </ul>
      </aside>

      <main className="main">
        <header className="header">
           <h1>Welcome, {profile?.name || "Student"}</h1>
           <p className="subtitle">ID: {profile?.id || "N/A"} | INSTITUTIONAL PORTAL</p>
        </header>

        {loading && <div className="loading-overlay">Updating records...</div>}

        <div className="cards">
          <div className="card highlight">
            <h3>Overall Score</h3>
            <div className="score-container">
              <span className="score">{overall}%</span>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${overall}%` }}></div>
              </div>
            </div>
            <p className="card-detail">Total Present: {stats.present} / {stats.total} Classes</p>
          </div>

          <div className="card">
            <h3>Face Enrollment</h3>
            <p className="text-sm text-gray-500 mb-4">Complete your AI face profile for automated attendance.</p>
            <button className="btn-primary" onClick={() => (window.location.href = "/student/upload-face")}>
              Update Face Data
            </button>
          </div>

          <div className="card status-card">
            <h3>Attendance Status</h3>
            {overall < 75 ? (
              <div className="status critical">
                <span className="icon">⚠</span>
                <p>Low Attendance! You are below the 75% requirement.</p>
              </div>
            ) : (
              <div className="status healthy">
                <span className="icon">✅</span>
                <p>Status: Healthy. You are meeting requirements.</p>
              </div>
            )}
          </div>
        </div>

        <div className="section table-section">
          <h2>Subject-wise Performance</h2>

          {summary.length === 0 ? (
            <div className="empty-state">No attendance records found yet.</div>
          ) : (
            <div className="summary-list">
              <div className="row header-row">
                <span>Subject Name</span>
                <span>Attended / Total</span>
                <span>Percentage</span>
              </div>
              {summary.map((a, i) => (
                <div key={i} className="row">
                  <span className="font-bold">{a.subject}</span>
                  <span className="text-center">{a.attended} / {a.total}</span>
                  <span className={`percentage ${a.percentage < 75 ? 'low' : 'good'}`}>
                    {a.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="actions-footer">
          <button className="btn-outline" onClick={downloadReport}>Download CSV Report</button>
        </div>
      </main>
    </div>
  );
}
