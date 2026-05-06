import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Layers, Trash2, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import PageTransition from '../../components/PageTransition';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/ConfirmModal';

const DepartmentPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  
  const [formData, setFormData] = useState({ name: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/departments');
      setData(res.data);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(d => 
    d.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', formData);
      toast.success(`✅ Department ${formData.name} created.`);
      setIsDrawerOpen(false);
      setFormData({ name: '' });
      fetchData();
    } catch (err) {
      // Handled by api.js
    }
  };

  const confirmDelete = (dept) => {
    setDeptToDelete(dept);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/departments/${deptToDelete.id}`);
      toast.success('Department dissolved successfully.');
      fetchData();
    } catch (err) {
      // Handled by api.js
    }
  };

  const columns = [
    { header: 'Unit ID', accessor: 'id', render: (row) => <span className="font-mono text-cyan-DEFAULT">#{row.id}</span> },
    { header: 'Department Name', accessor: 'name', render: (row) => <span className="font-bold text-white uppercase tracking-tighter">{row.name}</span> },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <Layers className="text-cyan-DEFAULT" size={32} />
              Academic <span className="text-cyan-DEFAULT">Sectors</span>
            </h1>
            <p className="text-text-muted mt-2 font-dm">Manage institutional departments and administrative hierarchies.</p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-gradient-to-r from-cyan-DEFAULT to-violet text-white px-6 py-4 rounded-2xl font-orbitron font-bold tracking-widest uppercase flex items-center gap-3 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:scale-105 transition-all group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Add Sector
          </button>
        </div>

        <GlassCard>
          <div className="mb-8">
            <div className="relative group max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-DEFAULT transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search departments..." 
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
            onDelete={confirmDelete}
          />
        </GlassCard>

        <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Add New Sector">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Sector Name</label>
              <input 
                type="text" required value={formData.name} 
                onChange={(e) => setFormData({ name: e.target.value })} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT transition-all" 
                placeholder="e.g. Computer Science" 
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-DEFAULT to-violet text-white font-orbitron font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_40px_rgba(0,245,255,0.5)] transition-all flex items-center justify-center gap-3"
            >
              <Save size={20} />
              SAVE SECTOR
            </button>
          </form>
        </Drawer>

        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Dissolve Sector?"
          message={`Are you sure you want to dissolve ${deptToDelete?.name}? This will affect all associated classes, subjects, and faculty assignments.`}
          confirmText="Dissolve Sector"
          variant="danger"
        />
      </div>
    </PageTransition>
  );
};

export default DepartmentPage;
