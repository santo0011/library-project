import { StatusCodes } from 'http-status-codes';
import { examRepository } from '../repositories/ExamRepository.js';
import { questionRepository } from '../repositories/QuestionRepository.js';
import { submissionRepository } from '../repositories/SubmissionRepository.js';
import { AppError } from '../utils/AppError.js';

const LOCKED_MESSAGE = 'Changes are not allowed because students have already participated in this exam.';

class ExamService {
  async checkExamLocked(examId) {
    const count = await submissionRepository.model.countDocuments({ exam: examId });
    if (count > 0) {
      throw new AppError(LOCKED_MESSAGE, StatusCodes.FORBIDDEN);
    }
  }

  list(query) {
    return examRepository.paginate({
      page: Number(query.page || 1),
      limit: Math.min(Number(query.limit || 10), 100),
      search: query.search,
      status: query.status
    });
  }

  async getById(id) {
    const exam = await examRepository.model.findById(id).populate('questions');
    if (!exam) throw new AppError('Exam not found', StatusCodes.NOT_FOUND);
    return exam;
  }

  async create(payload, user) {
    if (payload.status === 'published') {
      throw new AppError('Cannot Publish Exam: This exam does not contain any questions. Please add at least one question before publishing the exam.', StatusCodes.BAD_REQUEST);
    }
    return examRepository.create({ ...payload, createdBy: user._id });
  }

  async update(id, payload) {
    await this.checkExamLocked(id);
    if (payload.status === 'published') {
      const exam = await examRepository.model.findById(id);
      if (!exam) throw new AppError('Exam not found', StatusCodes.NOT_FOUND);
      if (!exam.questions || exam.questions.length === 0) {
        throw new AppError('Cannot Publish Exam: This exam does not contain any questions. Please add at least one question before publishing the exam.', StatusCodes.BAD_REQUEST);
      }
    }
    const exam = await examRepository.updateById(id, payload);
    if (!exam) throw new AppError('Exam not found', StatusCodes.NOT_FOUND);
    return exam;
  }

  async remove(id) {
    await this.checkExamLocked(id);
    const exam = await examRepository.deleteById(id);
    if (!exam) throw new AppError('Exam not found', StatusCodes.NOT_FOUND);
  }

  async addQuestions(examId, questionIds) {
    await this.checkExamLocked(examId);
    const questions = await questionRepository.find({ _id: { $in: questionIds } });
    if (questions.length !== questionIds.length) {
      throw new AppError('One or more questions were not found', StatusCodes.BAD_REQUEST);
    }
    const exam = await examRepository.updateById(examId, { questions: questionIds });
    if (!exam) throw new AppError('Exam not found', StatusCodes.NOT_FOUND);
    return exam.populate('questions');
  }
}

export const examService = new ExamService();