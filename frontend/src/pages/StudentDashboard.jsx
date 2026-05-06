import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, BookOpen, Award, TrendingUp, ShieldCheck, Target } from 'lucide-react';
import api from '../api';
import GlassCard from '../components/GlassCard';
import CircularProgress from '../components/CircularProgress';
import PageTransition from '../components/PageTransition';
import AnimatedCounter from '../components/AnimatedCounter';

const StudentDashboard = () => {
  const [stats, setStats] = useState({ overall: 0, totalClasses: 0, attended: 0 });
  const [subjects, setSubjects] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/student/dashboard');
      setStats(res.data.stats);
      setSubjects(res.data.subjects);
      setRecentSessions(res.data.recent_sessions);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Systems Online: Good Morning";
    if (hour < 18) return "Systems Online: Good Afternoon";
    return "Systems Online: Good Evening";
  };

  const getStatusMessage = (rate) => {
    if (rate >= 75) return { text: "OPERATIONAL EXCELLENCE 🌟", color: "text-success", shadow: "shadow-success/20" };
    if (rate >= 50) return { text: "NEEDS OPTIMIZATION 💪", color: "text-yellow-400", shadow: "shadow-yellow-400/20" };
    return { text: "CRITICAL ALERT ⚠️", color: "text-danger", shadow: "shadow-danger/20" };
  };

  const status = getStatusMessage(stats.overall);

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Immersive Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative p-10 rounded-[2rem] bg-gradient-to-br from-cyan-DEFAULT/10 via-violet/5 to-transparent border border-white/10 overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 opacity-10 blur-2xl w-80 h-80 bg-cyan-DEFAULT rounded-full" />
          <div className="absolute top-0 right-0 p-12 opacity-20">
            <Award size={140} className="text-cyan-DEFAULT animate-float" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-success rounded-full animate-ping" />
              <span className="text-[10px] font-orbitron font-bold text-success uppercase tracking-widest">{getGreeting()}</span>
            </div>
            <h1 className="font-orbitron text-4xl font-black text-white tracking-tight uppercase">
              Welcome Back, <span className="text-cyan-DEFAULT">{user?.name}!</span>
            </h1>
            <p className="text-text-muted mt-4 font-dm max-w-xl text-lg leading-relaxed">
              Your biometric profile is active. You have maintained a <span className="text-white font-bold">{stats.overall}%</span> engagement rate this term. 
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Attendance Ring */}
          <GlassCard className="lg:col-span-1 flex flex-col items-center justify-center py-12" glowColor="cyan">
            <CircularProgress value={stats.overall} max={100} label="Engagement" color="#00F5FF" />
            <div className="mt-8 text-center px-4">
              <p className={`font-orbitron font-black text-xs tracking-tighter px-3 py-1 rounded-full border ${status.color} border-current/20 bg-white/5 mb-3 inline-block`}>
                {status.text}
              </p>
              <p className="text-text-muted text-xs font-dm leading-relaxed">
                Verification complete for <span className="text-white font-bold">{stats.attended}</span> out of <span className="text-white font-bold">{stats.totalClasses}</span> authorized class sessions.
              </p>
            </div>
          </GlassCard>

          {/* Core Analytics */}
          <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <GlassCard glowColor="violet" className="p-6 h-full flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                     <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Global Rank</p>
                     <Target className="text-violet" size={16} />
                   </div>
                   <div className="mt-4">
                     <p className="text-3xl font-orbitron font-black text-white">#12</p>
                     <p className="text-[10px] text-success font-bold mt-1">TOP 5% OF CLASS</p>
                   </div>
                </GlassCard>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <GlassCard glowColor="cyan" className="p-6 h-full flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                     <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Streak</p>
                     <ShieldCheck className="text-cyan-DEFAULT" size={16} />
                   </div>
                   <div className="mt-4">
                     <p className="text-3xl font-orbitron font-black text-white">
                       <AnimatedCounter end={8} /> Days
                     </p>
                     <p className="text-[10px] text-cyan-DEFAULT font-bold mt-1">BIOMETRIC CONSISTENCY</p>
                   </div>
                </GlassCard>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <GlassCard glowColor="success" className="p-6 h-full flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                     <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Growth</p>
                     <TrendingUp className="text-success" size={16} />
                   </div>
                   <div className="mt-4">
                     <p className="text-3xl font-orbitron font-black text-white">+5.2%</p>
                     <p className="text-[10px] text-text-muted font-bold mt-1">VS PREVIOUS MONTH</p>
                   </div>
                </GlassCard>
              </motion.div>
            </div>

            <GlassCard className="p-8">
              <h3 className="font-orbitron font-bold text-white text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                <BookOpen className="text-cyan-DEFAULT" size={18} />
                Subject Engagement Matrix
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {subjects.map((sub, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-xs font-black text-white group-hover:text-cyan-DEFAULT transition-colors uppercase tracking-tight">{sub.name}</p>
                        <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">MODULE-ID: {idx + 100}</p>
                      </div>
                      <span className="text-lg font-orbitron font-black text-white group-hover:text-cyan-DEFAULT transition-colors">{sub.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sub.percentage}%` }}
                        transition={{ duration: 1.5, delay: idx * 0.1, ease: "circOut" }}
                        className={`h-full bg-gradient-to-r ${idx % 2 === 0 ? 'from-cyan-DEFAULT to-blue-500 shadow-[0_0_15px_rgba(0,245,255,0.4)]' : 'from-violet to-fuchsia-500 shadow-[0_0_15px_rgba(124,58,237,0.4)]'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Recent Sessions Table */}
        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h3 className="font-orbitron font-bold text-white uppercase tracking-widest text-sm flex items-center gap-3">
              <Calendar className="text-violet" size={18} />
              Biometric Activity Log
            </h3>
            <span className="text-[10px] font-mono text-text-muted">TOTAL RECORDS: {recentSessions.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] font-orbitron text-text-muted uppercase tracking-widest">
                  <th className="px-6 py-4">Session Target</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Authentication Type</th>
                  <th className="px-6 py-4 text-right">Uplink Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <AnimatePresence mode="popLayout">
                  {recentSessions.map((session, idx) => (
                    <motion.tr 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group border-b border-white/5 hover:bg-cyan-DEFAULT/5 transition-all"
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-white group-hover:text-cyan-DEFAULT transition-colors">{session.subject}</span>
                          <span className="text-[9px] font-mono text-text-muted mt-1 uppercase">NODE: RE-0{idx+1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-text-muted font-mono text-xs">{session.date}</td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-orbitron text-white opacity-40 uppercase tracking-widest">{session.type || 'Standard Lecture'}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                          session.status === 'present' 
                          ? 'bg-success/10 text-success border-success/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                          : 'bg-danger/10 text-danger border-danger/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                        }`}>
                          {session.status === 'present' ? 'VERIFIED' : 'ABSENT'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
};

export default StudentDashboard;
