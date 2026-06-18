import { User } from '../models/User.js';
import { BaseRepository } from './BaseRepository.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findByEmailWithPassword(email) {
    return this.model.findOne({ email: email.toLowerCase() }).select('+password +refreshTokenHash');
  }

  findByStudentIdOrEmail(identifier) {
    return this.model.findOne({
      $or: [
        { studentId: identifier.toUpperCase() },
        { email: identifier.toLowerCase() }
      ]
    }).select('+password +refreshTokenHash');
  }

  getLastStudentId() {
    return this.model.findOne({ role: 'Student', studentId: { $exists: true } })
      .sort({ studentId: -1 })
      .select('studentId');
  }

  async paginate({ page = 1, limit = 10, search = '', role, status }) {
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.model.countDocuments(filter)
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  }
}

export const userRepository = new UserRepository();