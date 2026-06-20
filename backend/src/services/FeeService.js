import { StatusCodes } from 'http-status-codes';
import { Roles } from '../config/roles.js';
import { feeRepository } from '../repositories/FeeRepository.js';
import { feeTypeRepository } from '../repositories/FeeTypeRepository.js';
import { userRepository } from '../repositories/UserRepository.js';
import { AppError } from '../utils/AppError.js';

class FeeService {
  recalculateFeeSummary(fee) {
    fee.totalFee = fee.assignedFees.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    fee.paidAmount = fee.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    fee.dueAmount = Math.max(fee.totalFee - fee.paidAmount, 0);

    if (fee.totalFee <= 0 || fee.paidAmount <= 0) {
      fee.paymentStatus = 'Unpaid';
    } else if (fee.paidAmount >= fee.totalFee) {
      fee.paymentStatus = 'Paid';
    } else {
      fee.paymentStatus = 'Partial';
    }
  }

  async list(query) {
    return feeRepository.paginate({
      page: query.page,
      limit: query.limit || 10,
      search: query.search || ''
    });
  }

  async getStudentFee(studentId) {
    const student = await userRepository.findById(studentId);
    if (!student || student.role !== Roles.STUDENT) {
      throw new AppError('Student not found', StatusCodes.NOT_FOUND);
    }

    const fee = await feeRepository.findByStudent(studentId);
    return fee || {
      student,
      totalFee: 0,
      paidAmount: 0,
      dueAmount: 0,
      paymentStatus: 'Unpaid',
      assignedFees: [],
      payments: []
    };
  }

  async getMyFee(userId) {
    return this.getStudentFee(userId);
  }

  async setTotalFee(studentId, totalFee) {
    const student = await userRepository.findById(studentId);
    if (!student || student.role !== Roles.STUDENT) {
      throw new AppError('Student not found', StatusCodes.NOT_FOUND);
    }

    const feeAmount = Number(totalFee);
    if (!Number.isFinite(feeAmount) || feeAmount < 0) {
      throw new AppError('Total fee must be zero or greater', StatusCodes.BAD_REQUEST);
    }

    let fee = await feeRepository.model.findOne({ student: studentId });
    if (!fee) {
      fee = await feeRepository.create({ student: studentId, totalFee: feeAmount, payments: [] });
      return fee.populate('student', 'name email studentId mobile status');
    }

    if (fee.paidAmount > feeAmount) {
      throw new AppError('Total fee cannot be less than paid amount', StatusCodes.BAD_REQUEST);
    }

    fee.totalFee = feeAmount;
    await fee.save();
    return fee.populate('student', 'name email studentId mobile status');
  }

  async listFeeTypes(query = {}) {
    return feeTypeRepository.list({
      activeOnly: query.activeOnly === 'true',
      statusFilter: query.statusFilter || '',
      page: query.page,
      limit: query.limit,
      search: query.search || ''
    });
  }

  async createFeeType(payload) {
    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new AppError('Amount must be zero or greater', StatusCodes.BAD_REQUEST);
    }

    const existing = await feeTypeRepository.findOne({ name: payload.name.trim() });
    if (existing) throw new AppError('Fee type already exists', StatusCodes.CONFLICT);

    return feeTypeRepository.create({
      name: payload.name.trim(),
      amount,
      description: payload.description,
      isActive: payload.isActive ?? true
    });
  }

  async toggleFeeTypeStatus(id, isActive) {
    const feeType = await feeTypeRepository.findById(id);
    if (!feeType) throw new AppError('Fee type not found', StatusCodes.NOT_FOUND);

    feeType.isActive = isActive;
    await feeType.save();
    return feeType;
  }

  async bulkToggleFeeTypeStatus(ids, isActive) {
    const result = await feeTypeRepository.model.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive } }
    );
    return { modifiedCount: result.modifiedCount };
  }

  async deleteFeeType(id) {
    const feeType = await feeTypeRepository.findById(id);
    if (!feeType) throw new AppError('Fee type not found', StatusCodes.NOT_FOUND);

    const assignmentCount = await feeRepository.model.countDocuments({ 'assignedFees.feeType': feeType._id });
    if (assignmentCount > 0) {
      throw new AppError('This Fee Type has already been assigned to students and cannot be deleted.', StatusCodes.BAD_REQUEST);
    }

    await feeType.deleteOne();
    return { id };
  }

  async updateFeeType(id, payload) {
    const feeType = await feeTypeRepository.findById(id);
    if (!feeType) throw new AppError('Fee type not found', StatusCodes.NOT_FOUND);

    const assignmentCount = await feeRepository.model.countDocuments({ 'assignedFees.feeType': feeType._id });
    if (assignmentCount > 0) {
      throw new AppError('This Fee Type has already been assigned and can no longer be edited.', StatusCodes.BAD_REQUEST);
    }

    if (payload.name && payload.name.trim() !== feeType.name) {
      const existing = await feeTypeRepository.findOne({ name: payload.name.trim() });
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Fee type already exists', StatusCodes.CONFLICT);
      }
      feeType.name = payload.name.trim();
    }
    if (payload.amount !== undefined) {
      const amount = Number(payload.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new AppError('Amount must be zero or greater', StatusCodes.BAD_REQUEST);
      }
      feeType.amount = amount;
    }
    if (payload.description !== undefined) feeType.description = payload.description;
    if (payload.isActive !== undefined) feeType.isActive = payload.isActive;

    await feeType.save();
    return feeType;
  }

  async bulkAssign(payload, adminId) {
    const feeType = await feeTypeRepository.findById(payload.feeTypeId);
    if (!feeType || !feeType.isActive) {
      throw new AppError('Active fee type not found', StatusCodes.NOT_FOUND);
    }

    const studentIds = [...new Set((payload.studentIds || []).map(String))];
    if (!studentIds.length) {
      throw new AppError('Select at least one student', StatusCodes.BAD_REQUEST);
    }

    const students = await userRepository.model.find({ _id: { $in: studentIds }, role: Roles.STUDENT }).select('_id');
    if (students.length !== studentIds.length) {
      throw new AppError('One or more students were not found', StatusCodes.BAD_REQUEST);
    }

    let assigned = 0;
    let skipped = 0;

    for (const student of students) {
      let fee = await feeRepository.model.findOne({ student: student._id });
      if (!fee) {
        fee = new feeRepository.model({ student: student._id, assignedFees: [], payments: [] });
      }

      const alreadyAssigned = fee.assignedFees.some((item) => item.feeType.toString() === feeType._id.toString());
      if (alreadyAssigned) {
        skipped += 1;
        continue;
      }

      fee.assignedFees.push({
        feeType: feeType._id,
        name: feeType.name,
        amount: feeType.amount,
        description: feeType.description,
        assignedBy: adminId
      });
      await fee.save();
      assigned += 1;
    }

    return { assigned, skipped, totalSelected: studentIds.length };
  }

  async bulkRemove(payload) {
    const feeType = await feeTypeRepository.findById(payload.feeTypeId);
    if (!feeType) throw new AppError('Fee type not found', StatusCodes.NOT_FOUND);

    const studentIds = [...new Set((payload.studentIds || []).map(String))];
    if (!studentIds.length) {
      throw new AppError('Select at least one student', StatusCodes.BAD_REQUEST);
    }

    let removed = 0;
    let skipped = 0;
    let blocked = 0;

    for (const studentId of studentIds) {
      const fee = await feeRepository.model.findOne({ student: studentId });
      if (!fee) {
        skipped += 1;
        continue;
      }

      const assignedBefore = fee.assignedFees.length;
      const isAssigned = fee.assignedFees.some((item) => item.feeType.toString() === feeType._id.toString());
      if (!isAssigned) {
        skipped += 1;
        continue;
      }

      const hasPayment = fee.payments.some((payment) => {
        if (payment.feeType) return payment.feeType.toString() === feeType._id.toString();
        return Number(payment.amount || 0) > 0;
      });
      if (hasPayment) {
        blocked += 1;
        continue;
      }

      fee.assignedFees = fee.assignedFees.filter((item) => item.feeType.toString() !== feeType._id.toString());
      if (fee.assignedFees.length !== assignedBefore) {
        this.recalculateFeeSummary(fee);
        await fee.save();
        removed += 1;
      }
    }

    return { removed, skipped, blocked, totalSelected: studentIds.length };
  }

  async recordPayment(studentId, payload, adminId) {
    const student = await userRepository.findById(studentId);
    if (!student || student.role !== Roles.STUDENT) {
      throw new AppError('Student not found', StatusCodes.NOT_FOUND);
    }

    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError('Payment amount must be greater than zero', StatusCodes.BAD_REQUEST);
    }

    let fee = await feeRepository.model.findOne({ student: studentId });
    if (!fee) {
      fee = await feeRepository.create({
        student: studentId,
        totalFee: Number(payload.totalFee || 0),
        payments: []
      });
    }

    if (payload.totalFee !== undefined) {
      const totalFee = Number(payload.totalFee);
      if (!Number.isFinite(totalFee) || totalFee < 0) {
        throw new AppError('Total fee must be zero or greater', StatusCodes.BAD_REQUEST);
      }
      if (fee.paidAmount > totalFee) {
        throw new AppError('Total fee cannot be less than paid amount', StatusCodes.BAD_REQUEST);
      }
      fee.totalFee = totalFee;
    }

    let selectedAssignedFee = null;
    if (payload.feeType) {
      selectedAssignedFee = fee.assignedFees.find((item) => item.feeType.toString() === payload.feeType);
      if (!selectedAssignedFee) {
        throw new AppError('Selected fee type is not assigned to this student', StatusCodes.BAD_REQUEST);
      }
      const paidForFeeType = fee.payments
        .filter((payment) => payment.feeType?.toString() === payload.feeType)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      if (paidForFeeType + amount > selectedAssignedFee.amount) {
        throw new AppError('Paid amount cannot exceed selected fee amount', StatusCodes.BAD_REQUEST);
      }
    }

    if (fee.totalFee <= 0) {
      throw new AppError('Set total fee before recording payment', StatusCodes.BAD_REQUEST);
    }

    if (fee.paidAmount + amount > fee.totalFee) {
      throw new AppError('Paid amount cannot exceed total fee', StatusCodes.BAD_REQUEST);
    }

    fee.payments.push({
      feeType: selectedAssignedFee?.feeType,
      feeName: selectedAssignedFee?.name,
      amount,
      paymentDate: payload.paymentDate || new Date(),
      paymentMode: payload.paymentMode || 'Cash',
      transactionId: payload.transactionId,
      remarks: payload.remarks,
      recordedBy: adminId
    });

    await fee.save();
    return fee.populate('student', 'name email studentId mobile status');
  }
}

export const feeService = new FeeService();
