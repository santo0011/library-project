import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOption: { type: Number, min: 0, max: 3 },
    answeredAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const resultItemSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    title: { type: String, required: true },
    options: [{ text: String }],
    selectedOption: { type: Number, min: 0, max: 3 },
    correctOption: { type: Number, required: true, min: 0, max: 3 },
    isCorrect: { type: Boolean, required: true },
    marks: { type: Number, required: true },
    awardedMarks: { type: Number, required: true },
    explanation: { type: String }
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    answers: [answerSchema],
    currentQuestionIndex: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    resultItems: [resultItemSchema]
  },
  { timestamps: true }
);

submissionSchema.index({ exam: 1, student: 1 }, { unique: true });

export const ExamSubmission = mongoose.model('ExamSubmission', submissionSchema);
