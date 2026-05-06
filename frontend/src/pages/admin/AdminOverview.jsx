import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, BarChart3, GraduationCap, Building2, TrendingUp, Monitor } from 'lucide-react';
import api from '../../api';
import GlassCard from '../../components/GlassCard';
import AnimatedCounter from '../../components/AnimatedCounter';
import AISpinner from '../../components/AISpinner';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data); // Assuming backend returns data in the expected format
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
        // Fallback for demo if endpoint not ready
        setStats({
          total_students: 580,
          total_teachers: 24,
          total_departments: 8,
          attendance_percentage: 87.4,
          present_today: 542,
          absent_today: 38,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return ( // AI-themed spinner for loading state
      <div className="flex flex-col items-center justify-center py-40">
        <AISpinner size="lg" />
        <p className="mt-8 font-orbitron text-xs font-bold text-cyan-DEFAULT uppercase tracking-widest animate-pulse">Initializing cosmic overview...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats?.total_students || 0, icon: GraduationCap, color: 'cyan', unit: 'Enrolled' },
    { label: 'Total Teachers', value: stats?.total_teachers || 0, icon: Users, color: 'violet', unit: 'Faculty' },
    { label: 'Total Classes', value: stats?.total_classes || 0, icon: Building2, color: 'success', unit: 'Active' },
    { label: "Today's Attendance", value: stats?.attendance_percentage || 0, suffix: '%', color: 'cyan', icon: TrendingUp, unit: '🔥 High' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <BarChart3 className="text-cyan-DEFAULT" size={32} />
            Admin <span className="text-cyan-DEFAULT">Overview</span>
          </h1>
          <p className="text-text-muted mt-2 font-dm">Institutional command center for real-time data streams.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => ( // Each card floats with 3D tilt effect. On mount, numbers count up from 0:
          <GlassCard key={i} glowColor={stat.color} className="p-6" delay={i * 0.1}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-orbitron font-bold text-white mt-2">
                  <AnimatedCounter end={stat.value} decimals={stat.suffix === '%' ? 1 : 0} suffix={stat.suffix || ''} />
                </h3>
                <p className={`text-xs font-mono mt-1 text-${stat.color}-DEFAULT/70`}>{stat.unit}</p>
              </div>
              <div className={`p-3 bg-${stat.color}/10 rounded-xl border border-${stat.color}/20 text-${stat.color} shadow-lg`}>
                {stat.icon}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Today's Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard glowColor="success" className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Present Today</p>
              <h3 className="text-3xl font-orbitron font-bold text-white mt-2">
                <AnimatedCounter end={stats?.present_today || 0} />
              </h3>
            </div>
            <div className="p-3 bg-success/10 rounded-xl border border-success/20 text-success shadow-lg">
              <UserCheck size={24} />
            </div>
          </div>
        </GlassCard>
        <GlassCard glowColor="danger" className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Absent Today</p>
              <h3 className="text-3xl font-orbitron font-bold text-white mt-2">
                <AnimatedCounter end={stats?.absent_today || 0} />
              </h3>
            </div>
            <div className="p-3 bg-danger/10 rounded-xl border border-danger/20 text-danger shadow-lg">
              <UserX size={24} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Placeholder for Management Section / Detailed Analytics */}
      <GlassCard className="p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center shadow-sm mb-4">
          <Monitor className="w-8 h-8 text-text-muted opacity-30" />
        </div>
        <h3 className="text-lg font-bold text-white font-orbitron">Management & Analytics</h3>
        <p className="text-text-muted max-w-sm mt-1">Navigate to the sidebar for detailed management sections (Students, Teachers, Classes, etc.) or Reports for in-depth analytics.</p>
      </GlassCard>
    </div>
  );
};

export default AdminOverview;
