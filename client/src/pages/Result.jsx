import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowLeft,
  RotateCcw,
  History as HistoryIcon,
  Clock,
  Calendar,
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { ErrorState, EmptyState } from '../components/States';
import PageTransition from '../components/PageTransition';
import ProgressRing from '../components/ProgressRing';
import { getResult, startTest } from '../services/testService';
import { formatDate, scoreTone, toneClasses } from '../utils/helpers';
import { ButtonLoader } from '../components/Loader';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Result = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  useDocumentTitle('Test result');

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const [tab, setTab] = useState('all');

  const load = () => {
    setLoading(true);
    setError(null);
    getResult(id)
      .then((data) => setResult(data.result))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleRetry = async () => {
    if (starting) return;
    setStarting(true);
    try {
      await startTest();
      toast.success('New test started!');
      navigate('/test');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Result">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="skeleton h-40 rounded-3xl" />
          <div className="grid gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Result">
        <div className="mx-auto max-w-2xl">
          <ErrorState message={error} onRetry={load} />
          <div className="mt-4 flex justify-center gap-3">
            <Link to="/history" className="btn-ghost">
              <HistoryIcon className="h-4 w-4" /> Test history
            </Link>
            <Link to="/dashboard" className="btn-primary">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!result) {
    return (
      <DashboardLayout title="Result">
        <EmptyState title="Result not found" description="This attempt does not exist." />
      </DashboardLayout>
    );
  }

  const tone = toneClasses[scoreTone(result.percentage)];
  const review =
    tab === 'all'
      ? result.review
      : tab === 'correct'
        ? result.review.filter((r) => r.isCorrect && r.selectedOption)
        : tab === 'incorrect'
          ? result.review.filter((r) => r.selectedOption && !r.isCorrect)
          : result.review.filter((r) => !r.selectedOption);

  const passed = result.percentage >= 50;

  return (
    <DashboardLayout title="Test Result">
      <PageTransition className="mx-auto max-w-6xl space-y-6">
        {/* Score hero */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8"
        >
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-accent-violet/25 blur-[90px]" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-accent-blue/20 blur-[80px]" />

          <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <ProgressRing
                percentage={result.percentage}
                label={`${result.percentage}%`}
                sublabel="score"
                size={190}
              />
              <div className="text-center sm:text-left">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tone.bg} ${tone.border} ${tone.text}`}
                >
                  {passed ? '🎉 Great job!' : '📚 Keep practicing'}
                </span>
                <h1 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">
                  You scored{' '}
                  <span className="bg-brand-gradient bg-clip-text text-transparent">
                    {result.score}/{result.totalQuestions}
                  </span>
                </h1>
                <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm text-slate-400 sm:justify-start">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> {formatDate(result.submissionTime)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {result.status === 'expired' ? 'Auto-submitted (time up)' : 'Submitted manually'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={handleRetry} disabled={starting} className="btn-primary">
                {starting ? (
                  <>
                    <ButtonLoader /> Starting…
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" /> Take another test
                  </>
                )}
              </button>
              <button onClick={() => navigate('/history')} className="btn-ghost">
                <HistoryIcon className="h-4 w-4" /> View history
              </button>
            </div>
          </div>

          {/* counters */}
          <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Correct', value: result.correctCount, tint: 'emerald', icon: CheckCircle2 },
              { label: 'Incorrect', value: result.incorrectCount, tint: 'rose', icon: XCircle },
              { label: 'Unanswered', value: result.unansweredCount, tint: 'amber', icon: MinusCircle },
              { label: 'Percentage', value: `${result.percentage}%`, tint: 'violet', icon: null },
            ].map((c, i) => {
              const t = toneClasses[c.tint];
              return (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className={`rounded-2xl border p-4 ${t.bg} ${t.border}`}
                >
                  <p className={`font-display text-2xl font-extrabold ${t.text}`}>{c.value}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-400">
                    {c.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Subject performance */}
        {result.subjectPerformance?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="font-display text-lg font-semibold text-white">Subject performance</h2>
            <p className="mb-5 text-sm text-slate-500">Accuracy split across subjects in this test</p>
            <div className="space-y-4">
              {result.subjectPerformance.map((s, i) => {
                const pct = Math.round((s.correct / s.total) * 100);
                return (
                  <div key={s.subject}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-slate-300">{s.subject}</span>
                      <span className="text-slate-400">
                        {s.correct}/{s.total} · {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-brand-gradient"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Review */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="glass rounded-2xl p-6"
        >
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                Question-by-question review
              </h2>
              <p className="text-sm text-slate-500">Compare your answer with the correct one</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: `All (${result.review.length})` },
                { key: 'correct', label: 'Correct' },
                { key: 'incorrect', label: 'Incorrect' },
                { key: 'unanswered', label: 'Skipped' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    tab === t.key
                      ? 'border-accent-violet bg-accent-violet/20 text-white'
                      : 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {review.length === 0 ? (
            <EmptyState title="Nothing here" description="No questions match this filter." />
          ) : (
            <ol className="space-y-4">
              {review.map((r, i) => {
                const skipped = !r.selectedOption;
                const state = skipped ? 'skipped' : r.isCorrect ? 'correct' : 'incorrect';
                const cfg = {
                  correct: { icon: CheckCircle2, cls: 'text-emerald-400', chip: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', label: 'Correct' },
                  incorrect: { icon: XCircle, cls: 'text-rose-400', chip: 'bg-rose-500/15 border-rose-500/30 text-rose-300', label: 'Incorrect' },
                  skipped: { icon: MinusCircle, cls: 'text-amber-400', chip: 'bg-amber-500/15 border-amber-500/30 text-amber-300', label: 'Unanswered' },
                }[state];
                const Icon = cfg.icon;
                const qNum = result.review.indexOf(r) + 1;

                return (
                  <motion.li
                    key={r.questionId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(0.04 * i, 0.3) }}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <p className="font-medium leading-relaxed text-white">
                        <span className="mr-2 text-slate-500">Q{qNum}.</span>
                        {r.questionText}
                      </p>
                      <span
                        className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${cfg.chip}`}
                      >
                        <Icon className="h-3.5 w-3.5" /> {cfg.label}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div
                        className={`rounded-xl border p-3 ${
                          skipped
                            ? 'border-white/10 bg-white/[0.03]'
                            : r.isCorrect
                              ? 'border-emerald-500/35 bg-emerald-500/10'
                              : 'border-rose-500/35 bg-rose-500/10'
                        }`}
                      >
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Your answer
                        </p>
                        <p className="text-sm text-slate-200">{r.selectedOption || 'Not answered'}</p>
                      </div>
                      <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">
                          Correct answer
                        </p>
                        <p className="text-sm text-emerald-200">{r.correctAnswer}</p>
                      </div>
                    </div>

                    {r.explanation && (
                      <div className="mt-3 flex gap-2 rounded-xl border border-accent-violet/25 bg-accent-violet/10 p-3">
                        <span className="text-xs font-bold text-accent-violet">💡</span>
                        <p className="text-xs leading-relaxed text-slate-300">{r.explanation}</p>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ol>
          )}
        </motion.section>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Result;
