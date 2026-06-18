import { StatusCodes } from 'http-status-codes';
import { Roles, defaultRolePermissions } from '../config/roles.js';
import { userRepository } from '../repositories/UserRepository.js';
import { AppError } from '../utils/AppError.js';

class StudentService {
  async generateStudentId() {
    const last = await userRepository.getLastStudentId();
    let nextNum = 1;
    if (last && last.studentId) {
      const num = parseInt(last.studentId.replace('STD-', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    return `STD-${String(nextNum).padStart(4, '0')}`;
  }

  async create(payload) {
    const existing = await userRepository.findOne({ email: payload.email.toLowerCase() });
    if (existing) throw new AppError('Email is already registered', StatusCodes.CONFLICT);

    const studentId = await this.generateStudentId();
    const student = await userRepository.create({
      ...payload,
      studentId,
      role: Roles.STUDENT,
      permissions: defaultRolePermissions[Roles.STUDENT],
      status: 'active'
    });
    return student;
  }

  async list(query) {
    const filter = { role: Roles.STUDENT };
    if (query.status) filter.status = query.status;
    if (query.gender) filter.gender = query.gender;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { studentId: { $regex: query.search, $options: 'i' } },
        { mobile: { $regex: query.search, $options: 'i' } }
      ];
    }
    const page = Number(query.page || 1);
    const limit = Math.min(Number(query.limit || 20), 100);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      userRepository.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      userRepository.model.countDocuments(filter)
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  }

  async getById(id) {
    const student = await userRepository.findById(id);
    if (!student || student.role !== Roles.STUDENT) {
      throw new AppError('Student not found', StatusCodes.NOT_FOUND);
    }
    return student;
  }

  async update(id, payload) {
    const student = await userRepository.findById(id);
    if (!student || student.role !== Roles.STUDENT) {
      throw new AppError('Student not found', StatusCodes.NOT_FOUND);
    }
    if (payload.email) {
      const existing = await userRepository.findOne({ email: payload.email.toLowerCase() });
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Email is already registered', StatusCodes.CONFLICT);
      }
    }
    const updateData = { ...payload };
    if (updateData.password) {
      // Password will be hashed by the User model pre-save hook
      const userDoc = await userRepository.findById(id).select('+password');
      userDoc.password = updateData.password;
      if (updateData.name) userDoc.name = updateData.name;
      if (updateData.mobile) userDoc.mobile = updateData.mobile;
      if (updateData.gender) userDoc.gender = updateData.gender;
      if (updateData.dateOfBirth) userDoc.dateOfBirth = updateData.dateOfBirth;
      if (updateData.email) {
        userDoc.email = updateData.email;
        delete updateData.email;
      }
      delete updateData.password;
      await userDoc.save();
      return userDoc;
    }
    const updated = await userRepository.updateById(id, updateData);
    return updated;
  }

  async resetPassword(id, newPassword) {
    const student = await userRepository.findById(id).select('+password');
    if (!student || student.role !== Roles.STUDENT) {
      throw new AppError('Student not found', StatusCodes.NOT_FOUND);
    }
    student.password = newPassword;
    student.refreshTokenHash = undefined;
    await student.save();
    return student;
  }

  async toggleStatus(id) {
    const student = await userRepository.findById(id);
    if (!student || student.role !== Roles.STUDENT) {
      throw new AppError('Student not found', StatusCodes.NOT_FOUND);
    }
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    return userRepository.updateById(id, { status: newStatus });
  }

  async getDashboardStats() {
    const [totalStudents, maleCount, femaleCount] = await Promise.all([
      userRepository.model.countDocuments({ role: Roles.STUDENT }),
      userRepository.model.countDocuments({ role: Roles.STUDENT, gender: 'Male' }),
      userRepository.model.countDocuments({ role: Roles.STUDENT, gender: 'Female' })
    ]);
    const malePct = totalStudents ? Number(((maleCount / totalStudents) * 100).toFixed(1)) : 0;
    const femalePct = totalStudents ? Number(((femaleCount / totalStudents) * 100).toFixed(1)) : 0;
    return { totalStudents, maleCount, femaleCount, malePct, femalePct };
  }
}

export const studentService = new StudentService();