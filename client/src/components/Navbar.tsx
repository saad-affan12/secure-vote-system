import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/20 backdrop-blur-2xl"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Shield className="w-6 h-6 text-primary transition-all group-hover:drop-shadow-[0_0_8px_hsl(var(--glow-primary)/0.6)]" />
          <span className="font-bold text-lg tracking-tight text-foreground">
            Secure<span className="neon-text">Vote</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user?.name} <span className="text-primary/70">({user?.role})</span>
              </span>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">Admin</Link>
              )}
              {user?.role === 'voter' && (
                <Link to="/vote" className="text-sm text-muted-foreground hover:text-primary transition-colors">Vote</Link>
              )}
              <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Login</Link>
              <Link to="/register" className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">Register</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden glass-card border-t border-border/20 px-4 py-4 flex flex-col gap-3"
        >
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">{user?.name} ({user?.role})</span>
              {user?.role === 'admin' && <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Admin Panel</Link>}
              {user?.role === 'voter' && <Link to="/vote" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Vote</Link>}
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-sm text-destructive text-left">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="text-sm text-primary">Register</Link>
            </>
          )}
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
