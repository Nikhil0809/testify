import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Eye,
  Filter,
  ArrowUpDown,
  Trophy,
  History as HistoryIcon,
  SearchX,
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { HistorySkeleton } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/States';
import PageTransition from '../components/PageTransition';
import { getHistory } from '../services/testService';
import { shortDate, scoreTone, toneClasses } from '../utils/helpers';
import useDocumentTitle from '../hooks/useDocumentTitle';

const History = () => {
  useDocumentTitle('Test history');
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [sort, setSort] = useState('newest');
  const [status, setStatus] = useState('');
  const [scoreBand, setScoreBand] = useState('');

  const params = useMemo(() => {
    const p = { sort };
    if (status) p.status = status;
    if (scoreBand === 'high') {
      p.minPercentage = 80;
    } else if (scoreBand === 'mid') {
      p.minPercentage = 50;
      p.maxPercentage = 79;
    } else if (scoreBand === 'low') {
      p.maxPercentage = 49;
    }
    return p;
  }, [sort, status, scoreBand]);

  const load = () => {
    setLoading(true);
    setError(null);
    getHistory(params)
      .then((d) => setAttempts(d.attempts))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [params]);

  const resetFilters = () => {
    setSort('newest');
    setStatus('');
    setScoreBand('');
  };

  const filtersActive = sort !== 'newest' || status || scoreBand;

  const body = () => {
    if (loading) return <HistorySkeleton rows={6} />;
    if (error) return <ErrorState message={error} onRetry={load} />;
    if (attempts.length === 0)
      return filtersActive ? (
        <EmptyState
          icon={<SearchX className="h-7 w-7 text-accent-violet" />}
          title="No matching attempts"
          description="No tests match the current filters. Try widening your search."
          action={
            <button onClick={resetFilters} className="btn-ghost">
              Clear filters
            </button>
          }
        />
      ) : (
        <EmptyState
          icon={<Trophy className="h-7 w-7 text-accent-violet" />}
          title="No tests yet"
          description="Take your first test and every attempt will be recorded here automatically."
          action={
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Go to dashboard
            </button>
          }
        />
      );

    return (
      <>
        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-semibold">#</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold">Score</th>
                <th className="px-5 py-3.5 font-semibold">Percentage</th>
                <th className="px-5 py-3.5 font-semibold">Breakdown</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {attempts.map((a, i) => {
                const tone = toneClasses[scoreTone(a.percentage)];
                return (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                    className="transition hover:bg-white/[0.05]"
                  >
                    <td className="px-5 py-4 text-slate-500">{i + 1}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{shortDate(a.submissionTime)}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(a.submissionTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-display font-bold text-white">
                        {a.score}
                        <span className="text-slate-500">/{a.totalQuestions}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: tone.ring }}
                            initial={{ width: 0 }}
                            animate={{ width: `${a.percentage}%` }}
                            transition={{ duration: 0.9, delay: 0.1 + i * 0.04 }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${tone.text}`}>{a.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      <span className="text-emerald-400">{a.correctCount} correct</span> ·{' '}
                      <span className="text-rose-400">{a.incorrectCount} wrong</span> ·{' '}
                      <span className="text-amber-400">{a.unansweredCount} skipped</span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${
                          a.status === 'expired'
                            ? 'border-amber-500/35 bg-amber-500/15 text-amber-300'
                            : 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => navigate(`/result/${a.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-accent-violet/50 hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {attempts.map((a, i) => {
            const tone = toneClasses[scoreTone(a.percentage)];
            return (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                onClick={() => navigate(`/result/${a.id}`)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {a.score}/{a.totalQuestions} · {a.percentage}%
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{shortDate(a.submissionTime)}</p>
                  </div>
                  <span
                    className={`rounded-lg border px-3 py-2 font-display text-lg font-bold ${tone.bg} ${tone.border} ${tone.text}`}
                  >
                    {a.percentage}%
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    <span className="text-emerald-400">{a.correctCount}</span> /{' '}
                    <span className="text-rose-400">{a.incorrectCount}</span> /{' '}
                    <span className="text-amber-400">{a.unansweredCount}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-accent-violet">
                    <Eye className="h-3.5 w-3.5" /> View result
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <DashboardLayout title="Test History">
      <PageTransition className="mx-auto max-w-6xl space-y-5">
        {/* Header + controls */}
        <div className="glass rounded-2xl p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Test history</h1>
              <p className="text-sm text-slate-500">
                {loading ? 'Loading attempts…' : `${attempts.length} attempt${attempts.length === 1 ? '' : 's'} found`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <ArrowUpDown className="h-4 w-4" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-xs text-slate-200 outline-none focus:border-accent-violet/60"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="best">Highest score</option>
                  <option value="worst">Lowest score</option>
                </select>
              </label>

              <button
                onClick={() => setFiltersOpen((o) => !o)}
                className={`btn-ghost !py-2 !text-xs ${filtersActive ? 'border-accent-violet/50 text-accent-violet' : ''}`}
              >
                <Filter className="h-3.5 w-3.5" /> Filters
              </button>
            </div>
          </div>

          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 overflow-hidden border-t border-white/10 pt-4"
            >
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="label-text">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-violet/60"
                  >
                    <option value="">All</option>
                    <option value="submitted">Submitted</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Score band</label>
                  <select
                    value={scoreBand}
                    onChange={(e) => setScoreBand(e.target.value)}
                    className="rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-violet/60"
                  >
                    <option value="">All scores</option>
                    <option value="high">80% and above</option>
                    <option value="mid">50% – 79%</option>
                    <option value="low">Below 50%</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={resetFilters} className="btn-ghost !py-2 !text-xs">
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {body()}
      </PageTransition>
    </DashboardLayout>
  );
};

export default History;
