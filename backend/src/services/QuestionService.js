import { StatusCodes } from 'http-status-codes';
import { questionRepository } from '../repositories/QuestionRepository.js';
import { AppError } from '../utils/AppError.js';

class QuestionService {
  list(query) {
    return questionRepository.paginate({
      page: Number(query.page || 1),
      limit: Math.min(Number(query.limit || 10), 100),
      search: query.search,
      subject: query.subject,
      type: query.type
    });
  }

  async create(payload, user) {
    return questionRepository.create({ ...payload, createdBy: user._id });
  }

  async update(id, payload) {
    const question = await questionRepository.updateById(id, payload);
    if (!question) throw new AppError('Question not found', StatusCodes.NOT_FOUND);
    return question;
  }

  async remove(id) {
    const question = await questionRepository.deleteById(id);
    if (!question) throw new AppError('Question not found', StatusCodes.NOT_FOUND);
  }
}

export const questionService = new QuestionService();