import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useVote } from '../context/VoteContext';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import { CheckCircle, Shield, Clock } from 'lucide-react';

const Confirmation = () => {
  const { voteId, votedFor, candidates, hasVoted, clearRecentVote } = useVote();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  const candidate = candidates.find(c => c.id === votedFor);

  useEffect(() => {
    if (!hasVoted) { navigate('/vote'); return; }
    const timer = setInterval(() => setCountdown(p => {
      if (p <= 1) { clearInterval(timer); clearRecentVote(); navigate('/vote'); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [clearRecentVote, hasVoted, navigate]);

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <div className="pt-28 pb-16 px-4 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-10 text-center">
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
              >
                <CheckCircle className="w-14 h-14 text-accent" />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-2xl font-bold neon-text-green mb-2"
            >
              Vote Securely Recorded
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-muted-foreground mb-6"
            >
              Your ballot has been encrypted and submitted successfully.
            </motion.p>

            {/* Vote details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="glass-card p-4 mb-6 space-y-3 text-left"
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vote ID</span>
                <span className="text-primary font-mono text-xs">{voteId}</span>
              </div>
              <div className="h-px bg-border/30" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Candidate</span>
                <span className="text-foreground font-medium">{candidate?.name}</span>
              </div>
              <div className="h-px bg-border/30" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Voter</span>
                <span className="text-foreground">{user?.name}</span>
              </div>
              <div className="h-px bg-border/30" />
              <div className="flex items-center gap-2 text-xs text-accent">
                <Shield className="w-3 h-3" /> AES-256 Encrypted • Tamper-Proof
              </div>
            </motion.div>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Clock className="w-4 h-4" />
              Redirecting in {countdown}s
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Confirmation;
