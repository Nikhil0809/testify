import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ListChecks, ClipboardCheck, Percent } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageTransition from '../../components/PageTransition';
import { ErrorState } from '../../components/States';
import { DashboardSkeleton } from '../../components/Skeletons';
import { getStats } from '../../services/adminService';
import { toneClasses } from '../../utils/helpers';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const cards = [
  { key: 'totalStudents', label: 'Registered Students', icon: Users, tint: 'violet' },
  { key: 'totalQuestions', label: 'Questions in Bank', icon: ListChecks, tint: 'blue' },
  { key: 'totalAttempts', label: 'Completed Attempts', icon: ClipboardCheck, tint: 'emerald' },
  { key: 'averagePercentage', label: 'Average Percentage', icon: Percent, tint: 'amber' },
];

const AdminOverview = () => {
  useDocumentTitle('Admin overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getStats()
      .then((d) => setStats(d.stats))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const maxSubject = Math.max(1, ...(stats?.questionsBySubject || []).map((s) => s.count));

  return (
    <DashboardLayout title="Admin Overview">
      <PageTransition className="mx-auto max-w-7xl space-y-6">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-purple/25 blur-[80px]" />
          <div className="relative">
            <p className="text-sm font-semibold text-accent-violet">Administration</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">
              Platform overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Monitor the question bank, student activity and overall test performance from one
              place.
            </p>
          </div>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((c, i) => {
                const tone = toneClasses[c.tint] || toneClasses.violet;
                const value =
                  c.key === 'averagePercentage' ? `${stats.averagePercentage}%` : stats[c.key];
                return (
                  <motion.div
                    key={c.key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="glass glass-hover rounded-2xl p-5"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tone.bg} ${tone.border}`}>
                      <c.icon className={`h-5 w-5 ${tone.text}`} />
                    </div>
                    <p className="mt-4 font-display text-3xl font-extrabold text-white">{value}</p>
                    <p className="mt-1 text-sm text-slate-400">{c.label}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="glass rounded-2xl p-6">
                <h2 className="font-display text-lg font-semibold text-white">
                  Question bank by subject
                </h2>
                <p className="mb-5 text-sm text-slate-500">
                  {stats.activeQuestions} active / {stats.totalQuestions} total questions
                </p>
                <div className="space-y-4">
                  {stats.questionsBySubject.length === 0 ? (
                    <p className="text-sm text-slate-500">No questions yet. Seed the database.</p>
                  ) : (
                    stats.questionsBySubject.map((s, i) => (
                      <div key={s.subject}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="text-slate-300">{s.subject}</span>
                          <span className="text-slate-500">{s.count}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="h-full rounded-full bg-brand-gradient"
                            initial={{ width: 0 }}
                            animate={{ width: `${(s.count / maxSubject) * 100}%` }}
                            transition={{ duration: 0.9, delay: 0.15 + i * 0.08 }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="glass rounded-2xl p-6">
                <h2 className="font-display text-lg font-semibold text-white">Security model</h2>
                <p className="mb-5 text-sm text-slate-500">
                  How this platform keeps results trustworthy
                </p>
                <ul className="space-y-3 text-sm text-slate-300">
                  {[
                    'Correct answers are never sent to clients before submission.',
                    'Scores are calculated exclusively on the server.',
                    'Test expiry is enforced with backend timestamps.',
                    'Attempts are ownership-checked and cannot be double submitted.',
                    'Passwords are hashed with bcrypt; routes are JWT-protected.',
                  ].map((t) => (
                    <li key={t} className="flex gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-brand-gradient" />
                      <span className="leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default AdminOverview;
