import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Save, School, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import PageTransition from '../../components/PageTransition';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/ConfirmModal';

const ClassPage = () => {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ id: null, name: '', department_id: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, deptRes] = await Promise.all([
        api.get('/admin/classes'),
        api.get('/admin/departments')
      ]);
      setData(classRes.data);
      setDepartments(deptRes.data);
    } catch {
      toast.error('Failed to load classes or departments');
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

  const filteredData = useMemo(() => {
    return data.filter(cls => 
      cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const handleEdit = (cls) => {
    setFormData({ id: cls.id, name: cls.name, department_id: cls.department_id });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department_id) return toast.error('Please select a department');
    
    try {
      if (formData.id) {
        await api.put(`/admin/classes/${formData.id}`, { name: formData.name, department_id: Number(formData.department_id) });
        toast.success(`✅ Class ${formData.name} updated.`);
      } else {
        await api.post('/admin/classes', { name: formData.name, department_id: Number(formData.department_id) });
        toast.success(`✅ Class ${formData.name} created.`);
      }
      setIsDrawerOpen(false);
      setFormData({ id: null, name: '', department_id: '' });
      fetchData();
    } catch {
      // Error handled by api.js
    }
  };

  const confirmDelete = (cls) => {
    setClassToDelete(cls);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/classes/${classToDelete.id}`);
      toast.success('Class dissolved successfully.');
      fetchData();
    } catch {
      // Error handled by api.js
    }
  };

  const columns = [
    { 
      header: 'Class Name', 
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-DEFAULT/20 to-violet/20 flex items-center justify-center font-bold text-cyan-DEFAULT border border-white/10">
            {row.name?.charAt(0)}
          </div>
          <p className="font-bold text-white">{row.name}</p>
        </div>
      )
    },
    { 
      header: 'Department', 
      accessor: 'department_name',
      render: (row) => (
        <span className="px-2 py-1 rounded-md bg-violet/10 text-violet text-[10px] font-orbitron font-bold uppercase border border-violet/20">
          {row.department_name}
        </span>
      )
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <School className="text-cyan-DEFAULT" size={32} />
              Academic <span className="text-cyan-DEFAULT">Classes</span>
            </h1>
            <p className="text-text-muted mt-2 font-dm">Manage student groups and their departmental affiliations.</p>
          </div>
          <button 
            onClick={() => { setFormData({ id: null, name: '', department_id: '' }); setIsDrawerOpen(true); }}
            className="bg-gradient-to-r from-cyan-DEFAULT to-violet text-white px-6 py-4 rounded-2xl font-orbitron font-bold tracking-widest uppercase flex items-center gap-3 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:scale-105 transition-all group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Add New Class
          </button>
        </div>

        <GlassCard>
          <div className="mb-8">
            <div className="relative group max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-DEFAULT transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search classes..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-cyan-DEFAULT transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <DataTable 
            columns={columns} 
            data={filteredData} 
            isLoading={loading}
            onEdit={handleEdit}
            onDelete={confirmDelete}
          />
        </GlassCard>

        <Drawer 
          isOpen={isDrawerOpen} 
          onClose={() => { setIsDrawerOpen(false); setFormData({ id: null, name: '', department_id: '' }); }} 
          title={formData.id ? "Edit Class" : "Add New Class"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Class Name</label>
              <input 
                type="text" required value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT transition-all" 
                placeholder="e.g. 101-A" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Layers size={12} /> Department
              </label>
              <select 
                required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT appearance-none cursor-pointer"
                value={formData.department_id}
                onChange={e => setFormData({...formData, department_id: e.target.value})}
              >
                <option value="" className="bg-cosmic">Select Department...</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id} className="bg-cosmic">{dept.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-DEFAULT to-violet text-white font-orbitron font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_40px_rgba(0,245,255,0.5)] transition-all flex items-center justify-center gap-3"
            >
              <Save size={20} />
              {formData.id ? "UPDATE CLASS" : "SAVE CLASS"}
            </button>
          </form>
        </Drawer>

        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Dissolve Class?"
          message={`Are you sure you want to dissolve class ${classToDelete?.name}? This will unassign all students and subjects from this class.`}
          confirmText="Dissolve Class"
          variant="danger"
        />
      </div>
    </PageTransition>
  );
};

export default ClassPage;