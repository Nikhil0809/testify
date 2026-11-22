import Question from '../models/Question.js';
import User from '../models/User.js';
import TestAttempt from '../models/TestAttempt.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';

// GET /api/admin/questions
export const listQuestions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, subject, difficulty, search, isActive } = req.query;
  const query = {};
  if (subject) query.subject = subject;
  if (difficulty) query.difficulty = difficulty;
  if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';
  if (search) query.questionText = { $regex: search, $options: 'i' };

  const [total, questions] = await Promise.all([
    Question.countDocuments(query),
    Question.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
  ]);

  res.json({
    success: true,
    questions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  });
});

// POST /api/admin/questions
export const createQuestion = asyncHandler(async (req, res) => {
  const { questionText, options, correctAnswer, explanation, subject, difficulty, isActive } =
    req.body;
  if (!options.includes(correctAnswer)) {
    throw new ApiError(400, 'Correct answer must match one of the options');
  }
  const question = await Question.create({
    questionText,
    options,
    correctAnswer,
    explanation,
    subject,
    difficulty,
    isActive: isActive !== false,
  });
  res.status(201).json({ success: true, message: 'Question created', question });
});

// PUT /api/admin/questions/:id
export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new ApiError(404, 'Question not found');

  const { questionText, options, correctAnswer, explanation, subject, difficulty, isActive } =
    req.body;

  if (options) question.options = options;
  if (questionText !== undefined) question.questionText = questionText;
  if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
  if (explanation !== undefined) question.explanation = explanation;
  if (subject !== undefined) question.subject = subject;
  if (difficulty !== undefined) question.difficulty = difficulty;
  if (isActive !== undefined) question.isActive = isActive;

  if (!question.options.includes(question.correctAnswer)) {
    throw new ApiError(400, 'Correct answer must match one of the options');
  }

  await question.save();
  res.json({ success: true, message: 'Question updated', question });
});

// DELETE /api/admin/questions/:id
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) throw new ApiError(404, 'Question not found');
  res.json({ success: true, message: 'Question deleted' });
});

// GET /api/admin/students
export const listStudents = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'student' }).sort({ createdAt: -1 });
  const attempts = await TestAttempt.find({ status: { $ne: 'in_progress' } })
    .select('userId percentage score createdAt')
    .lean();

  const map = new Map();
  attempts.forEach((a) => {
    const key = a.userId.toString();
    if (!map.has(key)) map.set(key, { attempts: 0, total: 0, best: 0 });
    const s = map.get(key);
    s.attempts += 1;
    s.total += a.percentage;
    s.best = Math.max(s.best, a.percentage);
  });

  res.json({
    success: true,
    students: users.map((u) => {
      const s = map.get(u._id.toString()) || { attempts: 0, total: 0, best: 0 };
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        attempts: s.attempts,
        averageScore: s.attempts ? Math.round((s.total / s.attempts) * 100) / 100 : 0,
        bestScore: s.best,
      };
    }),
  });
});

// GET /api/admin/stats
export const getStats = asyncHandler(async (req, res) => {
  const [totalStudents, totalQuestions, activeQuestions, attempts, subjectAgg] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Question.countDocuments(),
    Question.countDocuments({ isActive: true }),
    TestAttempt.find({ status: { $ne: 'in_progress' } })
      .select('percentage score correctCount incorrectCount unansweredCount subject')
      .populate({ path: 'questions', select: 'subject' })
      .lean(),
    Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const avg = attempts.length
    ? Math.round((attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) * 100) / 100
    : 0;

  res.json({
    success: true,
    stats: {
      totalStudents,
      totalQuestions,
      activeQuestions,
      totalAttempts: attempts.length,
      averagePercentage: avg,
      questionsBySubject: subjectAgg.map((s) => ({ subject: s._id, count: s.count })),
    },
  });
});
