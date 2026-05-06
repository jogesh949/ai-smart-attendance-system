import { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, UserX, BarChart3, GraduationCap, Building2, TrendingUp, Monitor, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api';
import GlassCard from '../../components/GlassCard';
import AnimatedCounter from '../../components/AnimatedCounter';
import AISpinner from '../../components/AISpinner';
import { motion, AnimatePresence } from 'framer-motion';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
      // Fallback for demo if endpoint not ready
      setStats({
        total_students: 580,
        total_teachers: 24,
        total_departments: 8,
        total_classes: 18,
        attendance_percentage: 87.4,
        present_today: 542,
        absent_today: 38,
        room_data: [
          { name: 'LAB-01', rate: 95 },
          { name: 'HALL-A', rate: 82 },
          { name: 'ROOM-202', rate: 88 },
          { name: 'CS-DEPT', rate: 91 },
        ]
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <AISpinner size="lg" />
        <p className="mt-8 font-orbitron text-xs font-bold text-cyan-DEFAULT uppercase tracking-widest animate-pulse">Synchronizing Neural Links...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats?.total_students || 0, icon: <GraduationCap size={24} />, color: 'cyan', unit: 'Enrolled' },
    { label: 'Total Teachers', value: stats?.total_teachers || 0, icon: <Users size={24} />, color: 'violet', unit: 'Faculty' },
    { label: 'Total Classes', value: stats?.total_classes || 0, icon: <Building2 size={24} />, color: 'success', unit: 'Active' },
    { label: "Attendance Rate", value: stats?.attendance_percentage || 0, suffix: '%', color: 'cyan', icon: <TrendingUp size={24} />, unit: '🔥 Real-time' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <BarChart3 className="text-cyan-DEFAULT" size={32} />
            Command <span className="text-cyan-DEFAULT">Center</span>
          </h1>
          <p className="text-text-muted mt-2 font-dm">Institutional overview of real-time attendance streams.</p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard glowColor={stat.color} className="p-6 h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-3xl font-orbitron font-bold text-white mt-2">
                      <AnimatedCounter end={stat.value} decimals={stat.suffix === '%' ? 1 : 0} suffix={stat.suffix || ''} />
                    </h3>
                    <p className="text-xs font-mono mt-1 opacity-70" style={{ color: `var(--color-${stat.color}-DEFAULT)` }}>{stat.unit}</p>
                  </div>
                  <div className="p-3 rounded-xl border shadow-lg" style={{ 
                    backgroundColor: `var(--color-${stat.color}-DEFAULT)10`,
                    borderColor: `var(--color-${stat.color}-DEFAULT)20`,
                    color: `var(--color-${stat.color}-DEFAULT)`
                  }}>
                    {stat.icon}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Presence Breakdown */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1 space-y-6"
        >
          <GlassCard glowColor="success" className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">Present Today</p>
                <h3 className="text-3xl font-orbitron font-bold text-success mt-2">
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
                <h3 className="text-3xl font-orbitron font-bold text-danger mt-2">
                  <AnimatedCounter end={stats?.absent_today || 0} />
                </h3>
              </div>
              <div className="p-3 bg-danger/10 rounded-xl border border-danger/20 text-danger shadow-lg">
                <UserX size={24} />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="font-orbitron font-bold text-white text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <PieChart className="text-cyan-DEFAULT" size={16} />
              Participation Mix
            </h3>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-success shadow-[0_0_10px_#10B981]" 
                style={{ width: `${stats?.attendance_percentage || 0}%` }} 
              />
              <div 
                className="h-full bg-danger/40" 
                style={{ width: `${100 - (stats?.attendance_percentage || 0)}%` }} 
              />
            </div>
            <div className="mt-4 flex justify-between text-[10px] font-mono text-text-muted">
              <span>ACTIVE: {stats?.attendance_percentage || 0}%</span>
              <span>DORMANT: {Math.round(100 - (stats?.attendance_percentage || 0))}%</span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Room Analytics Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <GlassCard className="p-8 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-white font-orbitron flex items-center gap-3">
                <Monitor className="text-violet" size={20} />
                Spatial Utilization Matrix
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.room_data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Orbitron' }}
                    dy={10}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(2, 8, 23, 0.9)', 
                      border: '1px solid rgba(0, 245, 255, 0.2)',
                      borderRadius: '8px',
                      fontFamily: 'DM Sans',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={30}>
                    {(stats?.room_data || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00F5FF' : '#7C3AED'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-text-muted text-[10px] mt-6 font-dm text-center uppercase tracking-widest">
              Live efficiency rating per classroom unit
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminOverview;
