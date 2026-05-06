import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, Play, 
  Video, 
  RefreshCw, Monitor,
  Settings,
  Activity,
  Save,
  Info
} from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import GlassCard from '../../components/GlassCard';
import PageTransition from '../../components/PageTransition';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/ConfirmModal';
import AISpinner from '../../components/AISpinner';
import { motion, AnimatePresence } from 'framer-motion';

const CameraMappingPage = () => {
  const [cameras, setCameras] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState(null);

  const [formData, setFormData] = useState({
    classroom_id: '',
    name: '',
    camera_type: 'Webcam',
    source_url: '0',
    position: 'Front',
    resolution: '1280x720',
    fps: 30,
    status: 'Active',
    is_primary: false,
    notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [camRes, roomRes] = await Promise.all([
        api.get('/admin/cameras'),
        api.get('/admin/classrooms')
      ]);
      setCameras(camRes.data);
      setClassrooms(roomRes.data);
    } catch {
      toast.error('Failed to fetch surveillance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleAddCamera = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/cameras', formData);
      toast.success('✅ Camera unit registered and mapped.');
      setIsDrawerOpen(false);
      fetchData();
      setFormData({
        classroom_id: '',
        name: '',
        camera_type: 'Webcam',
        source_url: '0',
        position: 'Front',
        resolution: '1280x720',
        fps: 30,
        status: 'Active',
        is_primary: false,
        notes: ''
      });
    } catch {
      // Handled by api.js
    }
  };

  const confirmDelete = (cam) => {
    setCameraToDelete(cam);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/cameras/${cameraToDelete.id}`);
      toast.success('Camera mapping deleted.');
      fetchData();
    } catch {
      // Handled by api.js
    }
  };

  const testCamera = async (id) => {
    try {
      setTestingId(id);
      const res = await api.post(`/admin/cameras/${id}/test`);
      if (res.data.success) {
        toast.success(`Active: ${res.data.resolution} @ ${res.data.fps} FPS`);
        fetchData();
      } else {
        toast.error(`Offline: ${res.data.error}`);
      }
    } catch {
      toast.error('Signal lost');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <Video className="text-cyan-DEFAULT" size={32} />
              Surveillance <span className="text-cyan-DEFAULT">Matrix</span>
            </h1>
            <p className="text-text-muted mt-2 font-dm">Architect the AI-powered visual input layer across the institution.</p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-gradient-to-r from-cyan-DEFAULT to-violet text-white px-6 py-4 rounded-2xl font-orbitron font-bold tracking-widest uppercase flex items-center gap-3 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:scale-105 transition-all group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Register Camera
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <AISpinner size="lg" />
            <p className="mt-8 font-orbitron text-xs font-bold text-cyan-DEFAULT uppercase tracking-widest animate-pulse">Initializing surveillance data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {cameras.map(camera => (
              <GlassCard key={camera.id} className="relative overflow-hidden group" glowColor={camera.current_status === 'Online' ? 'success' : 'cyan'}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
                      {camera.name}
                      {camera.is_primary && (
                        <span className="bg-cyan-DEFAULT/10 text-cyan-DEFAULT text-[8px] px-2 py-0.5 rounded-full border border-cyan-DEFAULT/20 font-orbitron">PRIMARY</span>
                      )}
                    </h3>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-1 font-orbitron uppercase tracking-tighter">
                      <Monitor size={12} className="text-cyan-DEFAULT" /> {camera.classroom_name}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold font-orbitron uppercase tracking-widest border transition-all ${
                    camera.current_status === 'Online' ? 'bg-success/10 text-success border-success/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' :
                    camera.current_status === 'Error' ? 'bg-danger/10 text-danger border-danger/30 animate-pulse' : 
                    'bg-white/5 text-text-muted border-white/10'
                  }`}>
                    {camera.current_status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                   {[
                      { label: 'Type', value: camera.camera_type },
                      { label: 'Position', value: camera.position },
                      { label: 'Resolution', value: camera.resolution },
                      { label: 'FPS', value: `${camera.fps} Hz` },
                   ].map((item, i) => (
                      <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                        <p className="text-[8px] text-text-muted font-orbitron uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-xs font-bold text-white font-mono">{item.value}</p>
                      </div>
                   ))}
                </div>

                <div className="text-[10px] font-mono text-text-muted mb-6 bg-black/40 p-2 rounded-lg border border-white/5 truncate flex items-center gap-2">
                   <Activity size={10} className="text-cyan-DEFAULT" />
                   Source: {camera.source_url}
                </div>

                <div className="flex gap-3 relative z-10">
                  <button 
                    onClick={() => testCamera(camera.id)}
                    disabled={testingId === camera.id}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 flex items-center justify-center gap-2 text-[10px] font-orbitron font-bold uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    {testingId === camera.id ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Sync
                  </button>
                  <button 
                    onClick={() => setPreviewId(camera.id === previewId ? null : camera.id)}
                    className={`flex-1 rounded-xl py-3 flex items-center justify-center gap-2 text-[10px] font-orbitron font-bold uppercase tracking-widest transition-all ${
                       previewId === camera.id ? 'bg-cyan-DEFAULT text-cosmic shadow-[0_0_15px_#00F5FF]' : 'bg-cyan-DEFAULT/10 text-cyan-DEFAULT border border-cyan-DEFAULT/20 hover:bg-cyan-DEFAULT/20'
                    }`}
                  >
                    <Play size={14} /> {previewId === camera.id ? 'Offline' : 'Matrix'}
                  </button>
                  <button 
                    onClick={() => confirmDelete(camera)}
                    className="w-12 bg-danger/10 border border-danger/20 rounded-xl flex items-center justify-center text-danger hover:bg-danger hover:text-white transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <AnimatePresence>
                  {previewId === camera.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 192, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 -mx-6 -mb-6 bg-black relative overflow-hidden"
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                         <div className="w-12 h-12 rounded-full border-2 border-danger border-t-transparent animate-spin mb-4" />
                         <div className="animate-pulse text-danger font-orbitron font-black text-xs tracking-widest flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-danger" /> 🔴 SIGNAL DETECTED
                         </div>
                         <p className="text-[10px] text-text-muted font-mono max-w-[200px]">Simulated stream initialized for {camera.name}. AI core ready.</p>
                      </div>
                      {/* Grid overlay for aesthetic */}
                      <div className="absolute inset-0 pointer-events-none opacity-20" 
                           style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            ))}
          </div>
        )}

        <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Surveillance Core Registry">
           <form onSubmit={handleAddCamera} className="space-y-6">
              <div className="space-y-1">
                 <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <Monitor size={12} /> Target Sector
                 </label>
                 <select 
                    required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT cursor-pointer appearance-none"
                    value={formData.classroom_id}
                    onChange={e => setFormData({...formData, classroom_id: e.target.value})}
                 >
                    <option value="" className="bg-cosmic">Choose Deployment Zone...</option>
                    {classrooms.map(room => (
                      <option key={room.id} value={room.id} className="bg-cosmic">{room.room_name} — {room.location}</option>
                    ))}
                 </select>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Device Name</label>
                 <input 
                    type="text" required value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT transition-all" 
                    placeholder="e.g. AXIS-01-HUB" 
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Hardware Type</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT appearance-none cursor-pointer"
                      value={formData.camera_type} onChange={e => setFormData({...formData, camera_type: e.target.value})}>
                      {['Webcam', 'USB Camera', 'CCTV', 'IP Camera'].map(t => <option key={t} value={t} className="bg-cosmic">{t}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Orbital Position</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT appearance-none cursor-pointer"
                      value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})}>
                      {['Front', 'Back', 'Door', 'Ceiling'].map(p => <option key={p} value={p} className="bg-cosmic">{p}</option>)}
                    </select>
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <Settings size={12} /> Signal Source (RTSP / INDEX)
                 </label>
                 <input 
                    type="text" required value={formData.source_url} 
                    onChange={e => setFormData({...formData, source_url: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT font-mono transition-all" 
                    placeholder="0 or rtsp://..." 
                 />
              </div>

              <div className="flex items-center gap-3 p-4 bg-cyan-DEFAULT/5 border border-cyan-DEFAULT/20 rounded-2xl">
                 <div className="relative flex h-4 w-4">
                    <input 
                       type="checkbox" id="is_primary" checked={formData.is_primary} 
                       onChange={e => setFormData({...formData, is_primary: e.target.checked})}
                       className="peer h-4 w-4 opacity-0 cursor-pointer z-10"
                    />
                    <div className="absolute inset-0 h-4 w-4 border-2 border-cyan-DEFAULT rounded flex items-center justify-center peer-checked:bg-cyan-DEFAULT transition-all">
                       {formData.is_primary && <div className="w-2 h-2 bg-cosmic rounded-sm" />}
                    </div>
                 </div>
                 <label htmlFor="is_primary" className="text-xs font-bold text-white font-orbitron uppercase tracking-widest cursor-pointer select-none">Primary Node</label>
                 <Info size={14} className="text-text-muted ml-auto" />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-DEFAULT to-violet text-white font-orbitron font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_40px_rgba(0,245,255,0.5)] transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                <Save size={20} />
                INITIALIZE UNIT
              </button>
           </form>
        </Drawer>

        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Decommission Unit?"
          message={`Are you sure you want to decommission ${cameraToDelete?.name}? This will sever the visual link to ${cameraToDelete?.classroom_name}.`}
          confirmText="Confirm Deletion"
          variant="danger"
        />
      </div>
    </PageTransition>
  );
};

export default CameraMappingPage;
