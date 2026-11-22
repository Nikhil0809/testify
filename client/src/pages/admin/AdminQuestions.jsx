import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageTransition from '../../components/PageTransition';
import Modal from '../../components/Modal';
import { ListSkeleton } from '../../components/Skeletons';
import { ErrorState, EmptyState } from '../../components/States';
import { ButtonLoader } from '../../components/Loader';
import { listQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../services/adminService';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SUBJECTS = ['Programming', 'JavaScript', 'DBMS', 'Computer Science', 'General Knowledge'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const emptyForm = {
  questionText: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  explanation: '',
  subject: 'Programming',
  difficulty: 'Medium',
  isActive: true,
};

const AdminQuestions = () => {
  useDocumentTitle('Manage questions');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    listQuestions({ page, limit: 8, ...(search && { search }), ...(subject && { subject }) })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, subject]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (q) => {
    setEditing(q);
    setForm({
      questionText: q.questionText,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      subject: q.subject,
      difficulty: q.difficulty,
      isActive: q.isActive,
    });
    setFormOpen(true);
  };

  const setOption = (i, val) => {
    const options = [...form.options];
    options[i] = val;
    setForm({ ...form, options });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (form.options.some((o) => !o.trim())) {
      toast.error('All four options are required');
      return;
    }
    if (new Set(form.options).size !== 4) {
      toast.error('Options must be unique');
      return;
    }
    if (!form.options.includes(form.correctAnswer)) {
      toast.error('Select the correct answer from the options');
      return;
    }

    setSaving(true);
    try {
      const res = editing
        ? await updateQuestion(editing._id, form)
        : await createQuestion(form);
      toast.success(res.message);
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleting || !toDelete) return;
    setDeleting(true);
    try {
      const res = await deleteQuestion(toDelete._id);
      toast.success(res.message);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const pagination = data?.pagination;

  return (
    <DashboardLayout title="Question Bank">
      <PageTransition className="mx-auto max-w-6xl space-y-5">
        <div className="glass rounded-2xl p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Question bank</h1>
              <p className="text-sm text-slate-500">
                {loading ? 'Loading…' : `${pagination?.total ?? 0} questions`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search questions…"
                  className="input-field !py-2 pl-9 text-sm lg:w-64"
                />
              </div>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-white/10 bg-navy-800 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-accent-violet/60"
              >
                <option value="">All subjects</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button onClick={openCreate} className="btn-primary">
                <Plus className="h-4 w-4" /> Add question
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <ListSkeleton rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : data.questions.length === 0 ? (
          <EmptyState
            title="No questions found"
            description="Add your first question to the bank or adjust your filters."
            action={
              <button onClick={openCreate} className="btn-primary">
                <Plus className="h-4 w-4" /> Add question
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {data.questions.map((q, i) => (
              <motion.article
                key={q._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                className="glass rounded-2xl p-5 transition hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium leading-relaxed text-white">{q.questionText}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-slate-300">
                        {q.subject}
                      </span>
                      <span
                        className={`rounded-md px-2 py-1 font-semibold ${
                          q.difficulty === 'Hard'
                            ? 'bg-rose-500/15 text-rose-300'
                            : q.difficulty === 'Medium'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span
                        className={`rounded-md px-2 py-1 font-semibold ${
                          q.isActive
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-slate-500/15 text-slate-400'
                        }`}
                      >
                        {q.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="rounded-md bg-accent-violet/15 px-2 py-1 text-accent-violet">
                        ✓ {q.correctAnswer}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                      {q.options.map((o) => (
                        <span
                          key={o}
                          className={`rounded-lg border px-3 py-1.5 text-xs ${
                            o === q.correctAnswer
                              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                              : 'border-white/10 bg-white/[0.03] text-slate-400'
                          }`}
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => openEdit(q)}
                      className="rounded-lg border border-white/10 bg-white/[0.05] p-2 text-slate-400 transition hover:border-accent-violet/50 hover:text-white"
                      aria-label="Edit question"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setToDelete(q)}
                      className="rounded-lg border border-white/10 bg-white/[0.05] p-2 text-slate-400 transition hover:border-rose-500/50 hover:text-rose-400"
                      aria-label="Delete question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost !py-2"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="text-sm text-slate-400">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="btn-ghost !py-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </PageTransition>

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit question' : 'Add new question'}
        size="lg"
        footer={
          <>
            <button onClick={() => setFormOpen(false)} className="btn-ghost" disabled={saving}>
              Cancel
            </button>
            <button onClick={submitForm} className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <ButtonLoader /> Saving…
                </>
              ) : editing ? (
                'Save changes'
              ) : (
                'Create question'
              )}
            </button>
          </>
        }
      >
        <form onSubmit={submitForm} className="space-y-4">
          <div>
            <label className="label-text">Question text</label>
            <textarea
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              rows={3}
              required
              className="input-field resize-none"
              placeholder="Enter the question…"
            />
          </div>

          <div>
            <label className="label-text">Options (choose the correct one)</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, correctAnswer: opt })}
                    disabled={!opt.trim()}
                    aria-label={`Mark option ${i + 1} correct`}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition ${
                      form.correctAnswer === opt && opt.trim()
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-white/15 bg-white/[0.05] text-slate-400 hover:text-white'
                    }`}
                  >
                    {form.correctAnswer === opt && opt.trim() ? '✓' : ['A', 'B', 'C', 'D'][i]}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    required
                    placeholder={`Option ${i + 1}`}
                    className="input-field !py-2.5 text-sm"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Correct answer:{' '}
              <span className="font-semibold text-emerald-400">
                {form.correctAnswer || 'not selected'}
              </span>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label-text">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="input-field"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="input-field"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Status</label>
              <select
                value={form.isActive ? 'active' : 'inactive'}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-text">Explanation (shown in review)</label>
            <textarea
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              rows={2}
              className="input-field resize-none"
              placeholder="Why is this the correct answer?"
            />
          </div>

          {/* hidden submit for enter key */}
          <button type="submit" className="hidden" aria-hidden />
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete question?"
        size="sm"
        footer={
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost" disabled={deleting}>
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500/90 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <ButtonLoader /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Delete
                </>
              )}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          This permanently removes the question from the bank. Existing attempts keep their stored
          data.
        </p>
        {toDelete && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
            {toDelete.questionText}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default AdminQuestions;
