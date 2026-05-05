import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Camera, Users, LogOut, Menu, UserPlus, Shield, AlertTriangle, ChevronRight, X, UserCheck, UserX, BarChart3, Clock, Home } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- MOCK API ---
const api = {
  login: (email, password) => new Promise(resolve => setTimeout(() => resolve({ token: 'mock-token', role: 'admin', name: 'Admin User' }), 1000)),
  getStats: () => new Promise(resolve => setTimeout(() => resolve({ total: 1250, present: 1100, absent: 150, percentage: 88 }), 800)),
  getWeekly: () => new Promise(resolve => setTimeout(() => resolve([
    { name: 'Mon', present: 1100, absent: 150 },
    { name: 'Tue', present: 1120, absent: 130 },
    { name: 'Wed', present: 1080, absent: 170 },
    { name: 'Thu', present: 1150, absent: 100 },
    { name: 'Fri', present: 1090, absent: 160 },
  ]), 800)),
  getToday: () => new Promise(resolve => setTimeout(() => resolve([
    { id: 'S101', name: 'Alice Smith', status: 'Present', time: '08:45 AM' },
    { id: 'S102', name: 'Bob Johnson', status: 'Present', time: '08:50 AM' },
    { id: 'S103', name: 'Charlie Brown', status: 'Absent', time: '-' },
    { id: 'S104', name: 'Diana Prince', status: 'Present', time: '09:05 AM' },
    { id: 'S105', name: 'Evan Wright', status: 'Absent', time: '-' },
  ]), 1000)),
  registerFace: () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1500)),
  markAttendance: () => new Promise(resolve => setTimeout(() => resolve({ success: true, confidence: 98.5 }), 1500))
};

// --- SHARED UI COMPONENTS ---
const Button = ({ children, variant = 'primary', className = '', loading, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#1a2b6d] text-white hover:bg-[#121f4f] focus:ring-[#1a2b6d]",
    accent: "bg-[#00c9a7] text-white hover:bg-[#00b093] focus:ring-[#00c9a7]",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-[#1a2b6d]",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading ? <span className="mr-2 animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></span> : null}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'success' }) => {
  const variants = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    primary: "bg-blue-100 text-[#1a2b6d]",
    warning: "bg-yellow-100 text-yellow-800"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

// --- CAMERA COMPONENT ---
const CameraCapture = ({ onCapture, mode = 'attendance' }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [detected, setDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Camera access denied or unavailable. Please check permissions.');
      }
    };
    initCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Simulate face detection
  useEffect(() => {
    if (!stream) return;
    const interval = setInterval(() => {
      const isDetected = Math.random() > 0.3; // 70% chance of detection for demo
      setDetected(isDetected);
      if (isDetected) setConfidence((85 + Math.random() * 14).toFixed(1));
      else setConfidence(0);
    }, 1000);
    return () => clearInterval(interval);
  }, [stream]);

  const handleCaptureClick = () => {
    if (!detected && mode !== 'register') {
      toast.error('No face detected. Please align your face in the oval.');
      return;
    }
    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
        onCapture();
        setCountdown(null);
      }
    }, 1000);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 text-red-600 rounded-2xl border border-red-200 aspect-[3/4] w-full max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="text-center font-medium">{error}</p>
        <Button variant="outline" className="mt-4 bg-white" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      
      {/* SVG Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <mask id="ovalMask">
          <rect width="100" height="100" fill="white" />
          <ellipse cx="50" cy="45" rx="30" ry="40" fill="black" />
        </mask>
        <rect width="100" height="100" fill="rgba(26, 43, 109, 0.85)" mask="url(#ovalMask)" />
        
        {/* Pulsing Guide Ring */}
        <ellipse 
          cx="50" cy="45" rx="30" ry="40" 
          fill="transparent" 
          stroke={detected ? "#00c9a7" : "rgba(255,255,255,0.3)"} 
          strokeWidth="1" 
          strokeDasharray={detected ? "0" : "2 2"} 
          style={{ transition: 'all 0.3s ease' }}
        />
        {detected && (
          <ellipse cx="50" cy="45" rx="30" ry="40" fill="transparent" stroke="rgba(0, 201, 167, 0.5)" strokeWidth="2" className="animate-ping origin-center" style={{ animationDuration: '2s' }} />
        )}
      </svg>

      {/* UI Elements */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${detected ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-gray-500/20 text-gray-300 border-gray-500/50'}`}>
          {detected ? 'Face Detected' : 'Align Face'}
        </div>
        {detected && confidence > 0 && (
          <div className="px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md bg-teal-500/20 text-teal-400 border border-teal-500/50 flex items-center">
            <Shield className="w-3 h-3 mr-1" /> {confidence}% Match
          </div>
        )}
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-sm">
          <span className="text-8xl font-bold text-white drop-shadow-lg animate-bounce">{countdown > 0 ? countdown : '📸'}</span>
        </div>
      )}

      {/* Capture Button */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 px-6">
        <Button 
          variant="accent" 
          className="w-full py-4 rounded-xl text-lg shadow-lg shadow-teal-500/30 font-semibold tracking-wide" 
          onClick={handleCaptureClick}
          disabled={countdown !== null}
        >
          {mode === 'attendance' ? 'Mark Attendance' : 'Capture Face'}
        </Button>
      </div>
    </div>
  );
};


// --- LAYOUT ---
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Take Attendance', path: '/take-attendance', icon: Camera },
    { name: 'Register Student', path: '/register-student', icon: UserPlus },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#1a2b6d] text-white p-4 flex justify-between items-center z-20 shadow-md">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Shield className="text-[#00c9a7]" /> AI.ttend
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 focus:outline-none">
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`bg-[#0f172a] text-gray-300 w-full md:w-64 flex-shrink-0 flex flex-col transition-transform duration-300 z-10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:static inset-y-0 left-0 pt-16 md:pt-0`}>
        <div className="hidden md:flex items-center gap-3 font-bold text-2xl text-white p-6 border-b border-gray-800">
          <Shield className="text-[#00c9a7] w-8 h-8" /> 
          <span>AI.ttend</span>
        </div>
        
        <div className="p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main Menu</p>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-[#1a2b6d] text-white font-medium' : 'hover:bg-gray-800 hover:text-white'}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#00c9a7]' : ''}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-gray-800 text-red-400 hover:text-red-300 transition-colors">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 mt-16 md:mt-0">
        <div className="max-w-6xl mx-auto pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav (Optional enhancement) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-20 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-[#1a2b6d]' : 'text-gray-500'}`}>
              <Icon className={`w-6 h-6 ${isActive ? 'text-[#00c9a7]' : ''}`} />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};


// --- PAGES ---

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Enter all fields');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('token', res.token);
      toast.success(`Welcome back, ${res.name}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#1a2b6d] p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4 ring-4 ring-white/5">
            <Shield className="w-8 h-8 text-[#00c9a7]" />
          </div>
          <h2 className="text-2xl font-bold text-white">AI.ttend</h2>
          <p className="text-blue-200 text-sm mt-1">Smart Face Recognition System</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a2b6d] focus:border-transparent transition-all outline-none"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a2b6d] focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full py-3 text-lg" loading={loading}>
            Sign In to Dashboard
          </Button>
          
          <div className="text-center mt-4">
            <button type="button" onClick={() => { setEmail('admin@example.com'); setPassword('password'); }} className="text-sm text-gray-500 hover:text-[#1a2b6d] underline">
              Use Demo Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [today, setToday] = useState(null);

  useEffect(() => {
    Promise.all([api.getStats(), api.getWeekly(), api.getToday()]).then(([s, w, t]) => {
      setStats(s); setWeekly(w); setToday(t);
    });
  }, []);

  const pieData = stats ? [
    { name: 'Present', value: stats.present, color: '#10b981' },
    { name: 'Absent', value: stats.absent, color: '#ef4444' }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of today's attendance metrics.</p>
        </div>
        <Button variant="accent" onClick={() => window.location.href='/take-attendance'}>
          <Camera className="w-4 h-4 mr-2" /> Start Session
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[ 
          { label: 'Total Students', value: stats?.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Present Today', value: stats?.present, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Absent Today', value: stats?.absent, icon: UserX, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Attendance %', value: stats?.percentage + '%', icon: BarChart3, color: 'text-teal-600', bg: 'bg-teal-100' }
        ].map((stat, i) => (
          <Card key={i} className="flex items-center p-5">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              {stats ? <p className="text-2xl font-bold text-gray-900">{stat.value}</p> : <Skeleton className="h-8 w-16 mt-1" />}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Attendance Trends</h3>
          {weekly ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}}/>
                  <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <Skeleton className="h-72 w-full" />}
        </Card>

        {/* Donut Chart */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Ratio</h3>
          {stats ? (
            <div className="h-72 flex flex-col items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-900">{stats.percentage}%</span>
                <span className="text-xs text-gray-500">Present</span>
              </div>
            </div>
          ) : <Skeleton className="h-72 w-full" />}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Recent Scans Today</h3>
          <Button variant="outline" className="text-sm py-1 px-3">View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Student ID</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {today ? today.map((student, i) => (
                <tr key={student.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{student.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 text-gray-500 flex items-center"><Clock className="w-4 h-4 mr-1 text-gray-400"/> {student.time}</td>
                  <td className="px-6 py-4">
                    <Badge variant={student.status === 'Present' ? 'success' : 'error'}>{student.status}</Badge>
                  </td>
                </tr>
              )) : (
                [1,2,3].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const TakeAttendance = () => {
  const [taking, setTaking] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);

  const handleCapture = async () => {
    setTaking(true);
    const toastId = toast.loading('Processing face data...');
    try {
      const res = await api.markAttendance();
      toast.success(`Attendance marked successfully! (${res.confidence}% match)`, { id: toastId });
      setLastScanned({ name: 'Alice Smith', id: 'S101', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
    } catch (e) {
      toast.error('Failed to recognize face. Try again.', { id: toastId });
    } finally {
      setTaking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Live Attendance</h1>
        <p className="text-gray-500 mt-2">Classroom: CS-101 • Subject: Data Structures</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Camera Section */}
        <div>
          <CameraCapture mode="attendance" onCapture={handleCapture} />
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          <Card className="bg-[#1a2b6d] text-white border-none">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-100"><Users className="w-5 h-5 mr-2" /> Live Session Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm text-blue-200">Session Started</p>
                <p className="text-xl font-bold mt-1">08:30 AM</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm text-blue-200">Scanned</p>
                <p className="text-xl font-bold mt-1 text-[#00c9a7]">42 / 50</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-4">Last Scanned</h3>
            {lastScanned ? (
              <div className="flex items-center gap-4 animate-fade-in-up">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{lastScanned.name}</p>
                  <p className="text-sm text-gray-500">ID: {lastScanned.id} • Scanned at {lastScanned.time}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>Waiting for first scan...</p>
              </div>
            )}
          </Card>
          
          <Button variant="outline" className="w-full" onClick={() => window.location.href='/dashboard'}>End Session & Generate Report</Button>
        </div>
      </div>
    </div>
  );
};

const RegisterStudent = () => {
  const [step, setStep] = useState(1); // 1: Info, 2: Camera, 3: Success
  const [loading, setLoading] = useState(false);

  const handleCapture = async () => {
    setLoading(true);
    const toastId = toast.loading('Encoding facial features...');
    try {
      await api.registerFace();
      toast.success('Student registered successfully!', { id: toastId });
      setStep(3);
    } catch (e) {
      toast.error('Failed to register face.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Register New Student</h1>
        <p className="text-gray-500 mt-2">Enroll a student and capture their facial biometrics.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
        {[1, 2, 3].map(s => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 text-sm ${step >= s ? 'bg-[#1a2b6d] border-white text-white' : 'bg-gray-100 border-white text-gray-400'}`}>
            {step > s ? <Check className="w-5 h-5" /> : s}
          </div>
        ))}
      </div>

      <Card className="p-8">
        {step === 1 && (
          <div className="space-y-5 animate-fade-in-up">
            <h3 className="text-xl font-bold border-b pb-4 border-gray-100">Student Details</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="John" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="Doe" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID / Roll No</label>
                <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="S-2024-001" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Class/Grade</label>
                <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a2b6d] outline-none bg-white">
                  <option>CS-101</option>
                  <option>ENG-201</option>
                </select>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setStep(2)}>Continue to Face Capture <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">Face Enrollment</h3>
              <p className="text-sm text-gray-500">Ensure good lighting and look directly into the camera.</p>
            </div>
            <CameraCapture mode="register" onCapture={handleCapture} />
            <div className="pt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-10 animate-fade-in-up">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h3>
            <p className="text-gray-500 mb-8">Student John Doe (S-2024-001) biometric data has been successfully saved.</p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => window.location.href='/dashboard'}>Go to Dashboard</Button>
              <Button onClick={() => setStep(1)}>Register Another</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const Reports = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Detailed Reports Module</h3>
        <p className="text-gray-500 max-w-md">This module allows you to export CSVs, filter by dates and subjects, and view individual student tracking. Functionality mocked for demo.</p>
        <Button className="mt-6">Download Monthly CSV Report</Button>
      </Card>
    </div>
  );
};

// --- ROUTER CONFIG ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff', borderRadius: '10px' } }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/take-attendance" element={<ProtectedRoute><TakeAttendance /></ProtectedRoute>} />
        <Route path="/register-student" element={<ProtectedRoute><RegisterStudent /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}