import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { Roles, defaultRolePermissions } from '../config/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(Roles), default: Roles.STUDENT },
    permissions: [{ type: String }],
    studentId: { type: String, unique: true, sparse: true, trim: true },
    mobile: { type: String, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    dateOfBirth: Date,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLoginAt: Date,
    refreshTokenHash: { type: String, select: false }
  },
  { timestamps: true }
);

userSchema.pre('validate', function assignRolePermissions(next) {
  if (!this.permissions?.length) {
    this.permissions = defaultRolePermissions[this.role] || [];
  }
  next();
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokenHash;
  return user;
};

export const User = mongoose.model('User', userSchema);