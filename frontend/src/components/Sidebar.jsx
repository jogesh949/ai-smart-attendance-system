import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  Monitor,
  LogOut,
  Menu,
  X,
  UserSquare,
  School, // Used for Classes
  FlaskConical,
  Building2,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const sidebarItems = {
  admin: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Students', icon: GraduationCap, path: '/admin/users' },
    { name: 'Teachers', icon: Users, path: '/admin/teachers' },
    { name: 'Departments', icon: FlaskConical, path: '/admin/departments' },
    { name: 'Classes', icon: School, path: '/admin/classes' },
    { name: 'Subjects', icon: BookOpen, path: '/admin/subjects' },
    { name: 'Classrooms', icon: Building2, path: '/admin/classrooms' },
    { name: 'Timetable', icon: Calendar, path: '/admin/timetable' }, // Renamed from Chrono Mapping
    { name: 'Cameras', icon: Monitor, path: '/admin/cameras' }, // Renamed from Surveillance Matrix
    { name: 'Reports', icon: BarChart3, path: '/admin/reports' }, // Renamed from Attendance Intelligence
  ],
  teacher: [
    { name: 'Dashboard', icon: Monitor, path: '/teacher' },
    { name: 'Session History', icon: Calendar, path: '/teacher/history' }, // Assuming a history page
  ],
  student: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/student' },
    { name: 'Face Enrollment', icon: UserSquare, path: '/student/enroll' },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const currentRoleItems = sidebarItems[user?.role] || [];

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <button
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-violet rounded-full shadow-lg text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 240 : 72 }}
        className="hidden lg:flex flex-col h-screen bg-white/5 backdrop-blur-md border-r border-white/10 p-4 relative z-20"
      >
        <div className="flex items-center justify-between h-16 mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isOpen ? 1 : 0 }}
            className="text-xl font-orbitron font-bold text-cyan-DEFAULT whitespace-nowrap overflow-hidden"
          >
            AI Attend
          </motion.div>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {currentRoleItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group
                ${location.pathname.startsWith(item.path) ? 'bg-cyan-DEFAULT/10 text-cyan-DEFAULT shadow-cyan-glow border border-cyan-DEFAULT/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={20} className={location.pathname.startsWith(item.path) ? 'text-cyan-DEFAULT' : 'group-hover:text-white'} />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: isOpen ? 1 : 0 }}
                className="font-dm font-medium whitespace-nowrap overflow-hidden"
              >
                {item.name}
              </motion.span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-4 p-3 rounded-xl w-full text-text-muted hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: isOpen ? 1 : 0 }}
              className="font-dm font-medium whitespace-nowrap overflow-hidden"
            >
              Logout
            </motion.span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Overlay and Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed top-0 left-0 h-screen w-64 bg-white/5 backdrop-blur-md border-r border-white/10 p-4 z-50 lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between h-16 mb-8">
              <span className="text-xl font-orbitron font-bold text-cyan-DEFAULT">AI Attend</span>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-2">
              {currentRoleItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group
                    ${location.pathname.startsWith(item.path) ? 'bg-cyan-DEFAULT/10 text-cyan-DEFAULT shadow-cyan-glow border border-cyan-DEFAULT/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
                >
                  <item.icon size={20} className={location.pathname.startsWith(item.path) ? 'text-cyan-DEFAULT' : 'group-hover:text-white'} />
                  <span className="font-dm font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-white/10">
              <button
                onClick={() => { logout(); setIsOpen(false); }}
                className="flex items-center gap-4 p-3 rounded-xl w-full text-text-muted hover:bg-white/5 hover:text-white transition-colors"
              >
                <LogOut size={20} />
                <span className="font-dm font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;/>
  );
};

export default Sidebar;