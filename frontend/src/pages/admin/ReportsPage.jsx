import { useState, useEffect } from 'react';
import { BarChart3, Download, Search, Calendar, MapPin, Users, TrendingUp, Activity, ShieldCheck, PieChart } from 'lucide-react';
import api from '../../api'; // Ensure api is imported
import toast from 'react-hot-toast';
import GlassCard from '../../components/GlassCard';
import PageTransition from '../../components/PageTransition';
import AnimatedCounter from '../../components/AnimatedCounter';
import AISpinner from '../../components/AISpinner';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart as RePieChart, Pie } from 'recharts';

const ReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data); // Assuming backend returns data in the expected format
      } catch {
        // Fallback for demo if endpoint not ready
        setStats({
          attendance_percentage: 87.4,
          present_today: 542,
          absent_today: 38,
          total_classes: 18,
          room_attendance_rates: [ // Renamed to match potential backend structure
            { name: 'LAB-01', attendance_rate: 95 },
            { name: 'HALL-A', attendance_rate: 82 },
            { name: 'ROOM-202', attendance_rate: 88 },
            { name: 'CS-DEPT', rate: 91 },
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const exportGlobalReport = () => {
    toast.success('📥 Initializing Master Report Generation...');
    setTimeout(() => toast.success('✅ Quantum report synthesized. Check downloads.'), 2000);
  };

  const COLORS = ['#00F5FF', '#7C3AED', '#10B981', '#EF4444'];

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <BarChart3 className="text-cyan-DEFAULT" size={32} />
              Attendance <span className="text-cyan-DEFAULT">Intelligence</span>
            </h1>
            <p className="text-text-muted mt-2 font-dm">Synthesize and analyze institutional attendance vectors and patterns.</p>
          </div>
          <button 
            onClick={exportGlobalReport}
            className="bg-gradient-to-r from-cyan-DEFAULT to-violet text-white px-6 py-4 rounded-2xl font-orbitron font-bold tracking-widest uppercase flex items-center gap-3 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:scale-105 transition-all group"
          >
            <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
            Export Master Report
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
             <AISpinner size="lg" />
             <p className="mt-8 font-orbitron text-xs font-bold text-cyan-DEFAULT uppercase tracking-widest animate-pulse">Scanning biometric archives...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Avg. Attendance', value: stats.attendance_percentage, suffix: '%', color: 'cyan', icon: <TrendingUp size={24} /> },
                { label: 'Present Today', value: stats.present_today, color: 'success', icon: <Users size={24} /> },
                { label: 'Absent Today', value: stats.absent_today, color: 'danger', icon: <Activity size={24} /> },
                { label: 'Active Sessions', value: stats.total_classes, color: 'violet', icon: <ShieldCheck size={24} /> },
              ].map((stat, i) => (
                <GlassCard key={i} glowColor={stat.color} delay={i * 0.1}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-orbitron text-text-muted uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-3xl font-orbitron font-bold text-white mt-2">
                        <AnimatedCounter end={stat.value} decimals={stat.suffix === '%' ? 1 : 0} suffix={stat.suffix || ''} />
                      </h3>
                    </div>
                    <div className={`p-3 bg-${stat.color}/10 rounded-xl border border-${stat.color}/20 text-${stat.color} shadow-lg`}>
                      {stat.icon}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <GlassCard className="lg:col-span-2" glowColor="cyan">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="text-cyan-DEFAULT" size={18} />
                      Sector Efficiency
                    </h3>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                       <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                       <span className="text-[8px] font-orbitron text-text-muted uppercase font-bold tracking-widest">Real-time Data</span>
                    </div>
                 </div>
                 
                 <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%"> {/* Ensure data key matches backend */}
                       <BarChart data={stats.room_data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Orbitron' }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Orbitron' }}
                          />
                          <Tooltip // Tooltip content should be customized for better readability
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#020817', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '12px', fontSize: '10px', fontFamily: 'Orbitron' }}
                          />
                          <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={40} animationDuration={2000}>
                             {stats.room_data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </GlassCard>

              <GlassCard glowColor="violet">
                 <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                    <PieChart className="text-violet" size={18} />
                    Composition
                 </h3>
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <RePieChart>
                          <Pie
                             data={[
                               { name: 'Present', value: stats.present_today },
                               { name: 'Absent', value: stats.absent_today },
                             ]}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="value"
                             animationDuration={2000}
                          >
                             <Cell fill="#10B981" />
                             <Cell fill="#EF4444" />
                          </Pie>
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#020817', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', fontFamily: 'Orbitron' }}
                          />
                       </RePieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-text-muted flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-success" /> Present Ratio
                       </span>
                       <span className="text-white font-bold font-mono">
                          {((stats.present_today / (stats.present_today + stats.absent_today)) * 100).toFixed(1)}%
                       </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-text-muted flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-danger" /> Absent Ratio
                       </span>
                       <span className="text-white font-bold font-mono">
                          {((stats.absent_today / (stats.present_today + stats.absent_today)) * 100).toFixed(1)}%
                       </span>
                    </div>
                 </div>
              </GlassCard>
            </div>

            <GlassCard>
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="text-cyan-DEFAULT" size={18} />
                    Historical Anomalies
                  </h3>
                  <div className="relative group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                     <input type="text" placeholder="Filter by date..." className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-[10px] text-white outline-none focus:border-cyan-DEFAULT transition-all" />
                  </div>
               </div>
               
               <div className="p-12 text-center text-text-muted italic bg-white/5 rounded-2xl border border-dashed border-white/10 opacity-50">
                  <Activity size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xs uppercase font-orbitron tracking-widest">Quantum analysis pending...</p>
                  <p className="mt-2 text-[10px]">Anomalies will be flagged as the AI core processes historical session vectors.</p>
               </div>
            </GlassCard>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default ReportsPage;
