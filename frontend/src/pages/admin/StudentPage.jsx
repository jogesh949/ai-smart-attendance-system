import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  Search, 
  GraduationCap, 
  Filter, 
  UserPlus, 
  Save, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle,
  Mail,
  Lock,
  Hash,
  School,
  ShieldCheck,
  Activity,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import PageTransition from '../../components/PageTransition';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';

const StudentPage = () => {
  const [data, setData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', class_id: '', roll_no: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentRes, classRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/classes')
      ]);
      setData(studentRes.data);
      setClasses(classRes.data);
    } catch {
      toast.error('Failed to load students or classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const departments = useMemo(() => {
    const depts = new Set(data.map(s => s.department_name).filter(Boolean));
    return ['All', ...Array.from(depts)];
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(student => {
      const matchesSearch = 
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = selectedDept === 'All' || student.department_name === selectedDept;
      
      return matchesSearch && matchesDept;
    });
  }, [data, searchQuery, selectedDept]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.class_id) return toast.error('Please select a class');
    
    try {
      await api.post('/admin/students', { ...formData, class_id: Number(formData.class_id) });
      toast.success(`🎉 Welcome aboard! ${formData.name} has joined the system.`);
      setIsDrawerOpen(false);
      setFormData({ name: '', email: '', password: '', class_id: '', roll_no: '' });
      setStep(1);
      fetchData();
    } catch (err) {
      // Error handled by api.js
    }
  };

  const confirmDelete = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/students/${studentToDelete.id}`);
      toast.success('Student record deleted successfully.');
      fetchData();
    } catch (err) {
      // Error handled by api.js
    }
  };

  const openDetail = async (student) => {
    try {
      const res = await api.get(`/admin/students/${student.id}/details`);
      setSelectedStudent(res.data);
      setIsDetailDrawerOpen(true);
    } catch {
      toast.error('Failed to load student details');
    }
  };

  const columns = [
    { 
      header: 'Student', 
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-DEFAULT/20 to-violet/20 flex items-center justify-center font-bold text-cyan-DEFAULT border border-white/10 group-hover:border-cyan-DEFAULT/50 transition-colors">
            {row.name?.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-white">{row.name}</p>
            <p className="text-[10px] font-mono text-text-muted">{row.email}</p>
          </div>
        </div>
      )
    },
    { header: 'Roll No', accessor: 'roll_no', render: (row) => <span className="font-mono text-cyan-DEFAULT">{row.roll_no}</span> },
    { 
      header: 'Department', 
      accessor: 'department_name',
      render: (row) => (
        <span className="px-2 py-1 rounded-md bg-violet/10 text-violet text-[10px] font-orbitron font-bold uppercase border border-violet/20">
          {row.department_name}
        </span>
      )
    },
    { header: 'Class', accessor: 'class_name', render: (row) => <span className="text-text-muted">{row.class_name}</span> },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <GraduationCap className="text-cyan-DEFAULT" size={32} />
              Student <span className="text-cyan-DEFAULT">Directory</span>
            </h1>
            <p className="text-text-muted mt-2 font-dm">Manage institutional student enrollment and academic profiles.</p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-gradient-to-r from-cyan-DEFAULT to-violet text-white px-6 py-4 rounded-2xl font-orbitron font-bold tracking-widest uppercase flex items-center gap-3 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:scale-105 transition-all group"
          >
            <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
            Add New Student
          </button>
        </div>

        {/* Filters and Table */}
        <GlassCard>
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-DEFAULT transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, roll no, or email..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-cyan-DEFAULT transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-DEFAULT transition-colors" size={18} />
              <select 
                className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-10 py-4 text-white outline-none focus:border-cyan-DEFAULT appearance-none cursor-pointer transition-all"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept} className="bg-cosmic">{dept === 'All' ? 'All Departments' : dept}</option>
                ))}
              </select>
            </div>
          </div>

          <DataTable 
            columns={columns} 
            data={filteredData} 
            isLoading={loading}
            onEdit={openDetail}
            onDelete={confirmDelete}
          />
        </GlassCard>

        {/* Add Student Drawer (Wizard) */}
        <Drawer 
          isOpen={isDrawerOpen} 
          onClose={() => {
            setIsDrawerOpen(false);
            setStep(1);
          }} 
          title="Register New Student"
        >
          <div className="space-y-8">
            {/* Step Indicator */}
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10" />
              {[1, 2, 3].map((s) => (
                <div 
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-orbitron text-xs font-bold transition-all duration-500 ${
                    step === s ? 'bg-cyan-DEFAULT text-cosmic shadow-[0_0_15px_#00F5FF]' : 
                    step > s ? 'bg-success text-white' : 'bg-white/10 text-text-muted'
                  }`}
                >
                  {step > s ? <CheckCircle size={16} /> : s}
                </div>
              ))}
            </div>

            <div className="min-h-[300px]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <Users className="text-cyan-DEFAULT" size={18} />
                        Personal Info
                      </h3>
                      <p className="text-text-muted text-xs">Enter the student's legal name and official roll number.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Full Name</label>
                        <div className="relative group">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-DEFAULT transition-colors" size={18} />
                          <input 
                            type="text" 
                            required 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-cyan-DEFAULT transition-all" 
                            placeholder="e.g. John Doe" 
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Roll Number</label>
                        <div className="relative group">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-DEFAULT transition-colors" size={18} />
                          <input 
                            type="text" 
                            required 
                            value={formData.roll_no} 
                            onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })} 
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-cyan-DEFAULT transition-all font-mono" 
                            placeholder="S001" 
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <School className="text-cyan-DEFAULT" size={18} />
                        Academic Placement
                      </h3>
                      <p className="text-text-muted text-xs">Assign the student to their respective class and department.</p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest text-white">Select Class</label>
                      <div className="grid grid-cols-1 gap-3">
                        {classes.map(cls => (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, class_id: cls.id })}
                            className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${
                              formData.class_id === cls.id 
                              ? 'bg-cyan-DEFAULT/10 border-cyan-DEFAULT text-cyan-DEFAULT shadow-[0_0_15px_rgba(0,245,255,0.1)]' 
                              : 'bg-white/5 border-white/10 text-text-muted hover:border-white/30'
                            }`}
                          >
                            <div>
                              <p className={`font-bold ${formData.class_id === cls.id ? 'text-white' : ''}`}>{cls.name}</p>
                              <p className="text-[10px] uppercase font-orbitron opacity-60 tracking-widest">{cls.department_name}</p>
                            </div>
                            {formData.class_id === cls.id && <CheckCircle size={20} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <Lock className="text-cyan-DEFAULT" size={18} />
                        Account Security
                      </h3>
                      <p className="text-text-muted text-xs">Credentials for logging into the student portal.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Email Address</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-DEFAULT transition-colors" size={18} />
                          <input 
                            type="email" 
                            required 
                            value={formData.email} 
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-cyan-DEFAULT transition-all" 
                            placeholder="john@student.edu" 
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Initial Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-DEFAULT transition-colors" size={18} />
                          <input 
                            type="password" 
                            required 
                            value={formData.password} 
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-cyan-DEFAULT transition-all" 
                            placeholder="••••••••" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-cyan-DEFAULT/5 rounded-xl border border-cyan-DEFAULT/20">
                      <p className="text-[10px] font-orbitron text-cyan-DEFAULT font-bold uppercase mb-2 flex items-center gap-2">
                        <CheckCircle size={12} /> Ready to Finalize
                      </p>
                      <p className="text-xs text-text-muted">
                        Confirming will create the student profile. The student can then enroll their biometric face data.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-4 pt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-orbitron text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={step === 1 && (!formData.name || !formData.roll_no)}
                  className="flex-1 px-6 py-4 rounded-xl bg-cyan-DEFAULT text-cosmic font-orbitron text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_40px_rgba(0,245,255,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-DEFAULT to-violet text-white font-orbitron text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_40px_rgba(0,245,255,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Save Student
                </button>
              )}
            </div>
          </div>
        </Drawer>

        {/* Student Detail Drawer */}
        <Drawer 
          isOpen={isDetailDrawerOpen} 
          onClose={() => setIsDetailDrawerOpen(false)} 
          title="Student Academic Profile"
        >
          {selectedStudent && (
            <div className="space-y-8">
              <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-cyan-DEFAULT/10 to-violet/10 rounded-2xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Users size={80} className="text-white" />
                </div>
                <div className="w-20 h-20 bg-cyan-DEFAULT/20 rounded-2xl flex items-center justify-center text-cyan-DEFAULT text-3xl font-black border border-cyan-DEFAULT/30 shadow-[0_0_20px_rgba(0,245,255,0.2)]">
                  {selectedStudent.profile.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{selectedStudent.profile.name}</h3>
                  <p className="text-text-muted text-sm flex items-center gap-2"><Mail size={14} /> {selectedStudent.profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Roll Number', value: selectedStudent.profile.roll_no, icon: <Hash size={14} /> },
                  { label: 'Class', value: selectedStudent.profile.class, icon: <School size={14} /> },
                  { label: 'Department', value: selectedStudent.profile.department, icon: <BookOpen size={14} /> },
                  { label: 'System ID', value: `#${selectedStudent.profile.id}`, icon: <ShieldCheck size={14} /> },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-cyan-DEFAULT/30 transition-all group">
                    <p className="text-[10px] text-text-muted uppercase font-orbitron font-bold tracking-widest flex items-center gap-2 mb-1 group-hover:text-cyan-DEFAULT">
                      {item.icon} {item.label}
                    </p>
                    <p className="text-white font-bold font-mono">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Attendance', value: `${selectedStudent.stats.attendance_percentage}%`, color: 'bg-cyan-DEFAULT' },
                  { label: 'Total Sessions', value: selectedStudent.stats.total_sessions, color: 'bg-violet' },
                  { label: 'Present', value: selectedStudent.stats.attended_count, color: 'bg-success' },
                ].map((stat, idx) => (
                  <div key={idx} className={`${stat.color}/10 rounded-xl border border-${stat.color}/20 p-4 flex flex-col items-center shadow-lg transition-transform hover:scale-105`}>
                     <p className={`text-[10px] text-${stat.color} font-orbitron font-bold uppercase tracking-widest mb-1`}>{stat.label}</p>
                     <p className="text-2xl font-black text-white font-mono">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                 <h4 className="font-orbitron text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                   <Activity size={16} className="text-cyan-DEFAULT" />
                   Attendance History
                 </h4>
                 
                 <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                   {selectedStudent.attendance_history.length === 0 ? (
                     <div className="py-12 text-center text-text-muted italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                        No attendance records available.
                     </div>
                   ) : (
                     selectedStudent.attendance_history.map((record, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                           <div>
                              <p className="text-sm font-bold text-white">{record.subject}</p>
                              <p className="text-[10px] text-text-muted font-mono">{record.date}</p>
                           </div>
                           <span className={`px-2 py-1 rounded text-[10px] font-bold font-orbitron uppercase tracking-widest ${
                              record.status === 'Present' ? 'text-success bg-success/10 border border-success/20' : 'text-danger bg-danger/10 border border-danger/20'
                           }`}>
                              {record.status}
                           </span>
                        </div>
                     ))
                   )}
                 </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* Delete Confirmation Modal */}
        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Student Record?"
          message={`Are you sure you want to delete ${studentToDelete?.name}? This will permanently remove their academic profile, face embeddings, and all attendance history. This action cannot be undone.`}
          confirmText="Delete Permanently"
          variant="danger"
        />
      </div>
    </PageTransition>
  );
};

export default StudentPage;
