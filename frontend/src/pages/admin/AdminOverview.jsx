import React from 'react';
import { Users, UserCheck, UserX, BarChart3 } from 'lucide-react';
import { Card, Skeleton } from '../../components/UI';

const AdminOverview = () => {
  // Mock stats for now
  const stats = { total: 150, present: 120, absent: 30, percentage: 80 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Institutional overview and quick stats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Present Today', value: stats.present, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Absent Today', value: stats.absent, icon: UserX, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Attendance %', value: stats.percentage + '%', icon: BarChart3, color: 'text-teal-600', bg: 'bg-teal-100' }
        ].map((stat, i) => (
          <Card key={i} className="flex items-center p-5">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="h-64 flex items-center justify-center text-gray-400">
        <BarChart3 className="w-12 h-12 mr-4 opacity-20" />
        <p>Weekly trends and analytics chart will appear here.</p>
      </Card>
    </div>
  );
};

export default AdminOverview;
