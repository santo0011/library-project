import { Question } from '../models/Question.js';
import { BaseRepository } from './BaseRepository.js';

class QuestionRepository extends BaseRepository {
  constructor() {
    super(Question);
  }

  paginate({ page = 1, limit = 10, search = '', subject, type }) {
    const filter = {};
    if (subject) filter.subject = subject;
    if (type) filter.type = type;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const skip = (page - 1) * limit;
    return Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.model.countDocuments(filter)
    ]).then(([items, total]) => ({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 }));
  }
}

export const questionRepository = new QuestionRepository();
