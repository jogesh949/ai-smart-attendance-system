import { useState, useEffect } from 'react';
import { Camera, Users, Activity, Play, Square, Download, UserPlus, RefreshCcw, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { usePolling } from '../hooks/usePolling';
import GlassCard from '../components/GlassCard';
import AnimatedCounter from '../components/AnimatedCounter';
import CircularProgress from '../components/CircularProgress';
import StatusBadge from '../components/StatusBadge';
import HUDFrame from '../components/HUDFrame';
import PageTransition from '../components/PageTransition';
import confetti from 'canvas-confetti';
import ConfirmModal from '../components/ConfirmModal';
import { motion } from 'framer-motion';

const TeacherDashboard = () => {
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, rate: 0 });
  const [isLive, setIsLive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false); // New state for camera stream status
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

  // Polling for attendance updates every 3s
  usePolling(async () => {
    if (isLive && session) {
      // Check session status every 100 frames to reduce DB load
      // This logic is better placed in the generate_frames function on the backend
      // For frontend polling, we just check if the session is still active
      try {
        const res = await api.get(`/attendance/session/${session.id}`);
        const newAttendance = res.data.logs;

        // Check for newly detected students and show toast
        newAttendance.forEach(newLog => {
          if (newLog.status === 'present' && !attendance.some(oldLog => oldLog.student_id === newLog.student_id && oldLog.status === 'present')) {
            toast.success(`👁️ ${newLog.student_name} recognized and marked present!`);
          }
        });

        setAttendance(newAttendance);
        const presentCount = newAttendance.filter(l => l.status === 'present').length;
        const total = newAttendance.length;
        const rate = total > 0 ? (presentCount / total) * 100 : 0;
        
        // Confetti burst for 100% attendance
        if (rate === 100 && stats.rate < 100 && total > 0) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          toast.success("🎊 Perfect attendance today! Amazing class!");
        }
        setStats({ present: presentCount, absent: total - presentCount, rate });
      } catch (err) {
        console.error(err);
      }
    }
  }, 3000);

  const startSession = async () => {
    if (!selectedClass || !selectedSubject) {
      toast.error("Please select class and subject first.");
      return;
    }
    try {
      const res = await api.post('/attendance/start', { 
        class_id: selectedClass, 
        subject_id: selectedSubject 
      });
      setSession(res.data);
      setIsLive(true);
      toast.success("🚀 Session is live! AI surveillance active.");
      setIsStartConfirmOpen(false);
      setIsCameraActive(true); // Assume camera starts active with session
    } catch (err) {
      console.error(err);
    }
  };

  const endSession = async () => {
    try {
      await api.post(`/attendance/end/${session.id}`);
      setIsLive(false);
      setSession(null);
      setIsCameraActive(false); // Camera stops with session
      setIsEndConfirmOpen(false);
      toast.success("✅ Session complete! Great class today.");
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = async () => {
    if (!session) return;
    try {
      const response = await api.get(`/attendance/export/${session.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_session_${session.id}.csv`);
      document.body.appendChild(link);
      link.target = '_blank'; // Open in new tab
      link.click();
      toast.success("📥 Report downloaded! Check your downloads folder.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualOverride = async (log) => {
    if (log.status === 'present') return;
    // This should ideally use a ConfirmModal too, but for now, keep it simple
    if (!window.confirm(`Are you sure you want to manually mark ${log.student_name} as present?`)) return;

    try {
      await api.post(`/attendance/manual-mark`, { 
        session_id: session.id, 
        student_id: log.student_id,
        status: 'present'
      });
      toast.success(`🖊️ ${log.student_name} marked present manually.`);
      const res = await api.get(`/attendance/session/${session.id}`);
      setAttendance(res.data.logs);
    } catch (err) {
      console.error(err);
      // Check if the error is due to session not being active or student not found
      if (err.response?.status === 400) {
        toast.error(err.response.data.detail || "Failed to manually mark attendance.");
      }
    }
  };

  return (
    <PageTransition>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Live AI Feed */}
        <div className="lg:col-span-2 space-y-8">
          <GlassCard className="relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-danger animate-pulse' : 'bg-text-muted'}`} />
                <h2 className="font-orbitron font-bold text-white uppercase tracking-widest text-lg">
                  {isLive ? 'Live AI Feed' : 'Camera Standby'}
                </h2>
              </div>
              {isLive && (
                <div className="flex items-center gap-4 text-[10px] font-mono text-cyan-DEFAULT">
                  <span>FPS: 24.5</span>
                  <span>BITRATE: 4.2 Mbps</span>
                </div>
              )}
            </div>

            <HUDFrame active={isLive && isCameraActive}>
              <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center relative overflow-hidden">
                {isLive && isCameraActive ? (
                  <img
                    src={`${api.defaults.baseURL}/attendance/live-feed/${session?.id}`} 
                    alt="AI Camera Feed"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center space-y-4">
                    <Camera size={48} className="text-text-muted mx-auto opacity-20" />
                    <p className="text-text-muted font-orbitron text-xs tracking-widest uppercase opacity-50">{isLive ? "AI Feed Loading..." : "Camera Disconnected"}</p>
                  </div>
                )}
                
                {isLive && isCameraActive && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-danger/20 border border-danger/40 px-2 py-1 rounded backdrop-blur-md z-20">
                    <div className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse" />
                    <span className="text-[10px] font-orbitron font-bold text-danger uppercase tracking-tighter">AI Active</span>
                  </div>
                )}
              </div>
            </HUDFrame>

            {!isLive && (
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Select Class</label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-DEFAULT transition-all"
                  >
                    <option value="">Choose Class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Select Subject</label>
                  <select 
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-DEFAULT transition-all"
                  >
                    <option value="">Choose Subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-4">
              {!isLive ? (
                <button
                  onClick={() => setIsStartConfirmOpen(true)}
                  className="flex-1 bg-gradient-to-r from-success to-emerald-600 text-white font-orbitron font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-3 group"
                >
                  <Play size={20} className="group-hover:scale-110 transition-transform" />
                  START SESSION
                </button>
              ) : (
                <button
                  onClick={endSession} // This should trigger a confirmation modal
                  className="flex-1 bg-gradient-to-r from-danger to-rose-600 text-white font-orbitron font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-3 group"
                >
                  <Square size={20} className="group-hover:scale-110 transition-transform" />
                  END SESSION
                </button>
              )}
              <button
                onClick={exportCSV}
                disabled={!session && !isLive}
                className="px-8 bg-white/5 border border-white/10 text-white font-orbitron font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 group disabled:opacity-20"
              >
                <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                EXPORT
              </button>
            </div>
          </GlassCard>
        </div>
        
        {/* Right Column: Stats & List */}
        <div className="space-y-8">
          <GlassCard glowColor="violet">
            <h2 className="font-orbitron font-bold text-white uppercase tracking-widest text-sm mb-8 flex items-center gap-2">
              <Activity className="text-violet" size={18} />
              Session Insights
            </h2>
            <div className="flex justify-around items-center">
              <CircularProgress value={stats.rate} label="Present Rate" color="var(--color-violet-DEFAULT)" />
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Present</p>
                  <p className="text-3xl font-orbitron font-bold text-white">
                    <AnimatedCounter end={stats.present} key={`present-${stats.present}`} />
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Absent</p>
                  <p className="text-3xl font-orbitron font-bold text-danger">
                    <AnimatedCounter end={stats.absent} key={`absent-${stats.absent}`} />
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="flex-1 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-orbitron font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2">
                <Users className="text-cyan-DEFAULT" size={18} />
                Student Roster
              </h2>
              <RefreshCcw className={`text-text-muted ${isLive ? 'animate-spin' : ''}`} size={14} />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {attendance.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-sm">
                  <UserPlus size={48} className="mb-4" />
                  Waiting for detections...
                </div>
              ) : (
                attendance.map((log) => (
                  <motion.div
                    key={log.student_id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleManualOverride(log)}
                    className={`flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 transition-all group ${log.status === 'absent' ? 'cursor-pointer hover:border-cyan-DEFAULT/30 hover:bg-white/10' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-DEFAULT/10 to-violet/10 flex items-center justify-center font-bold text-cyan-DEFAULT border border-white/10 group-hover:border-cyan-DEFAULT/50 transition-colors">
                        {log.student_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{log.student_name}</p>
                        <p className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                          ID: {log.student_id}
                          {log.status === 'absent' && <Edit size={10} className="opacity-0 group-hover:opacity-100 ml-1 text-cyan-DEFAULT" />}
                        </p>
                      </div>
                    </div>
                    <StatusBadge variant={log.status} />
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Start Session Confirmation Modal */}
      <ConfirmModal
        isOpen={isStartConfirmOpen}
        onClose={() => setIsStartConfirmOpen(false)}
        onConfirm={startSession}
        title="Initiate New Session?"
        message={`Are you sure you want to start a new attendance session for ${classes.find(c => c.id == selectedClass)?.name} - ${subjects.find(s => s.id == selectedSubject)?.name}?`}
        confirmText="Start Session"
      />

      {/* End Session Confirmation Modal */}
      <ConfirmModal
        isOpen={isEndConfirmOpen}
        onClose={() => setIsEndConfirmOpen(false)}
        onConfirm={endSession}
        title="Terminate Current Session?"
        message="Ending the session will finalize attendance records. You can still manually adjust them later."
        confirmText="End Session"
        variant="danger"
      />
    </PageTransition>
  );
};

export default TeacherDashboard;
