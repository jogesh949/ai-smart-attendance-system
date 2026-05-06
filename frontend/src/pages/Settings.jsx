import { useState } from 'react';
import { Settings as SettingsIcon, Lock, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      return toast.error('New passwords do not match');
    }
    if (passwords.new_password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    try {
      setLoading(true);
      await api.put('/auth/change-password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      toast.success('🔒 Password updated securely.');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch {
      // Error handled by api.js interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-orbitron text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <SettingsIcon className="text-cyan-DEFAULT" size={32} />
              System <span className="text-cyan-DEFAULT">Settings</span>
            </h1>
            <p className="text-text-muted mt-2 font-dm">Manage your account security and preferences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GlassCard className="p-8">
            <h3 className="font-orbitron text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="text-cyan-DEFAULT" size={24} />
              Security Protocol
            </h3>
            
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-orbitron text-text-muted uppercase tracking-widest mb-2">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <input 
                    type="password" 
                    name="current_password"
                    value={passwords.current_password}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-cyan-DEFAULT transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-orbitron text-text-muted uppercase tracking-widest mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <input 
                    type="password" 
                    name="new_password"
                    value={passwords.new_password}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-cyan-DEFAULT transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-orbitron text-text-muted uppercase tracking-widest mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <input 
                    type="password" 
                    name="confirm_password"
                    value={passwords.confirm_password}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-cyan-DEFAULT transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-cyan-DEFAULT text-black font-bold font-orbitron py-3 rounded-lg hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (
                  <>
                    <Save size={18} /> Update Security Key
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  );
};

export default Settings;
