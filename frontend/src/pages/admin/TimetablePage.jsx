import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Trash2, Clock, MapPin, Users, BookOpen, Layers, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import GlassCard from '../../components/GlassCard';
import PageTransition from '../../components/PageTransition';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/ConfirmModal';

const TimetablePage = () => {
  const [data, setData] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [formData, setFormData] = useState({
    day: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    class_id: '',
    subject_id: '',
    teacher_id: '',
    classroom_id: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [ttRes, clsRes, subRes, tchRes, roomRes] = await Promise.all([
        api.get('/admin/timetables'),
        api.get('/admin/classes'),
        api.get('/admin/subjects'),
        api.get('/admin/teachers'),
        api.get('/admin/classrooms')
      ]);
      setData(ttRes.data);
      setClasses(clsRes.data);
      setSubjects(subRes.data);
      setTeachers(tchRes.data);
      setClassrooms(roomRes.data);
    } catch {
      toast.error('Failed to load scheduling data');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/timetables', {
        ...formData,
        class_id: Number(formData.class_id),
        subject_id: Number(formData.subject_id),
        teacher_id: Number(formData.teacher_id),
        classroom_id: Number(formData.classroom_id)
      });
      toast.success('✅ Schedule entry preserved.');
      setIsDrawerOpen(false);
      fetchData();
    } catch {
      // Handled by api.js
    }
  };

  const confirmDelete = (entry) => {
    setEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/timetables/${entryToDelete.id}`);
      toast.success('Schedule entry deleted.');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <Calendar className="text-cyan-DEFAULT" size={32} />
              Chrono <span className="text-cyan-DEFAULT">Mapping</span>
            </h1>
            <p className="text-text-muted mt-2 font-dm">Architect the institutional schedule and resource allocation.</p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-gradient-to-r from-cyan-DEFAULT to-violet text-white px-6 py-4 rounded-2xl font-orbitron font-bold tracking-widest uppercase flex items-center gap-3 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:scale-105 transition-all group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Add Schedule
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {days.map(day => (
            <div key={day} className="space-y-4">
              <h3 className="font-orbitron text-xs font-bold text-white uppercase tracking-[0.3em] flex items-center gap-2 pl-2">
                <div className="w-1 h-4 bg-cyan-DEFAULT rounded-full" />
                {day}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.filter(t => t.day === day).length === 0 ? (
                  <div className="col-span-full py-8 text-center glass rounded-2xl border-white/5 text-text-muted italic text-sm opacity-50">
                    No active sessions mapped for this day.
                  </div>
                ) : (
                  data.filter(t => t.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time)).map((item) => (
                    <GlassCard key={item.id} className="relative group" glowColor="cyan">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2 text-cyan-DEFAULT bg-cyan-DEFAULT/10 px-2 py-1 rounded border border-cyan-DEFAULT/20 font-mono text-xs font-bold">
                             <Clock size={12} /> {item.start_time} - {item.end_time}
                          </div>
                          <button 
                            onClick={() => confirmDelete(item)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
                          >
                             <Trash2 size={14} />
                          </button>
                       </div>
                       
                       <div className="space-y-3">
                          <h4 className="text-white font-black text-lg tracking-tight uppercase">{item.subject_name}</h4>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                             <Layers size={14} />
                             <span className="font-bold text-violet">{item.class_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                             <Users size={14} />
                             <span>{item.teacher_name}</span>
                          </div>
                          <div className="pt-2 flex items-center gap-2 text-[10px] font-orbitron text-cyan-DEFAULT/60 uppercase tracking-widest">
                             <MapPin size={10} /> {item.classroom_name}
                          </div>
                       </div>
                    </GlassCard>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Add Schedule Entry">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Select Day</label>
              <select 
                required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT appearance-none cursor-pointer" 
                value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})}
              >
                {days.map(d => <option key={d} value={d} className="bg-cosmic">{d}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Start Time</label>
                  <input 
                    type="time" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT" 
                    value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} 
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">End Time</label>
                  <input 
                    type="time" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT" 
                    value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} 
                  />
               </div>
            </div>

            <div className="space-y-4">
               {[
                  { label: 'Target Class', icon: <Layers size={14} />, state: 'class_id', options: classes, key: 'id', name: 'name' },
                  { label: 'Assigned Subject', icon: <BookOpen size={14} />, state: 'subject_id', options: subjects, key: 'id', name: 'name' },
                  { label: 'Assigned Teacher', icon: <Users size={14} />, state: 'teacher_id', options: teachers, key: 'id', name: 'name' },
                  { label: 'Spatial Room', icon: <MapPin size={14} />, state: 'classroom_id', options: classrooms, key: 'id', name: 'room_name' },
               ].map((field, i) => (
                  <div key={i} className="space-y-1">
                     <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest flex items-center gap-2">
                        {field.icon} {field.label}
                     </label>
                     <select 
                        required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT appearance-none cursor-pointer"
                        value={formData[field.state]} onChange={e => setFormData({...formData, [field.state]: e.target.value})}
                     >
                        <option value="" className="bg-cosmic">Select {field.label}...</option>
                        {field.options.map(opt => <option key={opt[field.key]} value={opt[field.key]} className="bg-cosmic">{opt[field.name]}</option>)}
                     </select>
                  </div>
               ))}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-DEFAULT to-violet text-white font-orbitron font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_40px_rgba(0,245,255,0.5)] transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              <Save size={20} />
              PRESERVE MAPPING
            </button>
          </form>
        </Drawer>

        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Schedule mapping?"
          message={`Are you sure you want to remove this timetable entry? This will permanently delete the scheduled session from the academic calendar.`}
          confirmText="Delete Entry"
          variant="danger"
        />
      </div>
    </PageTransition>
  );
};

export default TimetablePage;
