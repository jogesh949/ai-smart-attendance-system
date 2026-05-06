import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Bot } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NeuralBackground from '../components/NeuralBackground';
import GlassCard from '../components/GlassCard';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [loading, setLoading] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorShake(false);

    try {
      const success = await login({ email, password, role });
      if (success) {
        toast.success("Welcome back! The AI is ready. 🤖");
        // Navigation handled by ProtectedRoute in App.jsx
      } else {
        setErrorShake(true);
        toast.error("Invalid credentials or role. Please try again.");
        setTimeout(() => setErrorShake(false), 1000); // Reset shake animation
      }
    } catch (err) {
      setErrorShake(true);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roleButtons = [
    { id: 'admin', label: '👑 Admin' },
    { id: 'teacher', label: '🎓 Teacher' },
    { id: 'student', label: '🧑‍🎓 Student' },
  ];

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
      <NeuralBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`z-10 w-full max-w-md ${errorShake ? 'animate-shake' : ''}`}
      >
        <GlassCard className="p-8 text-center" tilt={false}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
            className="mb-6"
          >
            <Bot size={64} className="mx-auto text-cyan-DEFAULT animate-pulse-slow" />
            <h1 className="font-orbitron text-3xl font-bold text-white mt-4">AI Attend</h1>
            <p className="text-text-muted text-sm mt-2">Your classroom, powered by intelligence ✨</p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role Selector */}
            <div className="flex justify-center gap-2 mb-6">
              {roleButtons.map((rb) => (
                <motion.button
                  key={rb.id}
                  type="button"
                  onClick={() => setRole(rb.id)}
                  className={`px-4 py-2 rounded-full text-sm font-orbitron font-bold transition-all duration-300
                    ${role === rb.id
                      ? 'bg-cyan-DEFAULT text-cosmic shadow-lg shadow-cyan-DEFAULT/30'
                      : 'bg-white/10 text-text-muted hover:bg-white/20'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {rb.label}
                </motion.button>
              ))}
            </div>

            {/* Email Input */}
            <div className="relative group">
              <input
                type="email"
                id="email"
                className="w-full bg-transparent border-b-2 border-white/20 text-white py-3 px-0 focus:outline-none focus:border-cyan-DEFAULT peer transition-colors"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label
                htmlFor="email"
                className="absolute left-0 -top-4 text-text-muted text-xs font-orbitron uppercase tracking-widest
                           peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-white/50
                           peer-focus:-top-4 peer-focus:text-xs peer-focus:text-cyan-DEFAULT transition-all"
              >
                Email
              </label>
              <User size={18} className="absolute right-0 top-3 text-text-muted peer-focus:text-cyan-DEFAULT transition-colors" />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <input
                type="password"
                id="password"
                className="w-full bg-transparent border-b-2 border-white/20 text-white py-3 px-0 focus:outline-none focus:border-cyan-DEFAULT peer transition-colors"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label
                htmlFor="password"
                className="absolute left-0 -top-4 text-text-muted text-xs font-orbitron uppercase tracking-widest
                           peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-white/50
                           peer-focus:-top-4 peer-focus:text-xs peer-focus:text-cyan-DEFAULT transition-all"
              >
                Password
              </label>
              <Lock size={18} className="absolute right-0 top-3 text-text-muted peer-focus:text-cyan-DEFAULT transition-colors" />
            </div>

            <motion.button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-DEFAULT to-violet text-white font-orbitron font-bold uppercase tracking-widest shadow-lg shadow-cyan-DEFAULT/20 hover:shadow-cyan-DEFAULT/40 transition-all duration-300 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              // Add ripple effect (conceptual, actual implementation would be more complex)
              style={{
                background: loading ? 'linear-gradient(to right, var(--color-cyan-DEFAULT), var(--color-violet))' : 'linear-gradient(to right, var(--color-cyan-DEFAULT), var(--color-violet))',
                boxShadow: loading ? '0 0 20px rgba(0,245,255,0.3)' : '0 0 20px rgba(0,245,255,0.3)',
              }}
            >
              {loading ? <motion.div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Login'}
            </motion.button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Login;