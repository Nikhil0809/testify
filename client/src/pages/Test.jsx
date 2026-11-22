import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  Flag,
  CheckCircle2,
  Circle,
  AlertCircle,
  LayoutGrid,
  X,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { startTest, saveAnswers, submitTest } from '../services/testService';
import { QuestionSkeleton } from '../components/Skeletons';
import { ErrorState } from '../components/States';
import { ButtonLoader } from '../components/Loader';
import Modal from '../components/Modal';
import useTimer from '../hooks/useTimer';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatTime } from '../utils/helpers';

const optionLetter = ['A', 'B', 'C', 'D'];

const Test = () => {
  useDocumentTitle('Test in progress');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> {selectedOption, status}
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mobilePalette, setMobilePalette] = useState(false);
  const [expiredModal, setExpiredModal] = useState(false);

  const saveTimer = useRef(null);
  const submittingRef = useRef(false);

  // ---- load or resume attempt ----
  useEffect(() => {
    let cancelled = false;
    startTest()
      .then((res) => {
        if (cancelled) return;
        const a = res.attempt;
        setAttempt(a);
        setAnswers(
          Object.fromEntries(
            a.answers.map((ans) => [
              ans.questionId,
              { selectedOption: ans.selectedOption, status: ans.status },
            ])
          )
        );
        if (!res.resumed) toast.success('Test started — 10 minutes on the clock!');
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const questions = attempt?.questions || [];
  const current = questions[index];

  const statusOf = useCallback(
    (qid) => {
      const a = answers[qid];
      if (!a) return 'unanswered';
      return a.status;
    },
    [answers]
  );

  const answeredCount = useMemo(
    () =>
      questions.filter((q) => {
        const a = answers[q.id];
        return a?.selectedOption;
      }).length,
    [questions, answers]
  );

  // ---- server save (debounced) ----
  const flushSave = useCallback(
    (force = false) => {
      if (!attempt || submittingRef.current) return;
      const payload = questions.map((q) => {
        const a = answers[q.id] || {};
        return {
          questionId: q.id,
          selectedOption: a.selectedOption || null,
          status: a.status || 'unanswered',
        };
      });
      const dirty = payload.some((p) => {
        const prev = attempt.answers.find((x) => x.questionId === p.questionId);
        return (
          !prev ||
          prev.selectedOption !== p.selectedOption ||
          prev.status !== p.status
        );
      });
      if (!dirty && !force) return;

      setSaving(true);
      saveAnswers(attempt.id, payload)
        .then((res) => {
          setLastSaved(new Date());
          setAttempt((prev) => ({ ...prev, answers: res.answers }));
        })
        .catch((e) => {
          if (!/already been submitted|expired/i.test(e.message)) toast.error(e.message);
        })
        .finally(() => setSaving(false));
    },
    [attempt, answers, questions]
  );

  useEffect(() => {
    if (!attempt || !questions.length) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => flushSave(), 1200);
    return () => clearTimeout(saveTimer.current);
  }, [answers, attempt, questions.length, flushSave]);

  // Save on unmount / tab hide
  const flushRef = useRef(flushSave);
  flushRef.current = flushSave;

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushRef.current();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      clearTimeout(saveTimer.current);
      // flush any pending edit when leaving the test page
      flushRef.current();
    };
  }, []);

  // ---- submission ----
  const doSubmit = useCallback(
    async (isAuto = false) => {
      if (!attempt || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      clearTimeout(saveTimer.current);
      try {
        const payload = questions.map((q) => {
          const a = answers[q.id] || {};
          return {
            questionId: q.id,
            selectedOption: a.selectedOption || null,
            status: a.status || 'unanswered',
          };
        });
        const res = await submitTest(attempt.id, payload);
        toast.success(
          isAuto ? 'Time is up — your test was submitted automatically.' : res.message
        );
        navigate(`/result/${attempt.id}`, { replace: true });
      } catch (e) {
        toast.error(e.message);
        // If already submitted, jump to its result
        if (/already been submitted/i.test(e.message)) {
          navigate(`/result/${attempt.id}`, { replace: true });
        } else {
          submittingRef.current = false;
          setSubmitting(false);
        }
      }
    },
    [attempt, answers, questions, navigate]
  );

  const { remaining, isLow, isCritical } = useTimer(attempt?.expiryTime, () => {
    setExpiredModal(true);
    doSubmit(true);
  });

  // ---- interactions ----
  const selectOption = (opt) => {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: {
        selectedOption: opt,
        status: 'answered',
      },
    }));
  };

  const toggleReview = () => {
    if (!current) return;
    setAnswers((prev) => {
      const cur = prev[current.id] || { selectedOption: null, status: 'unanswered' };
      if (cur.status === 'review') {
        return {
          ...prev,
          [current.id]: {
            ...cur,
            status: cur.selectedOption ? 'answered' : 'unanswered',
          },
        };
      }
      return { ...prev, [current.id]: { ...cur, status: 'review' } };
    });
  };

  const clearAnswer = () => {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { selectedOption: null, status: 'unanswered' },
    }));
  };

  const jumpTo = (i) => {
    setIndex(i);
    setMobilePalette(false);
  };

  // ---- render states ----
  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-10 w-28 rounded-xl" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <QuestionSkeleton />
            <div className="skeleton hidden h-80 rounded-2xl lg:block" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-950 px-4 py-16">
        <div className="mx-auto max-w-xl">
          <ErrorState
            message={error}
            onRetry={() => window.location.reload()}
          />
          <div className="mt-4 text-center">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost">
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentAnswer = current ? answers[current.id] : null;
  const isReview = currentAnswer?.status === 'review';
  const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0;

  const paletteItems = questions.map((q, i) => {
    const st = statusOf(q.id);
    const selected = i === index;
    const cls =
      st === 'answered'
        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
        : st === 'review'
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
          : selected
            ? 'bg-accent-violet/30 border-accent-violet text-white'
            : 'bg-white/[0.05] border-white/10 text-slate-400 hover:border-white/30';
    return { q, i, st, selected, cls };
  });

  const Palette = ({ inDrawer = false }) => (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-400">
          Question palette
        </h3>
        {inDrawer && (
          <button onClick={() => setMobilePalette(false)} aria-label="Close palette">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {paletteItems.map(({ q, i, selected, cls }) => (
          <button
            key={q.id}
            onClick={() => jumpTo(i)}
            title={`Question ${i + 1}`}
            className={`flex h-10 items-center justify-center rounded-lg border text-xs font-bold transition ${cls} ${
              selected ? 'ring-2 ring-accent-violet/60' : ''
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-emerald-500/60" /> Answered
          </span>
          <span className="font-semibold text-white">
            {questions.filter((q) => answers[q.id]?.selectedOption).length}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-white/20" /> Unanswered
          </span>
          <span className="font-semibold text-white">{questions.length - answeredCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-amber-500/60" /> Marked for review
          </span>
          <span className="font-semibold text-white">
            {questions.filter((q) => answers[q.id]?.status === 'review').length}
          </span>
        </div>
      </div>

      <button onClick={() => setConfirmOpen(true)} className="btn-primary mt-5 w-full">
        <Send className="h-4 w-4" /> Submit test
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <Wifi className={`h-3 w-3 ${saving ? 'text-amber-400' : 'text-emerald-400'}`} />
        {saving
          ? 'Saving answers…'
          : lastSaved
            ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
            : 'Answers auto-save'}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Sticky exam header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-xs font-bold text-white">
              T
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">
                Mini Online Test
              </p>
              <p className="text-xs text-slate-500">
                {user?.name} · {questions.length} questions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* progress */}
            <div className="hidden w-40 md:block">
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>
                  {answeredCount}/{questions.length} answered
                </span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-brand-gradient"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                />
              </div>
            </div>

            {/* timer */}
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-display text-lg font-bold tabular-nums ${
                isCritical
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-300 animate-pulse'
                  : isLow
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                    : 'border-white/10 bg-white/[0.05] text-white'
              }`}
              aria-live="polite"
            >
              <Clock className="h-4 w-4" />
              {formatTime(remaining)}
            </div>

            <button
              onClick={() => setMobilePalette(true)}
              className="btn-ghost !px-3 lg:hidden"
              aria-label="Open question palette"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* mobile progress bar */}
        <div className="h-1 w-full bg-white/10 md:hidden">
          <motion.div
            className="h-full bg-brand-gradient"
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 160, damping: 24 }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_300px] lg:px-8">
        {/* Question area */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={current?.id || 'loading'}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="glass rounded-2xl p-5 sm:p-8"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-brand-gradient px-3 py-1 text-xs font-bold text-white">
                    Question {index + 1} of {questions.length}
                  </span>
                  {current?.subject && (
                    <span className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-slate-300">
                      {current.subject}
                    </span>
                  )}
                  {current?.difficulty && (
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                        current.difficulty === 'Hard'
                          ? 'bg-rose-500/15 text-rose-300'
                          : current.difficulty === 'Medium'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {current.difficulty}
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleReview}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    isReview
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                      : 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-white'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {isReview ? 'Marked for review' : 'Mark for review'}
                </button>
              </div>

              <h2 className="font-display text-xl font-bold leading-relaxed text-white sm:text-2xl">
                {current?.questionText}
              </h2>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {current?.options?.map((opt, oi) => {
                  const active = currentAnswer?.selectedOption === opt;
                  return (
                    <motion.button
                      key={opt}
                      onClick={() => selectOption(opt)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`group flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                        active
                          ? 'border-accent-violet bg-accent-violet/15 shadow-[0_0_30px_-12px_rgba(139,92,246,0.9)]'
                          : 'border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.07]'
                      }`}
                      aria-pressed={active}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition ${
                          active
                            ? 'border-accent-violet bg-accent-violet text-white'
                            : 'border-white/15 bg-white/[0.05] text-slate-400 group-hover:text-white'
                        }`}
                      >
                        {active ? <CheckCircle2 className="h-4 w-4" /> : optionLetter[oi]}
                      </span>
                      <span className={`text-sm leading-snug ${active ? 'text-white' : 'text-slate-300'}`}>
                        {opt}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {currentAnswer?.selectedOption && (
                <button
                  onClick={clearAnswer}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-rose-400"
                >
                  <Circle className="h-3.5 w-3.5" /> Clear response
                </button>
              )}

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-6">
                <button
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index === 0}
                  className="btn-ghost"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>

                <div className="hidden gap-1.5 sm:flex">
                  {questions.map((q, i) => {
                    const st = statusOf(q.id);
                    const dot =
                      st === 'answered'
                        ? 'bg-emerald-500'
                        : st === 'review'
                          ? 'bg-amber-500'
                          : 'bg-white/20';
                    return (
                      <button
                        key={q.id}
                        onClick={() => jumpTo(i)}
                        aria-label={`Go to question ${i + 1}`}
                        className={`h-2 rounded-full transition-all ${
                          i === index ? 'w-6 bg-accent-violet' : `w-2 ${dot} hover:bg-white/50`
                        }`}
                      />
                    );
                  })}
                </div>

                {index === questions.length - 1 ? (
                  <button onClick={() => setConfirmOpen(true)} className="btn-primary">
                    <Send className="h-4 w-4" /> Submit
                  </button>
                ) : (
                  <button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))} className="btn-primary">
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop palette */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <Palette />
          </div>
        </aside>
      </div>

      {/* Mobile palette drawer */}
      <AnimatePresence>
        {mobilePalette && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobilePalette(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[55] max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/15 bg-navy-900/95 p-4 backdrop-blur-2xl lg:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />
              <Palette inDrawer />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Submission confirmation */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit your test?"
        footer={
          <>
            <button onClick={() => setConfirmOpen(false)} className="btn-ghost" disabled={submitting}>
              Keep working
            </button>
            <button onClick={() => doSubmit(false)} className="btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <ButtonLoader /> Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit now
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-slate-300">
          <p>You are about to submit your answers. You cannot change them afterwards.</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
              <p className="font-display text-2xl font-bold text-emerald-300">{answeredCount}</p>
              <p className="text-[11px] uppercase tracking-wide text-emerald-300/80">Answered</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-center">
              <p className="font-display text-2xl font-bold text-white">
                {questions.length - answeredCount}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Unanswered</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
              <p className="font-display text-2xl font-bold text-amber-300">
                {questions.filter((q) => answers[q.id]?.status === 'review').length}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-amber-300/80">For review</p>
            </div>
          </div>
          {questions.length - answeredCount > 0 && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Unanswered questions are marked incorrect and will reduce your score.
            </p>
          )}
        </div>
      </Modal>

      {/* Time expired modal */}
      <Modal
        open={expiredModal}
        onClose={() => setExpiredModal(false)}
        title="Time's up!"
        size="sm"
        footer={
          <button className="btn-primary w-full" disabled>
            <ButtonLoader /> Preparing your result…
          </button>
        }
      >
        <p className="text-sm text-slate-300">
          The 10-minute limit has been reached. Your answers are being submitted automatically and
          your result will be ready in a moment.
        </p>
      </Modal>
    </div>
  );
};

export default Test;
