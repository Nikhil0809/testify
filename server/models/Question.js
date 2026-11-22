import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: [(v) => v.length === 4, 'Exactly 4 options are required'],
    },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    subject: {
      type: String,
      required: true,
      trim: true,
      enum: ['Programming', 'JavaScript', 'DBMS', 'Computer Science', 'General Knowledge'],
    },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

questionSchema.pre('validate', function (next) {
  if (this.correctAnswer && this.options && !this.options.includes(this.correctAnswer)) {
    this.invalidate('correctAnswer', 'Correct answer must be one of the options');
  }
  next();
});

export default mongoose.model('Question', questionSchema);
