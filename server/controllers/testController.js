import TestAttempt from '../models/TestAttempt.js';
import Question from '../models/Question.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';

// Test length in seconds (default 10 minutes). Configurable per deployment.
const TEST_DURATION_MS =
  Math.max(30, Number(process.env.TEST_DURATION_SECONDS) || 600) * 1000;
const TOTAL_QUESTIONS = 10;

const sanitizeQuestion = (q) => ({
  id: q._id,
  questionText: q.questionText,
  options: q.options,
  subject: q.subject,
  difficulty: q.difficulty,
  explanation: q.explanation || '',
});

const sanitizeAnswer = (a) => ({
  questionId: a.questionId,
  selectedOption: a.selectedOption,
  status: a.status,
});

// Keep question order identical to the order stored on the attempt so the
// navigation experience is stable across resumes/refreshes.
const orderQuestions = (questions, ids) => {
  const byId = new Map(questions.map((q) => [q._id.toString(), q]));
  return ids
    .map((id) => byId.get(id.toString()))
    .filter(Boolean);
};

// Resolve an in-progress attempt: if expired, grade it server-side and mark expired.
const resolveActiveAttempt = async (attempt) => {
  const now = Date.now();
  if (attempt.status === 'in_progress' && now > new Date(attempt.expiryTime).getTime()) {
    await gradeAndFinalize(attempt, 'expired');
    await attempt.save();
  }
  return attempt;
};

const gradeAndFinalize = async (attempt, status) => {
  const questionIds = attempt.questions.map((id) => id.toString());
  const questions = await Question.find({ _id: { $in: questionIds } });
  const byId = new Map(questions.map((q) => [q._id.toString(), q]));

  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  attempt.answers.forEach((ans) => {
    const q = byId.get(ans.questionId.toString());
    if (!q || !ans.selectedOption) {
      unanswered += 1;
      ans.status = ans.status === 'review' ? 'review' : 'unanswered';
      return;
    }
    if (ans.selectedOption === q.correctAnswer) correct += 1;
    else incorrect += 1;
  });

  attempt.score = correct;
  attempt.correctCount = correct;
  attempt.incorrectCount = incorrect;
  attempt.unansweredCount = unanswered;
  attempt.percentage = Math.round((correct / attempt.questions.length) * 10000) / 100;
  attempt.status = status;
  attempt.submissionTime = new Date();
};

// GET /api/tests/questions — pool available for a new test
export const getQuestionPool = asyncHandler(async (req, res) => {
  const count = await Question.countDocuments({ isActive: true });
  res.json({ success: true, count, totalPerTest: TOTAL_QUESTIONS });
});

// POST /api/tests/start — start or resume an active test
export const startTest = asyncHandler(async (req, res) => {
  let active = await TestAttempt.findOne({
    userId: req.user._id,
    status: 'in_progress',
  });

  if (active) {
    await resolveActiveAttempt(active);
    if (active.status === 'in_progress') {
      const found = await Question.find({ _id: { $in: active.questions } });
      const questions = orderQuestions(found, active.questions);
      return res.json({
        success: true,
        resumed: true,
        attempt: buildTestPayload(active, questions),
      });
    }
  }

  const pool = await Question.aggregate([
    { $match: { isActive: true } },
    { $sample: { size: TOTAL_QUESTIONS } },
  ]);

  if (pool.length < TOTAL_QUESTIONS) {
    throw new ApiError(400, 'Not enough questions available. Please contact the administrator.');
  }

  const startTime = new Date();
  const expiryTime = new Date(startTime.getTime() + TEST_DURATION_MS);

  let attempt;
  try {
    attempt = await TestAttempt.create({
      userId: req.user._id,
      questions: pool.map((q) => q._id),
      answers: pool.map((q) => ({
        questionId: q._id,
        selectedOption: null,
        status: 'unanswered',
      })),
      startTime,
      expiryTime,
      status: 'in_progress',
    });
  } catch (err) {
    // Unique partial index: another concurrent request already created the attempt.
    if (err?.code === 11000) {
      const existing = await TestAttempt.findOne({
        userId: req.user._id,
        status: 'in_progress',
      });
      if (existing) {
        await resolveActiveAttempt(existing);
        if (existing.status === 'in_progress') {
          const found = await Question.find({ _id: { $in: existing.questions } });
          const existingQuestions = orderQuestions(found, existing.questions);
          return res.json({
            success: true,
            resumed: true,
            attempt: buildTestPayload(existing, existingQuestions),
          });
        }
      }
    }
    throw err;
  }

  res.status(201).json({
    success: true,
    resumed: false,
    message: 'Test started',
    attempt: buildTestPayload(attempt, pool),
  });
});

const buildTestPayload = (attempt, questions) => ({
  id: attempt._id,
  startTime: attempt.startTime,
  expiryTime: attempt.expiryTime,
  status: attempt.status,
  totalQuestions: attempt.questions.length,
  answers: attempt.answers.map(sanitizeAnswer),
  questions: questions.map(sanitizeQuestion),
});

// GET /api/tests/active — retrieve current in-progress test
export const getActiveTest = asyncHandler(async (req, res) => {
  const attempt = await TestAttempt.findOne({ userId: req.user._id, status: 'in_progress' });
  if (!attempt) return res.json({ success: true, attempt: null });

  await resolveActiveAttempt(attempt);
  if (attempt.status !== 'in_progress') {
    return res.json({ success: true, attempt: null, expiredNow: true, attemptId: attempt._id });
  }

  const found = await Question.find({ _id: { $in: attempt.questions } });
  const questions = orderQuestions(found, attempt.questions);
  res.json({ success: true, attempt: buildTestPayload(attempt, questions) });
});

// PUT /api/tests/:id/answers — save answers (never stores correct answers client-side)
export const saveAnswers = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  const attempt = await TestAttempt.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!attempt) throw new ApiError(404, 'Test attempt not found');

  await resolveActiveAttempt(attempt);
  if (attempt.status !== 'in_progress') {
    throw new ApiError(410, 'This test has already been submitted');
  }
  if (Date.now() > new Date(attempt.expiryTime).getTime()) {
    throw new ApiError(410, 'Test time has expired');
  }

  const validIds = new Set(attempt.questions.map((id) => id.toString()));
  const incoming = new Map();
  answers.forEach((a) => {
    if (validIds.has(a.questionId)) incoming.set(a.questionId, a);
  });

  attempt.answers = attempt.answers.map((prev) => {
    const upd = incoming.get(prev.questionId.toString());
    if (!upd) return prev;
    return {
      questionId: prev.questionId,
      selectedOption: upd.selectedOption || null,
      status: upd.status || (upd.selectedOption ? 'answered' : 'unanswered'),
    };
  });

  await attempt.save();
  res.json({
    success: true,
    message: 'Answers saved',
    savedAt: new Date(),
    answers: attempt.answers.map(sanitizeAnswer),
  });
});

// POST /api/tests/:id/submit — manual or automatic submission
export const submitTest = asyncHandler(async (req, res) => {
  const attempt = await TestAttempt.findOne({ _id: req.params.id, userId: req.user._id });
  if (!attempt) throw new ApiError(404, 'Test attempt not found');

  if (attempt.status !== 'in_progress') {
    throw new ApiError(409, 'This test has already been submitted');
  }

  // Persist any final answers sent with the submission before grading.
  if (Array.isArray(req.body.answers) && req.body.answers.length) {
    const validIds = new Set(attempt.questions.map((id) => id.toString()));
    const incoming = new Map(
      req.body.answers.filter((a) => validIds.has(a.questionId)).map((a) => [a.questionId, a])
    );
    attempt.answers = attempt.answers.map((prev) => {
      const upd = incoming.get(prev.questionId.toString());
      if (!upd) return prev;
      return {
        questionId: prev.questionId,
        selectedOption: upd.selectedOption || null,
        status: upd.status || (upd.selectedOption ? 'answered' : 'unanswered'),
      };
    });
  }

  const expired = Date.now() > new Date(attempt.expiryTime).getTime();
  await gradeAndFinalize(attempt, expired ? 'expired' : 'submitted');
  await attempt.save();

  res.json({
    success: true,
    message: expired ? 'Time expired — test auto-submitted' : 'Test submitted successfully',
    attemptId: attempt._id,
    score: attempt.score,
    percentage: attempt.percentage,
  });
});

// GET /api/tests/:id/result — full graded result with review
export const getResult = asyncHandler(async (req, res) => {
  const attempt = await TestAttempt.findOne({ _id: req.params.id, userId: req.user._id });
  if (!attempt) throw new ApiError(404, 'Test attempt not found');
  await resolveActiveAttempt(attempt);
  if (attempt.status === 'in_progress') {
    throw new ApiError(400, 'Test is still in progress');
  }

  const questions = await Question.find({ _id: { $in: attempt.questions } });
  const byId = new Map(questions.map((q) => [q._id.toString(), q]));

  const review = attempt.answers.map((a) => {
    const q = byId.get(a.questionId.toString());
    return {
      questionId: a.questionId,
      questionText: q?.questionText || 'Question unavailable',
      options: q?.options || [],
      correctAnswer: q?.correctAnswer || null,
      selectedOption: a.selectedOption,
      status: a.status,
      isCorrect: !!q && a.selectedOption === q.correctAnswer,
      explanation: q?.explanation || '',
      subject: q?.subject || '',
      difficulty: q?.difficulty || '',
    };
  });

  // Performance by subject
  const subjectMap = {};
  review.forEach((r) => {
    const key = r.subject || 'General';
    if (!subjectMap[key]) subjectMap[key] = { subject: key, total: 0, correct: 0 };
    subjectMap[key].total += 1;
    if (r.isCorrect) subjectMap[key].correct += 1;
  });

  res.json({
    success: true,
    result: {
      id: attempt._id,
      status: attempt.status,
      startTime: attempt.startTime,
      submissionTime: attempt.submissionTime,
      expiryTime: attempt.expiryTime,
      score: attempt.score,
      totalQuestions: attempt.questions.length,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unansweredCount: attempt.unansweredCount,
      percentage: attempt.percentage,
      review,
      subjectPerformance: Object.values(subjectMap),
    },
  });
});

// GET /api/tests/history — logged-in student's attempts
export const getHistory = asyncHandler(async (req, res) => {
  const { sort = 'newest', subject, minPercentage, maxPercentage, status } = req.query;

  const query = { userId: req.user._id, status: { $ne: 'in_progress' } };
  if (status && ['submitted', 'expired'].includes(status)) query.status = status;

  const sortMap = {
    newest: { submissionTime: -1 },
    oldest: { submissionTime: 1 },
    best: { percentage: -1 },
    worst: { percentage: 1 },
  };

  let attempts = await TestAttempt.find(query)
    .sort(sortMap[sort] || sortMap.newest)
    .select(
      'score correctCount incorrectCount unansweredCount percentage status startTime submissionTime expiryTime createdAt questions'
    );

  // Optional filters requiring question data
  if (subject || minPercentage !== undefined || maxPercentage !== undefined) {
    const withQuestions = await TestAttempt.find(query)
      .sort(sortMap[sort] || sortMap.newest)
      .populate({ path: 'questions', select: 'subject' });

    attempts = withQuestions.filter((a) => {
      if (subject) {
        const subs = a.questions.map((q) => q.subject);
        if (!subs.includes(subject)) return false;
      }
      if (minPercentage !== undefined && a.percentage < Number(minPercentage)) return false;
      if (maxPercentage !== undefined && a.percentage > Number(maxPercentage)) return false;
      return true;
    });
  }

  res.json({
    success: true,
    attempts: attempts.map((a) => ({
      id: a._id,
      score: a.score,
      totalQuestions: a.questions.length,
      correctCount: a.correctCount,
      incorrectCount: a.incorrectCount,
      unansweredCount: a.unansweredCount,
      percentage: a.percentage,
      status: a.status,
      startTime: a.startTime,
      submissionTime: a.submissionTime || a.createdAt,
    })),
  });
});

// GET /api/tests/dashboard — stats for the student dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  const attempts = await TestAttempt.find({
    userId: req.user._id,
    status: { $ne: 'in_progress' },
  })
    .sort({ submissionTime: -1 })
    .select('score percentage status submissionTime createdAt');

  const totalAttempts = attempts.length;
  const avg = totalAttempts
    ? Math.round((attempts.reduce((s, a) => s + a.percentage, 0) / totalAttempts) * 100) / 100
    : 0;
  const best = totalAttempts ? Math.max(...attempts.map((a) => a.percentage)) : 0;

  res.json({
    success: true,
    stats: {
      totalAttempts,
      averageScore: avg,
      bestScore: best,
      recentAttempts: attempts.slice(0, 5).map((a) => ({
        id: a._id,
        score: a.score,
        percentage: a.percentage,
        status: a.status,
        submissionTime: a.submissionTime || a.createdAt,
      })),
    },
  });
});
