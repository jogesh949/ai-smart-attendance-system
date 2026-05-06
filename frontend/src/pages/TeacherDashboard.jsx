import { useState, useEffect, useCallback } from 'react';
import { Camera, Users, Play, Square, Download, UserPlus, RefreshCcw, Monitor, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { usePolling } from '../hooks/usePolling';
import GlassCard from '../components/GlassCard';
import AnimatedCounter from '../components/AnimatedCounter';
import StatusBadge from '../components/StatusBadge';
import HUDFrame from '../components/HUDFrame';
import PageTransition from '../components/PageTransition';
import confetti from 'canvas-confetti';
import ConfirmModal from '../components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherDashboard = () => {
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, rate: 0 });
  const [isLive, setIsLive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          api.get('/admin/classes'),
          api.get('/admin/subjects')
        ]);
        setClasses(classesRes.data);
        setSubjects(subjectsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const refreshRoster = useCallback(async () => {
    if (!session?.id) return;
    try {
      const res = await api.get(`/attendance/session/${session.id}`);
      const newAttendance = res.data.logs;
      
      newAttendance.forEach(newLog => {
        if (newLog.status === 'present' && !attendance.some(oldLog => oldLog.student_id === newLog.student_id && oldLog.status === 'present')) {
          toast.success(`👁️ ${newLog.student_name} recognized!`);
        }
      });

      setAttendance(newAttendance);
      const presentCount = newAttendance.filter(l => l.status === 'present').length;
      const total = newAttendance.length;
      const rate = total > 0 ? (presentCount / total) * 100 : 0;
      
      if (rate === 100 && stats.rate < 100 && total > 0) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        toast.success("🎊 Perfect attendance achieved!");
      }
      setStats({ present: presentCount, absent: total - presentCount, rate });
    } catch (err) {
      console.error(err);
    }
  }, [session, attendance, stats.rate]);

  usePolling(refreshRoster, 3000);

  const startSession = async () => {
    if (!selectedClass || !selectedSubject) {
      toast.error("Select Class and Subject.");
      return;
    }
    try {
      const res = await api.post('/attendance/start', { 
        class_id: selectedClass, 
        subject_id: selectedSubject 
      });
      setSession(res.data);
      setIsLive(true);
      setIsCameraActive(true);
      toast.success("🚀 AI Surveillance Active.");
      setIsStartConfirmOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const endSession = async () => {
    try {
      await api.post(`/attendance/end/${session.id}`);
      setIsLive(false);
      setSession(null);
      setIsCameraActive(false);
      setIsEndConfirmOpen(false);
      toast.success("✅ Session Finalized.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualOverride = async (log) => {
    if (log.status === 'present') return;
    try {
      await api.post(`/attendance/manual-mark`, { 
        session_id: session.id, 
        student_id: log.student_id,
        status: 'present'
      });
      toast.success(`🖊️ Manual entry for ${log.student_name} recorded.`);
      refreshRoster();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard glowColor="cyan" className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Active Stream</p>
                  <h3 className="text-2xl font-orbitron font-bold text-white mt-1">
                    {isLive ? 'SYSTEM LIVE' : 'STANDBY'}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl border ${isLive ? 'bg-danger/10 border-danger/20 text-danger animate-pulse' : 'bg-white/5 border-white/10 text-text-muted'}`}>
                  <Monitor size={20} />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard glowColor="success" className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Present</p>
                  <h3 className="text-3xl font-orbitron font-bold text-success mt-1">
                    <AnimatedCounter end={stats.present} />
                  </h3>
                </div>
                <div className="p-3 bg-success/10 rounded-xl border border-success/20 text-success">
                  <Users size={20} />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard glowColor="violet" className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Completion</p>
                  <h3 className="text-3xl font-orbitron font-bold text-violet mt-1">
                    <AnimatedCounter end={stats.rate} suffix="%" />
                  </h3>
                </div>
                <div className="p-3 bg-violet/10 rounded-xl border border-violet/20 text-violet">
                  <Zap size={20} />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Command Deck */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="overflow-hidden">
              <div className="p-1">
                <HUDFrame active={isLive && isCameraActive}>
                  <div className="aspect-video bg-black/60 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {isLive && isCameraActive ? (
                      <img
                        src={`${api.defaults.baseURL}/attendance/live-feed/${session?.id}`} 
                        alt="AI Camera Feed"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                          <Camera size={32} className="text-text-muted opacity-30" />
                        </div>
                        <p className="text-text-muted font-orbitron text-xs tracking-widest uppercase opacity-50">
                          {isLive ? "Establishing Uplink..." : "Module Disconnected"}
                        </p>
                      </div>
                    )}
                    
                    {isLive && isCameraActive && (
                      <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 border border-cyan-DEFAULT/30 px-3 py-2 rounded-lg backdrop-blur-xl z-20">
                        <div className="w-2 h-2 bg-cyan-DEFAULT rounded-full animate-ping" />
                        <span className="text-[10px] font-orbitron font-bold text-cyan-DEFAULT uppercase tracking-widest">AI CORE ACTIVE</span>
                      </div>
                    )}
                  </div>
                </HUDFrame>
              </div>

              <div className="p-8">
                {!isLive ? (
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest ml-1">Class Designation</label>
                      <select 
                        value={selectedClass} 
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-cyan-DEFAULT focus:bg-cyan-DEFAULT/5 transition-all appearance-none"
                      >
                        <option value="" className="bg-cosmic">Select Deployment...</option>
                        {classes.map(c => <option key={c.id} value={c.id} className="bg-cosmic">{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest ml-1">Academic Subject</label>
                      <select 
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-cyan-DEFAULT focus:bg-cyan-DEFAULT/5 transition-all appearance-none"
                      >
                        <option value="" className="bg-cosmic">Select Subject...</option>
                        {subjects.map(s => <option key={s.id} value={s.id} className="bg-cosmic">{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-8 p-4 bg-cyan-DEFAULT/5 border border-cyan-DEFAULT/10 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-cyan-DEFAULT/10 rounded-xl flex items-center justify-center text-cyan-DEFAULT border border-cyan-DEFAULT/20">
                        <Zap size={24} />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted font-orbitron uppercase tracking-widest">Active Session</p>
                        <p className="text-white font-bold">{subjects.find(s => s.id == session?.subject_id)?.name} — {classes.find(c => c.id == session?.class_id)?.name}</p>
                      </div>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-mono text-cyan-DEFAULT">UPLINK: SECURE</p>
                      <p className="text-[10px] font-mono text-text-muted">LATENCY: 42ms</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  {!isLive ? (
                    <button
                      onClick={() => setIsStartConfirmOpen(true)}
                      className="flex-1 bg-cyan-DEFAULT text-cosmic font-orbitron font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(0,245,255,0.3)] hover:shadow-[0_0_50px_rgba(0,245,255,0.5)] transition-all flex items-center justify-center gap-3 group active:scale-95"
                    >
                      <Play size={24} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                      ENGAGE AI CORE
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEndConfirmOpen(true)}
                      className="flex-1 bg-danger text-white font-orbitron font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-3 group active:scale-95"
                    >
                      <Square size={24} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                      TERMINATE UPLINK
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
          
          {/* Student Roster Side-panel */}
          <div className="space-y-6 flex flex-col h-full">
            <GlassCard className="flex-1 flex flex-col min-h-[600px] overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h2 className="font-orbitron font-bold text-white uppercase tracking-widest text-sm flex items-center gap-3">
                  <Users className="text-cyan-DEFAULT" size={18} />
                  Intelligence Roster
                </h2>
                <RefreshCcw className={`text-cyan-DEFAULT/50 ${isLive ? 'animate-spin' : ''}`} size={16} />
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {attendance.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center opacity-30 text-center px-8"
                    >
                      <UserPlus size={64} strokeWidth={1} className="mb-6 text-cyan-DEFAULT" />
                      <p className="font-orbitron text-xs tracking-widest uppercase">Waiting for biometric identification...</p>
                    </motion.div>
                  ) : (
                    attendance.map((log, idx) => (
                      <motion.div
                        key={log.student_id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleManualOverride(log)}
                        className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
                          ${log.status === 'present' 
                            ? 'bg-success/5 border-success/10' 
                            : 'bg-white/5 border-white/5 cursor-pointer hover:border-cyan-DEFAULT/30 hover:bg-cyan-DEFAULT/5'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border transition-colors
                            ${log.status === 'present' 
                              ? 'bg-success/10 text-success border-success/20' 
                              : 'bg-white/5 text-text-muted border-white/10 group-hover:border-cyan-DEFAULT/50 group-hover:text-cyan-DEFAULT'}`}>
                            {log.student_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white group-hover:text-cyan-DEFAULT transition-colors">{log.student_name}</p>
                            <p className="text-[10px] font-mono text-text-muted mt-1 uppercase">ID: {log.student_id.toString().padStart(4, '0')}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <StatusBadge variant={log.status} />
                           {log.status === 'absent' && (
                             <span className="text-[9px] font-orbitron text-cyan-DEFAULT opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">Manual Mark</span>
                           )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <div className="p-4 bg-white/5 border-t border-white/5">
                <button
                  onClick={() => toast.promise(api.get(`/attendance/export/${session?.id}`, { responseType: 'blob' }), {
                    loading: 'Generating Intelligence Report...',
                    success: 'Report ready for download!',
                    error: 'Export failed.'
                  }).then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `report_session_${session?.id}.csv`);
                    document.body.appendChild(link);
                    link.click();
                  })}
                  disabled={!session}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-orbitron font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-20 border border-white/10 group"
                >
                  <Download size={18} className="group-hover:-translate-y-1 transition-transform" />
                  GENERATE EXPORT
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isStartConfirmOpen}
        onClose={() => setIsStartConfirmOpen(false)}
        onConfirm={startSession}
        title="Initiate Bio-Sync?"
        message={`Authorize AI core to begin attendance tracking for ${classes.find(c => c.id == selectedClass)?.name}?`}
        confirmText="Confirm Authorization"
      />

      <ConfirmModal
        isOpen={isEndConfirmOpen}
        onClose={() => setIsEndConfirmOpen(false)}
        onConfirm={endSession}
        title="Seal Attendance Record?"
        message="This will finalize all biometric logs. Absence reports will be dispatched immediately."
        confirmText="Finalize & Seal"
        variant="danger"
      />
    </PageTransition>
  );
};

export default TeacherDashboard;
