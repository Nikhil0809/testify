import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Trophy, ClipboardCheck, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageTransition from '../../components/PageTransition';
import { ListSkeleton } from '../../components/Skeletons';
import { ErrorState, EmptyState } from '../../components/States';
import { listStudents } from '../../services/adminService';
import { shortDate, scoreTone, toneClasses } from '../../utils/helpers';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const AdminStudents = () => {
  useDocumentTitle('Students');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    setError(null);
    listStudents()
      .then((d) => setStudents(d.students))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const withAttempts = students.filter((s) => s.attempts > 0);
  const topPerformer = withAttempts.sort((a, b) => b.bestScore - a.bestScore)[0];

  return (
    <DashboardLayout title="Students">
      <PageTransition className="mx-auto max-w-6xl space-y-5">
        <div className="glass rounded-2xl p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Students</h1>
              <p className="text-sm text-slate-500">
                {loading ? 'Loading…' : `${students.length} registered student${students.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="input-field !py-2 pl-9 text-sm lg:w-72"
              />
            </div>
          </div>
        </div>

        {!loading && !error && students.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass rounded-2xl p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/30">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
              <p className="mt-3 font-display text-2xl font-extrabold text-white">
                {students.length}
              </p>
              <p className="text-sm text-slate-400">Total students</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <ClipboardCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="mt-3 font-display text-2xl font-extrabold text-white">
                {withAttempts.length}
              </p>
              <p className="text-sm text-slate-400">Students with attempts</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <p className="mt-3 font-display text-2xl font-extrabold text-white truncate">
                {topPerformer ? topPerformer.name : '—'}
              </p>
              <p className="text-sm text-slate-400">
                Top scorer {topPerformer ? `· ${topPerformer.bestScore}%` : ''}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <ListSkeleton rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7 text-accent-violet" />}
            title={search ? 'No matching students' : 'No students yet'}
            description={
              search
                ? 'Try a different name or email.'
                : 'Students appear here as soon as they sign up.'
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Student</th>
                    <th className="px-5 py-3.5 font-semibold">Joined</th>
                    <th className="px-5 py-3.5 font-semibold">Attempts</th>
                    <th className="px-5 py-3.5 font-semibold">Average</th>
                    <th className="px-5 py-3.5 font-semibold">Best</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {filtered.map((s, i) => {
                    const tone = toneClasses[scoreTone(s.bestScore)];
                    return (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.05, 0.3) }}
                        className="transition hover:bg-white/[0.05]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-xs font-bold text-white">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{s.name}</p>
                              <p className="text-xs text-slate-500">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-400">{shortDate(s.createdAt)}</td>
                        <td className="px-5 py-4 text-slate-300">{s.attempts}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-300">
                            <TrendingUp className="h-3.5 w-3.5 text-accent-violet" />
                            {s.averageScore}%
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${tone.bg} ${tone.border} ${tone.text}`}
                          >
                            {s.bestScore}%
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filtered.map((s) => (
                <div key={s.id} className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{s.name}</p>
                      <p className="truncate text-xs text-slate-500">{s.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-white/[0.05] p-2">
                      <p className="font-bold text-white">{s.attempts}</p>
                      <p className="text-slate-500">Attempts</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.05] p-2">
                      <p className="font-bold text-white">{s.averageScore}%</p>
                      <p className="text-slate-500">Average</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.05] p-2">
                      <p className="font-bold text-white">{s.bestScore}%</p>
                      <p className="text-slate-500">Best</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default AdminStudents;
