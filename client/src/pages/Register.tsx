import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import { User, Mail, IdCard, Lock, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { API_URL } from '../config/api';

const steps = ['Name + Email', 'Voter ID + Password', 'Register'];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', voterId: '', password: '', confirm: '' });

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const triggerError = (msg: string) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const nextStep = () => {
    setError('');
    if (step === 0) {
      if (!form.name.trim() || !form.email.trim()) return triggerError('Please fill in all fields');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return triggerError('Invalid email address');
    }
    if (step === 1) {
      if (!form.voterId.trim() || !form.password) return triggerError('Please fill in all fields');
      if (form.password.length < 6) return triggerError('Password must be at least 6 characters');
      if (form.password !== form.confirm) return triggerError('Passwords do not match');
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { name, email, voterId, password } = form;

      await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        voterId,
        password,
      });

      navigate('/login', { state: { registered: true } });
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all';

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
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Voter Registration</h1>
              <p className="text-sm text-muted-foreground mt-1">Create your secure voter account</p>
            </div>

            <div className="flex items-center justify-between mb-8 px-2">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      i < step
                        ? 'bg-accent text-accent-foreground'
                        : i === step
                          ? 'bg-primary text-primary-foreground glow-border'
                          : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < 2 && (
                    <div className={`hidden sm:block w-12 h-0.5 transition-colors ${i < step ? 'bg-accent' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-sm text-destructive ${shakeError ? 'shake-error' : ''}`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {step === 0 && (
                  <>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          className={`${inputClass} pl-10`}
                          placeholder="Enter your full name"
                          value={form.name}
                          onChange={(e) => set('name', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          className={`${inputClass} pl-10`}
                          type="email"
                          placeholder="voter@example.com"
                          value={form.email}
                          onChange={(e) => set('email', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">Voter ID</label>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          className={`${inputClass} pl-10`}
                          placeholder="Enter unique voter ID"
                          value={form.voterId}
                          onChange={(e) => set('voterId', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          className={`${inputClass} pl-10`}
                          type="password"
                          placeholder="Min. 6 characters"
                          value={form.password}
                          onChange={(e) => set('password', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          className={`${inputClass} pl-10`}
                          type="password"
                          placeholder="Re-enter password"
                          value={form.confirm}
                          onChange={(e) => set('confirm', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
                {step === 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    By registering, you agree to our terms of service and privacy policy.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  onClick={() => {
                    setStep((s) => s - 1);
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg glass-card text-foreground font-medium hover:border-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < 2 ? (
                <button
                  onClick={nextStep}
                  className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                  ) : (
                    <>
                      Register <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
