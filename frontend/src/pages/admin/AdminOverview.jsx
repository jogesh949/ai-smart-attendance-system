import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, BarChart3, GraduationCap, Building2 } from 'lucide-react';
import { Card, Skeleton } from '../../components/UI';
import api from '../../api';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats?.total_students || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Teachers', value: stats?.total_teachers || 0, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Departments', value: stats?.total_departments || 0, icon: Building2, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Attendance %', value: (stats?.attendance_percentage || 0) + '%', icon: BarChart3, color: 'text-teal-600', bg: 'bg-teal-100' }
  ];

  const attendanceRow = [
    { label: 'Present Today', value: stats?.present_today || 0, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Absent Today', value: stats?.absent_today || 0, icon: UserX, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Institutional overview and real-time statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="flex items-center p-5 hover:shadow-lg transition-shadow border-none ring-1 ring-gray-200">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {attendanceRow.map((stat, i) => (
          <Card key={i} className="flex items-center p-6 border-l-4 border-l-current" style={{ borderLeftColor: i === 0 ? '#10b981' : '#ef4444' }}>
             <div className={`w-14 h-14 rounded-full flex items-center justify-center mr-6 ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-lg text-gray-600 font-semibold">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="p-8 flex flex-col items-center justify-center text-center bg-gray-50 border-dashed border-2 border-gray-200">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
           <BarChart3 className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-700">Detailed Analytics</h3>
        <p className="text-gray-500 max-w-sm mt-1">Advanced weekly trends, department-wise heatmaps, and predictive attendance charts are being prepared for your institution.</p>
      </Card>
    </div>
  );
};

export default AdminOverview;
