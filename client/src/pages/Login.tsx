import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import { Mail, Lock, Shield, AlertCircle, CheckCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = (location.state as any)?.registered;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'voter' | 'admin'>('voter');
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const [loading, setLoading] = useState(false);


  const triggerError = (msg: string) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const handleLogin = async () => {
    if (!email || !password) return triggerError('Please fill in all fields');
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password, role);
      setLoading(false);
      if (!res.success) return triggerError(res.message || 'Invalid credentials');
      // on success redirect based on selected role
      if (role === 'admin') navigate('/admin')
      else navigate('/vote')
    } catch (err) {
      setLoading(false);
      return triggerError('Login failed')
    }
  };

  

  const inputClass = "w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all";

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <div className="pt-28 pb-16 px-4 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Secure Login</h1>
              <p className="text-sm text-muted-foreground mt-1">Access your voting account</p>
            </div>

            {/* Success banner */}
            <AnimatePresence>
              {registered && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/30 flex items-center gap-2 text-sm text-accent">
                  <CheckCircle className="w-4 h-4" /> Registration successful! Please login.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-sm text-destructive ${shakeError ? 'shake-error' : ''}`}>
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  {/* Role tabs */}
                  <div className="flex rounded-lg bg-secondary/30 p-1">
                    {(['voter', 'admin'] as const).map(r => (
                      <button key={r} onClick={() => setRole(r)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${role === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        {r === 'voter' ? 'Voter' : 'Admin'}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Email / Voter ID</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input className={`${inputClass} pl-10`} placeholder={role === 'admin' ? 'admin@securevote.gov' : 'voter@example.com'} value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input className={`${inputClass} pl-10`} type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    </div>
                  </div>

                  <button onClick={handleLogin} disabled={loading} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                    ) : 'Sign In'}
                  </button>

                </motion.div>
              
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
