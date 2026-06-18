import { StatusCodes } from 'http-status-codes';
import { examService } from '../services/ExamService.js';
import { questionRepository } from '../repositories/QuestionRepository.js';
import { submissionRepository } from '../repositories/SubmissionRepository.js';
import { examRepository } from '../repositories/ExamRepository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const LOCKED_MESSAGE = 'Changes are not allowed because students have already participated in this exam.';

class ExamController {
  async checkQuestionLocked(questionId) {
    const examsUsingQuestion = await examRepository.model.find({ questions: questionId });
    for (const exam of examsUsingQuestion) {
      const count = await submissionRepository.model.countDocuments({ exam: exam._id });
      if (count > 0) {
        throw new AppError(LOCKED_MESSAGE, StatusCodes.FORBIDDEN);
      }
    }
  }

  list = asyncHandler(async (req, res) => {
    const result = await examService.list(req.query);
    res.status(StatusCodes.OK).json({ success: true, data: result });
  });

  create = asyncHandler(async (req, res) => {
    const exam = await examService.create(req.body, req.user);
    res.status(StatusCodes.CREATED).json({ success: true, data: exam });
  });

  getById = asyncHandler(async (req, res) => {
    const exam = await examService.getById(req.params.id);
    res.status(StatusCodes.OK).json({ success: true, data: exam });
  });

  update = asyncHandler(async (req, res) => {
    const exam = await examService.update(req.params.id, req.body);
    res.status(StatusCodes.OK).json({ success: true, data: exam });
  });

  remove = asyncHandler(async (req, res) => {
    await examService.remove(req.params.id);
    res.status(StatusCodes.OK).json({ success: true, message: 'Exam deleted' });
  });

  addQuestions = asyncHandler(async (req, res) => {
    const exam = await examService.addQuestions(req.params.id, req.body.questionIds);
    res.status(StatusCodes.OK).json({ success: true, data: exam });
  });

  getQuestions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, search = '', subject } = req.query;
    const result = await questionRepository.paginate({ page: Number(page), limit: Number(limit), search, subject });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  });

  createQuestion = asyncHandler(async (req, res) => {
    const question = await questionRepository.create({ ...req.body, createdBy: req.user._id });
    res.status(StatusCodes.CREATED).json({ success: true, data: question });
  });

  updateQuestion = asyncHandler(async (req, res) => {
    await this.checkQuestionLocked(req.params.questionId);
    const question = await questionRepository.updateById(req.params.questionId, req.body);
    if (!question) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Question not found' });
    res.status(StatusCodes.OK).json({ success: true, data: question });
  });

  deleteQuestion = asyncHandler(async (req, res) => {
    await this.checkQuestionLocked(req.params.questionId);
    const question = await questionRepository.deleteById(req.params.questionId);
    if (!question) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Question not found' });
    res.status(StatusCodes.OK).json({ success: true, message: 'Question deleted' });
  });
}

export const examController = new ExamController();