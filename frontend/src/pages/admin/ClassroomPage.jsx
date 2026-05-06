import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Trash2, Save, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import PageTransition from '../../components/PageTransition';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/ConfirmModal';

const ClassroomPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ id: null, room_name: '', location: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/classrooms');
      setData(res.data);
    } catch {
      toast.error('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return data.filter(room => 
      room.room_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const handleEdit = (room) => {
    setFormData({ id: room.id, room_name: room.room_name, location: room.location });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/admin/classrooms/${formData.id}`, formData);
        toast.success(`✅ Classroom ${formData.room_name} updated.`);
      } else {
        await api.post('/admin/classrooms', formData);
        toast.success(`✅ Classroom ${formData.room_name} created.`);
      }
      setIsDrawerOpen(false);
      setFormData({ id: null, room_name: '', location: '' });
      fetchData();
    } catch (err) {
      // Error handled by api.js
    }
  };

  const confirmDelete = (room) => {
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/classrooms/${roomToDelete.id}`);
      toast.success('Classroom decommissioned successfully.');
      fetchData();
    } catch (err) {
      // Error handled by api.js
    }
  };

  const columns = [
    { 
      header: 'Room Name', 
      accessor: 'room_name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-DEFAULT/20 to-violet/20 flex items-center justify-center font-bold text-cyan-DEFAULT border border-white/10">
            {row.room_name?.charAt(0)}
          </div>
          <p className="font-bold text-white">{row.room_name}</p>
        </div>
      )
    },
    { header: 'Location', accessor: 'location', render: (row) => <span className="text-text-muted">{row.location}</span> },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <Building2 className="text-cyan-DEFAULT" size={32} />
              Spatial <span className="text-cyan-DEFAULT">Zones</span>
            </h1>
            <p className="text-text-muted mt-2 font-dm">Manage physical classrooms and their locations.</p>
          </div>
          <button 
            onClick={() => { setFormData({ id: null, room_name: '', location: '' }); setIsDrawerOpen(true); }}
            className="bg-gradient-to-r from-cyan-DEFAULT to-violet text-white px-6 py-4 rounded-2xl font-orbitron font-bold tracking-widest uppercase flex items-center gap-3 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:scale-105 transition-all group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Add New Room
          </button>
        </div>

        <GlassCard>
          <div className="mb-8">
            <div className="relative group max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-DEFAULT transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search rooms..." 
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
          onClose={() => { setIsDrawerOpen(false); setFormData({ id: null, room_name: '', location: '' }); }} 
          title={formData.id ? "Edit Classroom" : "Add New Classroom"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Room Name</label>
              <input 
                type="text" required value={formData.room_name} 
                onChange={(e) => setFormData({ ...formData, room_name: e.target.value })} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT transition-all" 
                placeholder="e.g. LAB-01" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Location</label>
              <input 
                type="text" required value={formData.location} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyan-DEFAULT transition-all" 
                placeholder="e.g. Main Building, 2nd Floor" 
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-DEFAULT to-violet text-white font-orbitron font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_40px_rgba(0,245,255,0.5)] transition-all flex items-center justify-center gap-3"
            >
              <Save size={20} />
              {formData.id ? "UPDATE ROOM" : "SAVE ROOM"}
            </button>
          </form>
        </Drawer>

        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Decommission Classroom?"
          message={`Are you sure you want to decommission ${roomToDelete?.room_name}? This will remove it from all scheduling and camera mappings.`}
          confirmText="Decommission Room"
          variant="danger"
        />
      </div>
    </PageTransition>
  );
};

export default ClassroomPage;