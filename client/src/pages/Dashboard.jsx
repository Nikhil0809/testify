import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlayCircle,
  History,
  Target,
  TrendingUp,
  Trophy,
  ArrowRight,
  Clock,
  ClipboardCheck,
  Flame,
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { DashboardSkeleton } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { getDashboard, getActiveTest, startTest } from '../services/testService';
import { greeting, formatDate, toneClasses } from '../utils/helpers';
import PageTransition from '../components/PageTransition';
import { ButtonLoader } from '../components/Loader';

const statCards = [
  { key: 'totalAttempts', label: 'Total Attempts', icon: ClipboardCheck, tint: 'violet' },
  { key: 'averageScore', label: 'Average Score', icon: TrendingUp, tint: 'blue' },
  { key: 'bestScore', label: 'Best Score', icon: Trophy, tint: 'emerald' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const [hasActive, setHasActive] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([getDashboard(), getActiveTest()])
      .then(([dash, active]) => {
        setData(dash.stats);
        setHasActive(!!active.attempt);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const res = await startTest();
      toast.success(res.resumed ? 'Resuming your test in progress' : 'Test started — good luck!');
      navigate('/test');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setStarting(false);
    }
  };

  const stats = data;
  const recent = stats?.recentAttempts || [];

  return (
    <DashboardLayout title="Dashboard">
      <PageTransition className="mx-auto max-w-7xl space-y-6">
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <>
            {/* Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-violet/25 blur-[80px]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-accent-violet">
                    <Flame className="h-4 w-4" /> {greeting()}
                  </p>
                  <h1 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">
                    {user?.name?.split(' ')[0]} 👋
                  </h1>
                  <p className="mt-2 max-w-xl text-sm text-slate-400">
                    {hasActive
                      ? 'You have a test in progress — jump back in before the timer runs out.'
                      : 'Ready for a challenge? A fresh set of 10 questions is waiting for you.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {hasActive && (
                    <button onClick={() => navigate('/test')} className="btn-ghost">
                      Resume test <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStart}
                    disabled={starting}
                    className="btn-primary"
                  >
                    {starting ? (
                      <>
                        <ButtonLoader /> Preparing…
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-5 w-5" />
                        {hasActive ? 'Continue Test' : 'Start Test'}
                      </>
                    )}
                  </motion.button>
                  <button onClick={() => navigate('/history')} className="btn-ghost">
                    <History className="h-4 w-4" /> View History
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Stat cards */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {statCards.map((card, i) => {
                const tone = toneClasses[card.tint] || toneClasses.violet;
                const value =
                  card.key === 'totalAttempts'
                    ? stats?.totalAttempts ?? 0
                    : `${stats?.[card.key] ?? 0}%`;
                return (
                  <motion.div
                    key={card.key}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                    className="glass glass-hover rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tone.bg} ${tone.border}`}
                      >
                        <card.icon className={`h-5 w-5 ${tone.text}`} />
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.bg} ${tone.text}`}>
                        {card.key === 'totalAttempts' ? 'attempts' : 'percent'}
                      </span>
                    </div>
                    <p className="mt-4 font-display text-3xl font-extrabold text-white">{value}</p>
                    <p className="mt-1 text-sm text-slate-400">{card.label}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Recent activity */}
            <div className="grid gap-5 lg:grid-cols-3">
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="glass rounded-2xl p-6 lg:col-span-2"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-white">
                      Recent activity
                    </h2>
                    <p className="text-sm text-slate-500">Your latest completed tests</p>
                  </div>
                  <button
                    onClick={() => navigate('/history')}
                    className="text-sm font-semibold text-accent-violet hover:text-accent-purple"
                  >
                    View all
                  </button>
                </div>

                {recent.length === 0 ? (
                  <EmptyState
                    icon={<Target className="h-7 w-7 text-accent-violet" />}
                    title="No tests yet"
                    description="Complete your first test and your results will appear here."
                    action={
                      <button onClick={handleStart} disabled={starting} className="btn-primary">
                        {starting ? <ButtonLoader /> : <PlayCircle className="h-4 w-4" />}
                        Start your first test
                      </button>
                    }
                  />
                ) : (
                  <ul className="space-y-3">
                    {recent.map((a, i) => {
                      const tone = toneClasses[a.percentage >= 80 ? 'emerald' : a.percentage >= 50 ? 'amber' : 'rose'];
                      return (
                        <motion.li
                          key={a.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.06 * i }}
                        >
                          <button
                            onClick={() => navigate(`/result/${a.id}`)}
                            className="group flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.07]"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone.bg} ${tone.border}`}>
                                <span className={`text-sm font-bold ${tone.text}`}>
                                  {a.score}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  Score {a.score}/10 · {a.percentage}%
                                </p>
                                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(a.submissionTime)}
                                  {a.status === 'expired' && (
                                    <span className="ml-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                                      expired
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-accent-violet" />
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </motion.section>

              {/* How it works */}
              <motion.aside
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="glass rounded-2xl p-6"
              >
                <h2 className="font-display text-lg font-semibold text-white">How it works</h2>
                <p className="mb-5 text-sm text-slate-500">Three simple steps</p>
                <ol className="space-y-4">
                  {[
                    { t: 'Start the test', d: '10 random MCQs are pulled from the question bank.' },
                    { t: 'Beat the clock', d: 'You have 10 minutes — the timer survives refreshes.' },
                    { t: 'Review results', d: 'Instant score, per-question review and explanations.' },
                  ].map((s, i) => (
                    <li key={s.t} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{s.t}</p>
                        <p className="text-xs leading-relaxed text-slate-400">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 rounded-xl border border-accent-violet/25 bg-accent-violet/10 p-4">
                  <p className="text-xs leading-relaxed text-slate-300">
                    <span className="font-semibold text-white">Tip:</span> flag tricky questions for
                    review using the palette, then come back to them before submitting.
                  </p>
                </div>
              </motion.aside>
            </div>
          </>
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default Dashboard;
