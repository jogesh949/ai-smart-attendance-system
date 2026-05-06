import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { Shield, LayoutDashboard, Layers, Users, BookOpen, MapPin, BarChart3, Camera, LogOut, Menu, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import api from './api';
import { Button } from './components/UI';

// Pages
import AdminOverview from './pages/admin/AdminOverview';
import DepartmentPage from './pages/admin/DepartmentPage';
import ClassPage from './pages/admin/ClassPage';
import SubjectPage from './pages/admin/SubjectPage';
import ClassroomPage from './pages/admin/ClassroomPage';
import TeacherPage from './pages/admin/TeacherPage';
import StudentPage from './pages/admin/StudentPage';
import ReportsPage from './pages/admin/ReportsPage';
import CameraMappingPage from './pages/admin/CameraMappingPage';

import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentFaceUpload from './pages/StudentFaceUpload';

// --- COMPONENTS ---

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return children;
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Departments', path: '/admin/departments', icon: Layers },
    { name: 'Classes', path: '/admin/classes', icon: BookOpen },
    { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { name: 'Classrooms', path: '/admin/classrooms', icon: MapPin },
    { name: 'Teachers', path: '/admin/teachers', icon: Users },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Camera Mapping', path: '/admin/camera-mapping', icon: Camera },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      <header className="md:hidden bg-[#1a2b6d] text-white p-4 flex justify-between items-center z-20 shadow-md">
        <div className="flex items-center gap-2 font-bold text-xl"><Shield className="text-[#00c9a7]" /> AI.ttend</div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1">{sidebarOpen ? <X /> : <Menu />}</button>
      </header>

      <aside className={`bg-[#0f172a] text-gray-300 w-full md:w-64 flex-shrink-0 flex flex-col transition-transform duration-300 z-10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:static inset-y-0 left-0 pt-16 md:pt-0`}>
        <div className="hidden md:flex items-center gap-3 font-bold text-2xl text-white p-6 border-b border-gray-800">
          <Shield className="text-[#00c9a7] w-8 h-8" /><span>AI.ttend</span>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6 flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold">{user.name?.charAt(0) || 'A'}</div>
            <div>
              <p className="text-sm font-bold text-white">{user.name}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-[#1a2b6d] text-white font-medium' : 'hover:bg-gray-800 hover:text-white'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#00c9a7]' : ''}`} />{item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-6 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-gray-800 text-red-400 hover:text-red-300 transition-colors">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 mt-16 md:mt-0">
        <div className="max-w-6xl mx-auto pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// --- AUTH PAGES ---

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
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(`Welcome back, ${res.data.user.name}`);
      
      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'teacher') navigate('/teacher/dashboard');
      else if (role === 'student') navigate('/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
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
          <p className="text-blue-200 text-sm mt-1">Smart Attendance System</p>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="admin@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full py-3 text-lg" loading={loading}>Sign In</Button>
        </form>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff', borderRadius: '10px' } }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminOverview />} />
          <Route path="departments" element={<DepartmentPage />} />
          <Route path="classes" element={<ClassPage />} />
          <Route path="subjects" element={<SubjectPage />} />
          <Route path="classrooms" element={<ClassroomPage />} />
          <Route path="teachers" element={<TeacherPage />} />
          <Route path="students" element={<StudentPage />} />
          <Route path="camera-mapping" element={<CameraMappingPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Other Role Routes */}
        <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/upload-face" element={<ProtectedRoute allowedRoles={['student']}><StudentFaceUpload /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
