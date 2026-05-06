import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./TeacherDashboard.css";

const API = "http://127.0.0.1:8000";

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classroomId, setClassroomId] = useState("");

  const [sessionId, setSessionId] = useState(null);
  const [report, setReport] = useState([]);

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  const token = localStorage.getItem("token");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    console.log("Searching for:", searchQuery);
    try {
      const res = await axios.get(`${API}/teacher/search-student?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Search results:", res.data);
      setSearchResults(res.data);
      setIsSearchOpen(true);
    } catch (err) {
      console.error("Search Error:", err);
      alert("Search failed. Check console for details.");
    }
  };

  const showStudent = async (id) => {
    try {
      const res = await axios.get(`${API}/teacher/student-details/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentDetails(res.data);
    } catch {
      alert("Failed to load details");
    }
  };

  const fetchDropdownData = useCallback(async () => {
    try {
      const [classRes, subjectRes, classroomRes] = await Promise.all([
        axios.get(`${API}/admin/classes`),
        axios.get(`${API}/admin/subjects`),
        axios.get(`${API}/admin/classrooms`)
      ]);

      setClasses(classRes.data || []);
      setSubjects(subjectRes.data || []);
      setClassrooms(classroomRes.data || []);
    } catch {
      console.log("Dropdown Error");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchDropdownData();
    };
    load();
  }, [fetchDropdownData]);

  const startSession = async () => {
    if (!classroomId || !classId || !subjectId) {
      alert("Please select classroom, class, and subject");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/teacher/start-session`,
        {
          classroom_id: Number(classroomId),
          class_id: Number(classId),
          subject_id: Number(subjectId),
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSessionId(res.data.session_id);
      alert(`Session started. Session ID: ${res.data.session_id}`);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to start session");
    }
  };

  const stopSession = async () => {
    try {
      await axios.post(`${API}/teacher/stop-session?session_id=${sessionId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessionId(null);
      setActiveTab("dashboard");
      alert("Session stopped and camera closed");
    } catch {
      alert("Failed to stop session");
    }
  };

  const finalizeAttendance = async () => {
    try {
      const res = await axios.post(`${API}/attendance/finalize/${sessionId}`);
      setReport(res.data.results || []);
      alert("Attendance finalized");
    } catch {
      alert("Failed to finalize attendance");
    }
  };

  const takeManualAttendance = async () => {
    if (!sessionId) return alert("Please start a session first");
    try {
      const res = await axios.post(`${API}/attendance/initialize/${sessionId}`);
      setReport(res.data.results || []);
      alert("Student list loaded for manual attendance");
    } catch {
      alert("Failed to load student list");
    }
  };

  const manualCorrection = async (record_id, student_id, newStatus) => {
    let percentage = 0;
    if (newStatus === "Present") percentage = 100;
    else if (newStatus === "Late") percentage = 50;

    try {
      await axios.patch(`${API}/attendance/record/${record_id}`, {
        status: newStatus,
        percentage: percentage
      });
      
      setReport((prev) =>
        prev.map((r) =>
          r.id === record_id ? { ...r, status: newStatus, percentage: percentage } : r
        )
      );
    } catch {
      alert("Failed to update attendance");
    }
  };

  const downloadCSV = () => {
    if (report.length === 0) return alert("No report available");
    let csv = "Student ID,Student Name,Status\n";
    report.forEach((r) => { csv += `${r.student_id},${r.student_name},${r.status}\n`; });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_session_${sessionId}.csv`;
    a.click();
  };

  return (
    <div className="teacher-dashboard">
      <aside className="sidebar">
        <h2>AI Attendance</h2>
        <p>Teacher Panel</p>

        <ul>
          <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            Dashboard
          </li>
          <li className={activeTab === 'live' ? 'active' : ''} onClick={() => setActiveTab('live')}>
            Live Attendance
          </li>
          <li>Timetable</li>
          <li>Reports</li>
          <li>Low Attendance</li>
          <li className="logout-btn" onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>
            Logout
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <h1>{activeTab === 'dashboard' ? 'Teacher Dashboard' : 'Live AI Monitoring'}</h1>
          <div className="topbar-actions">
             <form onSubmit={handleSearch} className="search-form">
                <input 
                  type="text" 
                  placeholder="Search student..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit">Search</button>
             </form>
          </div>
        </div>

        {/* --- SEARCH RESULTS MODAL --- */}
        {isSearchOpen && (
          <div className="modal-overlay" onClick={() => setIsSearchOpen(false)}>
             <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                   <h3>Results for "{searchQuery}"</h3>
                   <button className="close-btn" onClick={() => setIsSearchOpen(false)}>×</button>
                </div>
                <div className="modal-body">
                   {searchResults.length === 0 ? <p className="text-center p-4">No students found.</p> : (
                     <div className="results-list">
                        {searchResults.map(s => (
                          <div key={s.id} className="result-item" onClick={() => { setIsSearchOpen(false); showStudent(s.id); }}>
                             <div className="res-info">
                                <span className="res-name">{s.name}</span>
                                <span className="res-meta">{s.roll_no} | {s.class_name}</span>
                             </div>
                             <button className="btn-view">View Profile</button>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* --- STUDENT DETAIL MODAL --- */}
        {studentDetails && (
          <div className="modal-overlay" onClick={() => setStudentDetails(null)}>
             <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                   <h3>Student Academic Profile</h3>
                   <button className="close-btn" onClick={() => setStudentDetails(null)}>×</button>
                </div>
                <div className="modal-body">
                   <div className="profile-header">
                      <div className="profile-avatar">{studentDetails.profile.name.charAt(0)}</div>
                      <div className="profile-info">
                         <h2>{studentDetails.profile.name}</h2>
                         <p className="email">{studentDetails.profile.email}</p>
                         <div className="profile-badges">
                            <span>Roll: {studentDetails.profile.roll_no}</span>
                            <span>Class: {studentDetails.profile.class}</span>
                            <span>{studentDetails.profile.department}</span>
                         </div>
                      </div>
                   </div>

                   <div className="history-section mt-6">
                      <h4>Recent Attendance History</h4>
                      <div className="history-list">
                         <div className="history-row header">
                            <span>Subject</span>
                            <span>Date & Time</span>
                            <span>Status</span>
                         </div>
                         {studentDetails.attendance_history.length === 0 ? <p className="text-center p-6 text-gray-400">No records found for this student.</p> : (
                           studentDetails.attendance_history.map((h, i) => (
                             <div key={i} className="history-row">
                                <span>{h.subject}</span>
                                <span className="date">{h.date}</span>
                                <span className={`status-tag ${h.status.toLowerCase()}`}>{h.status}</span>
                             </div>
                           ))
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'dashboard' ? (
          <>
            <section className="cards">
              <div className="card">
                <h3>Classroom</h3>
                <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
                  <option value="">-- Select --</option>
                  {classrooms.map((room) => (
                    <option key={room.id} value={room.id}>{room.room_name}</option>
                  ))}
                </select>
              </div>
              <div className="card">
                <h3>Class</h3>
                <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                  <option value="">-- Select --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="card">
                <h3>Subject</h3>
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  <option value="">-- Select --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="actions">
              <button className="btn-start" onClick={startSession}>Start Session</button>
              <button onClick={takeManualAttendance} disabled={!sessionId}>Take Manual</button>
              <button className="btn-stop" onClick={stopSession} disabled={!sessionId}>Stop Session</button>
              <button onClick={finalizeAttendance} disabled={!sessionId}>Finalize</button>
              <button onClick={downloadCSV}>Export CSV</button>
            </section>

            <section className="grid">
              <div className="panel">
                <h2>Attendance Roster</h2>
                {report.length === 0 ? (
                  <p className="empty-msg">Start session and load list to see students.</p>
                ) : (
                  <div className="report-list">
                    {report.map((r) => (
                      <div className="report-row" key={r.id}>
                        <div className="student-info">
                           <span className="name">{r.student_name}</span>
                           <span className="id">ID: {r.student_id}</span>
                        </div>
                        <div className="status-control">
                          <span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span>
                          <select value={r.status} onChange={(e) => manualCorrection(r.id, r.student_id, e.target.value)}>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="panel">
                <h2>Quick Stats</h2>
                <div className="stats-box">
                   <div className="stat"><span>Present:</span> <strong>{report.filter(r => r.status === "Present").length}</strong></div>
                   <div className="stat"><span>Absent:</span> <strong>{report.filter(r => r.status === "Absent").length}</strong></div>
                   <div className="stat"><span>Late:</span> <strong>{report.filter(r => r.status === "Late").length}</strong></div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="live-view">
             <div className="panel live-feed-container">
                <h2>Real-Time AI Camera Feed</h2>
                {sessionId ? (
                  <div className="stream-wrapper">
                    <img src={`${API}/attendance/live-feed/${sessionId}`} alt="AI Stream" className="live-img" />
                    <div className="stream-overlay">
                       <div className="live-indicator"><span className="dot"></span> LIVE SCANNING</div>
                       <div className="legend">
                          <span className="green">Detected</span>
                          <span className="red">Unknown</span>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="offline-placeholder">
                     <p>No active session found.</p>
                     <button onClick={() => setActiveTab('dashboard')}>Go to Dashboard to Start</button>
                  </div>
                )}
                <div className="ai-info mt-6">
                   <h4>AI Processing Active</h4>
                   <ul>
                      <li>✓ Automatic Face Bounding Boxes</li>
                      <li>✓ Student Identification Overlays</li>
                      <li>✓ Real-time Confidence Scoring</li>
                      <li>✓ Unknown Face Alert System</li>
                   </ul>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
