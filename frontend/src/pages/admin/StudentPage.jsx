import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Save, Users, Search, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import { Button, Card, Skeleton, Modal, EmptyState, Badge } from '../../components/UI';

const StudentPage = () => {
  const [data, setData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
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
    const load = async () => {
      await fetchData();
    };
    load();
  }, [fetchData]);

  const departments = useMemo(() => {
    const depts = new Set(data.map(s => s.department_name));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.class_id) return toast.error('Please select a class');
    
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? This will also remove their face embeddings and attendance records.')) return;
    
    const tId = toast.loading('Deleting...');
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student deleted successfully', { id: tId });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete', { id: tId });
    }
  };

  const openDetail = async (student) => {
    try {
      const res = await api.get(`/admin/students/${student.id}/details`);
      setSelectedStudent(res.data);
      setIsDetailModalOpen(true);
    } catch {
      toast.error('Failed to load student details');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">Manage institutional student enrollment.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Student</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by name, roll no, or email..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none bg-white"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>
            ))}
          </select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filteredData.length === 0 ? (
          <EmptyState 
            icon={Users} 
            title={searchQuery ? "No matches found" : "No Students Found"} 
            message={searchQuery ? "Try adjusting your search terms." : "There are no students registered yet."} 
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Roll No</th>
                  <th className="px-6 py-3 font-medium">Department</th>
                  <th className="px-6 py-3 font-medium">Class</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{item.name}</span>
                        <span className="text-xs text-gray-500">{item.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.roll_no}</td>
                    <td className="px-6 py-4">
                      <Badge variant="primary">{item.department_name}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{item.class_name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openDetail(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Student">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Student Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Student">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input name="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="john@student.edu" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <input name="roll_no" type="text" required value={formData.roll_no} onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none" placeholder="S001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select 
                  name="class_id" 
                  required 
                  value={formData.class_id} 
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a2b6d] outline-none bg-white"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name} ({cls.department_name})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit"><Save className="w-4 h-4 mr-2" /> Save Student</Button>
          </div>
        </form>
      </Modal>

      {/* Student Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Student Academic Profile">
        {selectedStudent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-16 h-16 bg-[#1a2b6d] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {selectedStudent.profile.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedStudent.profile.name}</h3>
                <p className="text-gray-500 text-sm">{selectedStudent.profile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Roll Number</p>
                <p className="text-gray-900 font-semibold">{selectedStudent.profile.roll_no}</p>
              </div>
              <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Class</p>
                <p className="text-gray-900 font-semibold">{selectedStudent.profile.class}</p>
              </div>
              <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Department</p>
                <p className="text-gray-900 font-semibold">{selectedStudent.profile.department}</p>
              </div>
              <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">System ID</p>
                <p className="text-gray-900 font-semibold">#{selectedStudent.profile.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#1a2b6d] text-white rounded-xl shadow-md flex flex-col items-center">
                 <p className="text-[10px] opacity-70 uppercase font-bold">Overall Attendance</p>
                 <p className="text-2xl font-black">{selectedStudent.stats.attendance_percentage}%</p>
              </div>
              <div className="p-4 bg-teal-500 text-white rounded-xl shadow-md flex flex-col items-center">
                 <p className="text-[10px] opacity-70 uppercase font-bold">Total Classes</p>
                 <p className="text-2xl font-black">{selectedStudent.stats.total_sessions}</p>
              </div>
              <div className="p-4 bg-emerald-500 text-white rounded-xl shadow-md flex flex-col items-center">
                 <p className="text-[10px] opacity-70 uppercase font-bold">Present Count</p>
                 <p className="text-2xl font-black">{selectedStudent.stats.attended_count}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
               <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                 Attendance History
               </h4>
               
               {selectedStudent.attendance_history.length === 0 ? (
                 <p className="text-center py-8 text-gray-400 text-sm italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No attendance records found for this student.
                 </p>
               ) : (
                 <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-bold uppercase text-[10px]">Subject</th>
                          <th className="px-4 py-2 font-bold uppercase text-[10px]">Date & Time</th>
                          <th className="px-4 py-2 font-bold uppercase text-[10px] text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedStudent.attendance_history.map((record, i) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium text-gray-900">{record.subject}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{record.date}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                record.status === 'Present' ? 'bg-green-100 text-green-700' :
                                record.status === 'Late' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>Close Window</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentPage;
