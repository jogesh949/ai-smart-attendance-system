import React, { useState, useEffect } from 'react';
import { Plus, Save, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import { Button, Card, Skeleton, Modal, EmptyState } from '../../components/UI';

const ClassroomPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ room_name: '', location: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/classrooms');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tId = toast.loading('Saving...');
    try {
      await api.post('/admin/classrooms', formData);
      toast.success('Classroom added successfully', { id: tId });
      setIsModalOpen(false);
      setFormData({ room_name: '', location: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add', { id: tId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classrooms</h1>
          <p className="text-gray-500 mt-1">Manage physical room locations.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Classroom</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : data.length === 0 ? (
          <EmptyState icon={MapPin} title="No Classrooms Found" message="There are no classrooms registered yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Room Name</th>
                  <th className="px-6 py-3 font-medium">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.room_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Classroom">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
            <input name="room_name" type="text" required value={formData.room_name} onChange={(e) => setFormData({ ...formData, room_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="e.g. Lab 1" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input name="location" type="text" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="e.g. 2nd Floor, Main Block" />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit"><Save className="w-4 h-4 mr-2" /> Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClassroomPage;
