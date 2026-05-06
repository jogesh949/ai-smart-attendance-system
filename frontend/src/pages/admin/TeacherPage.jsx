import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Users, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import { Button, Card, Skeleton, Modal, EmptyState, Badge } from '../../components/UI';

const TeacherPage = () => {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', department_id: '' });

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
    const load = async () => {
      await fetchData();
    };
    load();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department_id) return toast.error('Please select a department');
    
    const tId = toast.loading('Saving...');
    try {
      await api.post('/admin/teachers', { ...formData, department_id: Number(formData.department_id) });
      toast.success('Teacher added successfully', { id: tId });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', department_id: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add', { id: tId });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    const tId = toast.loading('Deleting...');
    try {
      // Assuming a delete endpoint exists or will be added if needed
      await api.delete(`/admin/teachers/${id}`);
      toast.success('Teacher deleted successfully', { id: tId });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete', { id: tId });
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
                  <th className="px-6 py-3 font-medium">Department</th>
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant="primary">{item.department_name}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.teacher_code}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Teacher">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="e.g. Dr. Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input name="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="jane@college.edu" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select 
                name="department_id" 
                required 
                value={formData.department_id} 
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none bg-white"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit"><Save className="w-4 h-4 mr-2" /> Save Teacher</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherPage;
