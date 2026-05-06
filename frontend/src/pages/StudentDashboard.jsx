import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, Award, TrendingUp, Clock } from 'lucide-react';
import api from '../api';
import GlassCard from '../components/GlassCard';
import CircularProgress from '../components/CircularProgress';
import PageTransition from '../components/PageTransition';

const StudentDashboard = () => {
  const [stats, setStats] = useState({ overall: 0, totalClasses: 0, attended: 0 });
  const [subjects, setSubjects] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/student/dashboard');
        setStats(res.data.stats);
        setSubjects(res.data.subjects);
        setRecentSessions(res.data.recent_sessions);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getStatusMessage = (rate) => {
    if (rate >= 75) return { text: "Great work! 🌟", color: "text-success" };
    if (rate >= 50) return { text: "You can do better! 💪", color: "text-yellow-400" };
    return { text: "⚠️ Attendance critical! Please attend classes.", color: "text-danger" };
  };

  const status = getStatusMessage(stats.overall);

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-8 rounded-3xl bg-gradient-to-r from-cyan-DEFAULT/20 to-violet/20 border border-white/10 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Award size={120} className="text-cyan-DEFAULT" />
          </div>
          <h1 className="font-orbitron text-3xl font-black text-white tracking-tight">
            {getGreeting()}, <span className="text-cyan-DEFAULT">{user?.name}!</span>
          </h1>
          <p className="text-text-muted mt-2 font-dm">
            Here's your attendance overview for this semester. Keep up the momentum!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Attendance Ring */}
          <GlassCard className="flex flex-col items-center justify-center py-12" glowColor="cyan">
            <CircularProgress value={stats.overall} max={100} label="Overall Attendance" color="#00F5FF" />
            <div className="mt-8 text-center">
              <p className={`font-orbitron font-bold text-lg ${status.color}`}>
                {status.text}
              </p>
              <p className="text-text-muted text-sm mt-1">
                You've attended <span className="text-white font-bold">{stats.attended}</span> out of <span className="text-white font-bold">{stats.totalClasses}</span> classes.
              </p>
            </div>
          </GlassCard>

          {/* Quick Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard glowColor="violet" className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-violet/10 flex items-center justify-center border border-violet/20">
                <TrendingUp className="text-violet" size={32} />
              </div>
              <div>
                <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Growth</p>
                <p className="text-2xl font-orbitron font-bold text-white">+5.2%</p>
                <p className="text-xs text-success mt-1">vs last month</p>
              </div>
            </GlassCard>

            <GlassCard glowColor="cyan" className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-cyan-DEFAULT/10 flex items-center justify-center border border-cyan-DEFAULT/20">
                <Clock className="text-cyan-DEFAULT" size={32} />
              </div>
              <div>
                <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Next Class</p>
                <p className="text-2xl font-orbitron font-bold text-white">10:30 AM</p>
                <p className="text-xs text-text-muted mt-1">Advanced Physics</p>
              </div>
            </GlassCard>

            <div className="md:col-span-2">
              <GlassCard className="h-full">
                <h3 className="font-orbitron font-bold text-white text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                  <BookOpen className="text-cyan-DEFAULT" size={18} />
                  Subject-wise Breakdown
                </h3>
                <div className="space-y-6">
                  {subjects.map((sub, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white">{sub.name}</span>
                        <span className="text-cyan-DEFAULT font-mono">{sub.percentage}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${sub.percentage}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                          className="h-full bg-gradient-to-r from-cyan-DEFAULT to-violet shadow-[0_0_10px_#00F5FF]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* Recent Sessions Table */}
        <GlassCard>
          <h3 className="font-orbitron font-bold text-white text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <Calendar className="text-violet" size={18} />
            Recent Attendance History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-orbitron text-text-muted uppercase tracking-widest">
                  <th className="pb-4">Subject</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Session Type</th>
                  <th className="pb-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentSessions.map((session, idx) => (
                  <tr key={idx} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 font-bold text-white">{session.subject}</td>
                    <td className="py-4 text-text-muted">{session.date}</td>
                    <td className="py-4 text-text-muted">{session.type || 'Lecture'}</td>
                    <td className="py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${
                        session.status === 'present' 
                        ? 'bg-success/10 text-success border-success/30' 
                        : 'bg-danger/10 text-danger border-danger/30'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
};

export default StudentDashboard;
