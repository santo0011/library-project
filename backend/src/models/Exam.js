import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    subject: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 1000 },
    totalMarks: { type: Number, required: true, min: 1 },
    passMarks: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 1 },
    questionTimerSeconds: { type: Number, required: true, min: 5 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    isActive: { type: Boolean, default: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

examSchema.virtual('title').get(function title() {
  return this.name;
});

examSchema.virtual('passingMarks').get(function passingMarks() {
  return this.passMarks;
});

examSchema.set('toJSON', { virtuals: true });
examSchema.set('toObject', { virtuals: true });

export const Exam = mongoose.model('Exam', examSchema);
