import { Exam } from '../models/Exam.js';
import { BaseRepository } from './BaseRepository.js';

class ExamRepository extends BaseRepository {
  constructor() {
    super(Exam);
  }

  async paginate({ page = 1, limit = 10, search = '', status, isActive, publishedOnly = false, availableOnly = false }) {
    const filter = {};
    if (status) filter.status = status;
    if (typeof isActive === 'boolean') filter.isActive = isActive;
    if (publishedOnly) filter.status = 'published';
    if (availableOnly) {
      const now = new Date();
      filter.status = 'published';
      filter.isActive = true;
      filter.startDate = { $lte: now };
      filter.endDate = { $gte: now };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find(filter).populate('questions').sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.model.countDocuments(filter)
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  }
}

export const examRepository = new ExamRepository();
