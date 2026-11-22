import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const FullScreenLoader = ({ label = 'Loading' }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-950">
    <div className="pointer-events-none absolute inset-0 bg-brand-radial" />
    <div className="relative flex flex-col items-center gap-6">
      <div className="relative h-20 w-20">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-accent-violet/20"
          aria-hidden
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-violet border-r-accent-blue"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-3 rounded-full border-2 border-transparent border-b-accent-purple"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-lg font-extrabold bg-brand-gradient bg-clip-text text-transparent">
            T
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-accent-violet" />
        <span className="tracking-wide">{label}…</span>
      </div>
      <div className="h-1 w-44 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full w-1/3 rounded-full bg-brand-gradient"
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  </div>
);

export const ButtonLoader = () => (
  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
);

export default FullScreenLoader;
