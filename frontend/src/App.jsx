import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

import { AuthProvider } from './hooks/useAuth'; // Removed duplicate useAuth import
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import NeuralBackground from './components/NeuralBackground';
import PageTransition from './components/PageTransition';
import { useAuth } from './hooks/useAuth';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import StudentPage from './pages/admin/StudentPage';
import TeacherPage from './pages/admin/TeacherPage';
import DepartmentPage from './pages/admin/DepartmentPage';
import ClassPage from './pages/admin/ClassPage';
import SubjectPage from './pages/admin/SubjectPage';
import ClassroomPage from './pages/admin/ClassroomPage';
import TimetablePage from './pages/admin/TimetablePage';
import CameraMappingPage from './pages/admin/CameraMappingPage';
import ReportsPage from './pages/admin/ReportsPage';

// Teacher Pages
import TeacherDashboard from './pages/TeacherDashboard';

import StudentDashboard from './pages/StudentDashboard';
import StudentFaceUpload from './pages/StudentFaceUpload';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isLoginPage = location.pathname === '/login';

  return (
    <>
      <div className="flex min-h-screen bg-cosmic text-text-primary font-dm">
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'rgba(2, 8, 23, 0.8)',
              color: '#F0F9FF',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '12px',
            },
          }} 
        />
        
        {!isLoginPage && <Sidebar />}

        <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
          <NeuralBackground />
          {!isLoginPage && <TopBar />}
          
          <main className={`flex-1 overflow-y-auto ${!isLoginPage ? 'p-8' : ''}`}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<Login />} />
                
                <Route path="/admin" element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute role="admin">
                    <StudentPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/classes" element={
                  <ProtectedRoute role="admin">
                    <ClassPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/subjects" element={
                  <ProtectedRoute role="admin">
                    <SubjectPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/classrooms" element={
                  <ProtectedRoute role="admin">
                    <ClassroomPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/teachers" element={
                  <ProtectedRoute role="admin">
                    <TeacherPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/departments" element={
                  <ProtectedRoute role="admin">
                    <DepartmentPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/timetable" element={
                  <ProtectedRoute role="admin">
                    <TimetablePage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/cameras" element={
                  <ProtectedRoute role="admin">
                    <CameraMappingPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/reports" element={
                  <ProtectedRoute role="admin">
                    <ReportsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                <Route path="/teacher" element={
                  <ProtectedRoute role="teacher">
                    <TeacherDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/history" element={
                  <ProtectedRoute role="teacher">
                    {/* Placeholder for SessionHistory page */}
                    <PageTransition><div className="text-white">Teacher Session History Page</div></PageTransition>
                  </ProtectedRoute>
                } />
                
                <Route path="/student" element={
                  <ProtectedRoute role="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/student/enroll" element={
                  <ProtectedRoute role="student">
                    <StudentFaceUpload />
                  </ProtectedRoute>
                } />

                <Route path="/" element={
                  user ? (
                    user.role === 'admin' ? <Navigate to="/admin" /> :
                    user.role === 'teacher' ? <Navigate to="/teacher" /> :
                    <Navigate to="/student" />
                  ) : <Navigate to="/login" />
                } />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
