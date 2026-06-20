import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    feeType: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeType' },
    feeName: { type: String, trim: true },
    amount: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, default: Date.now },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Online', 'Cheque', 'Bank Transfer', 'UPI', 'Other'],
      default: 'Cash'
    },
    transactionId: { type: String, trim: true },
    remarks: { type: String, trim: true, maxlength: 300 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const assignedFeeSchema = new mongoose.Schema(
  {
    feeType: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeType', required: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, maxlength: 300 },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    assignedFees: [assignedFeeSchema],
    totalFee: { type: Number, required: true, min: 0, default: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    dueAmount: { type: Number, required: true, min: 0, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Partial', 'Unpaid'],
      default: 'Unpaid',
      index: true
    },
    payments: [paymentSchema]
  },
  { timestamps: true }
);

feeSchema.pre('validate', function calculateFeeStatus(next) {
  if (this.assignedFees?.length) {
    this.totalFee = this.assignedFees.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }
  this.paidAmount = this.payments?.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || 0;
  this.dueAmount = Math.max(Number(this.totalFee || 0) - this.paidAmount, 0);

  if (this.totalFee <= 0 || this.paidAmount <= 0) {
    this.paymentStatus = 'Unpaid';
  } else if (this.paidAmount >= this.totalFee) {
    this.paymentStatus = 'Paid';
  } else {
    this.paymentStatus = 'Partial';
  }

  next();
});

export const Fee = mongoose.model('Fee', feeSchema);
