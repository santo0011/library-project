import mongoose from 'mongoose';

const feeTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, minlength: 2, maxlength: 100 },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, maxlength: 300 },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const FeeType = mongoose.model('FeeType', feeTypeSchema);
