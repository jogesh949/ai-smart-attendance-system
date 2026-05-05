import React, { useState, useEffect } from 'react';
import { Plus, Save, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import { Button, Card, Skeleton, Modal, EmptyState } from '../../components/UI';

const TeacherPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', department_id: '', teacher_code: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/teachers');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tId = toast.loading('Saving...');
    try {
      await api.post('/admin/teachers', { ...formData, department_id: Number(formData.department_id) });
      toast.success('Teacher added successfully', { id: tId });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', department_id: '', teacher_code: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add', { id: tId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 mt-1">Manage teaching staff.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Teacher</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : data.length === 0 ? (
          <EmptyState icon={Users} title="No Teachers Found" message="There are no teachers registered yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium">Dept ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.name || `User ID: ${item.user_id}`}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.teacher_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.department_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Teacher">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input name="name" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="e.g. Dr. Jane Smith" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="jane@college.edu" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dept ID</label>
              <input name="department_id" type="number" required value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Code</label>
              <input name="teacher_code" type="text" required value={formData.teacher_code} onChange={(e) => setFormData({ ...formData, teacher_code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="T001" />
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

export default TeacherPage;
