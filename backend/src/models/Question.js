import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 300 }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    title: { type: String, required: true, trim: true, maxlength: 1000 },
    type: { type: String, enum: ['mcq'], default: 'mcq' },
    options: {
      type: [optionSchema],
      validate: [(value) => value.length === 4, 'Exactly four options are required']
    },
    correctOption: { type: Number, required: true, min: 0, max: 3 },
    marks: { type: Number, required: true, min: 1 },
    subject: { type: String, required: true, trim: true },
    explanation: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

questionSchema.methods.toExamJSON = function toExamJSON() {
  const question = this.toObject();
  delete question.correctOption;
  delete question.explanation;
  return question;
};

export const Question = mongoose.model('Question', questionSchema);
