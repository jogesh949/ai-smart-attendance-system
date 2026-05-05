import React, { useState, useEffect } from 'react';
import { Plus, Save, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import { Button, Card, Skeleton, Modal, EmptyState } from '../../components/UI';

const StudentPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', class_id: '', roll_no: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tId = toast.loading('Saving...');
    try {
      await api.post('/admin/students', { ...formData, class_id: Number(formData.class_id) });
      toast.success('Student added successfully', { id: tId });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', class_id: '', roll_no: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add', { id: tId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">Manage student enrollment.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Student</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : data.length === 0 ? (
          <EmptyState icon={Users} title="No Students Found" message="There are no students registered yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Roll No</th>
                  <th className="px-6 py-3 font-medium">Class ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.name || `User ID: ${item.user_id}`}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.roll_no}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.class_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Student">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input name="name" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="e.g. John Doe" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="john@student.edu" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Class ID</label>
              <input name="class_id" type="number" required value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
              <input name="roll_no" type="text" required value={formData.roll_no} onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="S001" />
            </div>
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

export default StudentPage;
