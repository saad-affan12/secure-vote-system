import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, KeyRound, Users, CheckCircle, Fingerprint } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
};

const SecurityCard = ({ icon: Icon, title, desc, i }: { icon: any; title: string; desc: string; i: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={i}
      variants={fadeUp}
      className="glass-card-hover p-6 text-center"
    >
      <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 min-h-screen flex items-center">
        <div className="container mx-auto text-center max-w-4xl">
          {/* Floating icons */}
          <motion.div className="absolute top-40 left-[10%] float-icon hidden lg:block" initial={{ opacity: 0 }} animate={{ opacity: 0.3 }}>
            <Lock className="w-10 h-10 text-primary/40" />
          </motion.div>
          <motion.div className="absolute top-60 right-[12%] float-icon-delayed hidden lg:block" initial={{ opacity: 0 }} animate={{ opacity: 0.3 }}>
            <Shield className="w-12 h-12 text-accent/30" />
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 text-sm text-primary">
              <Shield className="w-4 h-4" />
              <span>End-to-End Encrypted</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <span className="text-foreground">Your Vote,</span>{' '}
            <span className="neon-text">Secured</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Military-grade encryption meets seamless user experience. Cast your vote with confidence in a system designed for transparency and security.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all hover:shadow-[0_0_30px_hsl(var(--glow-primary)/0.3)] active:scale-[0.98]"
            >
              Register to Vote
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl glass-card text-foreground font-semibold text-lg hover:border-primary/40 transition-all active:scale-[0.98]"
            >
              Secure Login
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div className="text-center mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trusted Security <span className="neon-text">Architecture</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Built with zero-trust principles and multi-layered protection to ensure every vote counts.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            <SecurityCard icon={Lock} title="AES-256 Encryption" desc="Every vote is encrypted end-to-end using military-grade AES-256 encryption before storage." i={0} />
            <SecurityCard icon={Fingerprint} title="Multi-Factor Auth" desc="Two-factor authentication with OTP verification ensures only authorized voters can access the system." i={1} />
            <SecurityCard icon={Users} title="Role-Based Access" desc="Strict role separation between voters and administrators with granular permission controls." i={2} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-card p-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '256-bit', label: 'Encryption' },
              { value: '99.99%', label: 'Uptime' },
              { value: '< 50ms', label: 'Latency' },
              { value: '0', label: 'Breaches' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-2xl md:text-3xl font-bold neon-text mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ready to Cast Your Vote?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Join thousands of voters who trust SecureVote for transparent, tamper-proof elections.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all hover:shadow-[0_0_30px_hsl(var(--glow-primary)/0.3)]"
            >
              <CheckCircle className="w-5 h-5" /> Get Started
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/20">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 SecureVote. All rights reserved. Built with zero-trust security architecture.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
