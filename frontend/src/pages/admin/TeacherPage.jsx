import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Users, 
  Trash2, 
  UserPlus, 
  Mail, 
  Lock, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Search, 
  GraduationCap, 
  BookOpen, // Used for departments
  Activity
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import PageTransition from '../../components/PageTransition';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/ConfirmModal';

const TeacherPage = () => {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', department_ids: [] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [teacherRes, deptRes] = await Promise.all([
        api.get('/admin/teachers'),
        api.get('/admin/departments')
      ]);
      setData(teacherRes.data);
      setDepartments(deptRes.data);
    } catch {
      toast.error('Failed to load teachers or departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(teacher => 
    teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.teacher_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeptToggle = (id) => {
    const ids = [...formData.department_ids];
    if (ids.includes(id)) {
      setFormData({ ...formData, department_ids: ids.filter(i => i !== id) });
    } else {
      setFormData({ ...formData, department_ids: [...ids, id] });
    }
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.department_ids.length === 0) return toast.error('Please select at least one department');
    
    try {
      await api.post('/admin/teachers', { ...formData, department_ids: formData.department_ids.map(Number) });
      toast.success(`🎉 Welcome aboard! ${formData.name} has joined the faculty.`);
      setIsDrawerOpen(false);
      setFormData({ name: '', email: '', password: '', department_ids: [] });
      setStep(1);
      fetchData();
    } catch (err) {
      // Error handled by api.js
    }
  };

  const confirmDelete = (teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/teachers/${teacherToDelete.id}`);
      toast.success('Teacher record deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      // Error handled by api.js
    }
  };

  const columns = [
    { 
      header: 'Teacher', 
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet/20 to-cyan-DEFAULT/20 flex items-center justify-center font-bold text-violet border border-white/10 group-hover:border-violet/50 transition-colors">
            {row.name?.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-white">{row.name}</p>
            <p className="text-[10px] font-mono text-text-muted">{row.email}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Departments', 
      accessor: 'departments',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.departments?.map(d => (
            <span key={d.id} className="px-2 py-0.5 rounded bg-cyan-DEFAULT/10 text-cyan-DEFAULT text-[10px] font-orbitron font-bold uppercase border border-cyan-DEFAULT/20">
              {d.name}
            </span>
          ))}
        </div>
      )
    },
    { header: 'ID Code', accessor: 'teacher_code', render: (row) => <span className="font-mono text-violet">{row.teacher_code}</span> },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <GraduationCap className="text-violet" size={32} />
              Faculty <span className="text-violet">Management</span>
            </h1>
            <p className="text-text-muted mt-2 font-dm">Manage institutional teaching staff and department assignments.</p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-gradient-to-r from-violet to-cyan-DEFAULT text-white px-6 py-4 rounded-2xl font-orbitron font-bold tracking-widest uppercase flex items-center gap-3 hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:scale-105 transition-all group"
          >
            <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
            Add New Teacher
          </button>
        </div>

        <GlassCard glowColor="violet">
          <div className="mb-8">
            <div className="relative group max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-violet transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search teachers by name or email..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-violet transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <DataTable 
            columns={columns} 
            data={filteredData} 
            isLoading={loading}
            onDelete={confirmDelete}
          />
        </GlassCard>

        {/* Wizard Drawer */}
        <Drawer 
          isOpen={isDrawerOpen} 
          onClose={() => {
            setIsDrawerOpen(false);
            setStep(1);
          }} 
          title="Add New Faculty Member"
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10" />
              {[1, 2, 3].map((s) => (
                <div 
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-orbitron text-xs font-bold transition-all duration-500 ${
                    step === s ? 'bg-violet text-white shadow-[0_0_15px_#7C3AED]' : 
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
                  <motion.div key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <Users className="text-violet" size={18} />
                        Personal Profile
                      </h3>
                      <p className="text-text-muted text-xs">Enter the teacher's full name and professional information.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Full Name</label>
                        <input 
                          type="text" required value={formData.name} 
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-violet transition-all" 
                          placeholder="e.g. Dr. Jane Smith" 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <BookOpen className="text-violet" size={18} />
                        Departmental Allocation
                      </h3>
                      <p className="text-text-muted text-xs">Assign teacher to one or more departments.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {departments.map(dept => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => handleDeptToggle(dept.id)}
                          className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${
                            formData.department_ids.includes(dept.id) 
                            ? 'bg-violet/10 border-violet text-violet shadow-[0_0_15px_rgba(124,58,237,0.1)]' 
                            : 'bg-white/5 border-white/10 text-text-muted hover:border-white/30'
                          }`}
                        >
                          <span className={`font-bold ${formData.department_ids.includes(dept.id) ? 'text-white' : ''}`}>{dept.name}</span>
                          {formData.department_ids.includes(dept.id) && <CheckCircle size={20} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="s3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <Lock className="text-violet" size={18} />
                        Security & Access
                      </h3>
                      <p className="text-text-muted text-xs">Set up the teacher's official login credentials.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Professional Email</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-violet transition-colors" size={18} />
                          <input 
                            type="email" required value={formData.email} 
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-violet transition-all" 
                            placeholder="jane@college.edu" 
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Initial Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-violet transition-colors" size={18} />
                          <input 
                            type="password" required value={formData.password} 
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-violet transition-all" 
                            placeholder="••••••••" 
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-4 pt-8">
              {step > 1 && (
                <button
                  type="button" onClick={handleBack}
                  className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-orbitron text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button" onClick={handleNext}
                  disabled={(step === 1 && !formData.name) || (step === 2 && formData.department_ids.length === 0)}
                  className="flex-1 px-6 py-4 rounded-xl bg-violet text-white font-orbitron text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit" onClick={handleSubmit}
                  disabled={!formData.email || !formData.password}
                  className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-violet to-cyan-DEFAULT text-white font-orbitron text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} /> Save Teacher
                </button>
              )}
            </div>
          </div>
        </Drawer>

        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Remove Faculty Member?"
          message={`Are you sure you want to remove ${teacherToDelete?.name}? This will revoke their access to all department tools and live session controls.`}
          confirmText="Remove Access"
          variant="danger"
        />
      </div>
    </PageTransition>
  );
};

export default TeacherPage;
