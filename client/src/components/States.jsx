import { motion } from 'framer-motion';
import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';

export const EmptyState = ({ icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center"
  >
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-violet/15 border border-accent-violet/25">
      {icon || <Inbox className="h-7 w-7 text-accent-violet" />}
    </div>
    <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
    {description && <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </motion.div>
);

export const ErrorState = ({ message = 'Something went wrong', onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass flex flex-col items-center justify-center rounded-2xl border-rose-500/20 px-6 py-14 text-center"
  >
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/25">
      <AlertTriangle className="h-7 w-7 text-rose-400" />
    </div>
    <h3 className="font-display text-lg font-semibold text-white">Unable to load</h3>
    <p className="mt-2 max-w-md text-sm text-slate-400">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-ghost mt-6">
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    )}
  </motion.div>
);

export default EmptyState;
