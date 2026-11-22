import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOption: { type: String, default: null },
    status: { type: String, enum: ['answered', 'unanswered', 'review'], default: 'unanswered' },
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    answers: [answerSchema],
    startTime: { type: Date, required: true },
    expiryTime: { type: Date, required: true },
    submissionTime: { type: Date, default: null },
    score: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    status: { type: String, enum: ['in_progress', 'submitted', 'expired'], default: 'in_progress' },
  },
  { timestamps: true }
);

testAttemptSchema.index({ userId: 1, createdAt: -1 });

// A student can only have ONE test in progress at a time (prevents duplicate
// attempts when start requests race, e.g. on page refresh).
testAttemptSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { status: 'in_progress' } }
);

export default mongoose.model('TestAttempt', testAttemptSchema);
