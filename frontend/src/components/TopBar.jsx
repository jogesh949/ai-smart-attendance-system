import { Bell, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const TopBar = () => {
  const { user } = useAuth();

  const roleDisplay = {
    admin: { text: 'Admin', icon: '👑' },
    teacher: { text: 'Teacher', icon: '🎓' },
    student: { text: 'Student', icon: '🧑‍🎓' },
  };

  const currentUserRole = user ? roleDisplay[user.role] : { text: 'Guest', icon: '👤' };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md border-b border-white/10 z-10"
    >
      <div className="flex items-center gap-4">
        <motion.div
          className="text-2xl font-orbitron font-bold text-cyan-DEFAULT"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.3 }}
        >
          AI Attend
        </motion.div>
        {user && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="px-3 py-1 bg-violet/20 text-violet rounded-full text-xs font-orbitron font-bold uppercase tracking-wider border border-violet/30"
          >
            {currentUserRole.icon} {currentUserRole.text}
          </motion.span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full text-text-muted hover:bg-white/10 hover:text-white transition-colors"
        >
          <Bell size={20} />
        </motion.button>
        <div className="w-8 h-8 rounded-full bg-cyan-DEFAULT/20 flex items-center justify-center text-cyan-DEFAULT font-bold text-sm">
          {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle size={20} />}
        </div>
      </div>
    </motion.header>
  );
};

export default TopBar;