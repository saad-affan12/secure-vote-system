import { motion } from 'framer-motion';

const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 animated-gradient-bg overflow-hidden">
    {/* Grid pattern */}
    <div className="absolute inset-0" style={{
      backgroundImage: `linear-gradient(hsl(var(--primary) / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.04) 1px, transparent 1px)`,
      backgroundSize: '60px 60px',
      animation: 'gridPulse 4s ease-in-out infinite',
    }} />
    {/* Glowing orbs */}
    <motion.div
      className="absolute w-96 h-96 rounded-full blur-[120px]"
      style={{ background: 'hsl(var(--glow-primary) / 0.08)', top: '10%', left: '20%' }}
      animate={{ x: [0, 50, -30, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-72 h-72 rounded-full blur-[100px]"
      style={{ background: 'hsl(var(--glow-accent) / 0.06)', bottom: '20%', right: '15%' }}
      animate={{ x: [0, -40, 30, 0], y: [0, 30, -20, 0], scale: [1, 0.9, 1.1, 1] }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

export default AnimatedBackground;
