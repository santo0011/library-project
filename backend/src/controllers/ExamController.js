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

  bulkDeleteQuestions = asyncHandler(async (req, res) => {
    const examId = req.params.id;
    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      throw new AppError('No question IDs provided', StatusCodes.BAD_REQUEST);
    }

    const exam = await examRepository.model.findById(examId);
    if (!exam) throw new AppError('Exam not found', StatusCodes.NOT_FOUND);

    const submissionCount = await submissionRepository.model.countDocuments({ exam: examId });
    if (submissionCount > 0) {
      throw new AppError('This exam has already been attempted by students. Questions can no longer be deleted.', StatusCodes.FORBIDDEN);
    }

    // Check each question is part of this exam and not locked by other exams
    for (const qId of questionIds) {
      await this.checkQuestionLocked(qId);
    }

    // Delete questions
    await questionRepository.model.deleteMany({ _id: { $in: questionIds } });

    // Remove question IDs from exam (questions are ObjectIds when not populated)
    const remainingQuestionIds = (exam.questions || [])
      .map((q) => (q._id ? q._id.toString() : q.toString()))
      .filter((qId) => !questionIds.includes(qId));
    await examRepository.updateById(examId, { questions: remainingQuestionIds });

    res.status(StatusCodes.OK).json({
      success: true,
      message: `${questionIds.length} question(s) deleted successfully`,
      data: { deleted: questionIds.length }
    });
  });

  bulkImportQuestions = asyncHandler(async (req, res) => {
    const examId = req.params.id;
    const { questions } = req.body;

    const exam = await examRepository.model.findById(examId);
    if (!exam) throw new AppError('Exam not found', StatusCodes.NOT_FOUND);

    const submissionCount = await submissionRepository.model.countDocuments({ exam: examId });
    if (submissionCount > 0) {
      throw new AppError('This exam has already been attempted by students. Questions can no longer be added.', StatusCodes.FORBIDDEN);
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new AppError('No questions provided', StatusCodes.BAD_REQUEST);
    }

    const errors = [];
    questions.forEach((q, idx) => {
      const rowNum = idx + 1;
      if (!q.title || q.title.trim().length < 2) errors.push(`Row ${rowNum}: Question text is required (min 2 chars)`);
      if (!q.marks || Number(q.marks) < 1) errors.push(`Row ${rowNum}: Marks must be at least 1`);
      if (q.correctOption === undefined || q.correctOption === null || isNaN(Number(q.correctOption)) || Number(q.correctOption) < 0 || Number(q.correctOption) > 3) {
        errors.push(`Row ${rowNum}: Correct answer must be 0, 1, 2, or 3`);
      }
      if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(`Row ${rowNum}: Exactly 4 options are required`);
      } else {
        const emptyOpts = q.options.some((o) => !o.text || !o.text.trim());
        if (emptyOpts) errors.push(`Row ${rowNum}: All options must have text`);
      }
    });

    if (errors.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, errors });
    }

    const createdQuestions = [];
    for (const q of questions) {
      const question = await questionRepository.create({
        exam: examId,
        title: q.title.trim(),
        type: 'mcq',
        options: q.options.map((o) => ({ text: o.text.trim() })),
        correctOption: Number(q.correctOption),
        marks: Number(q.marks),
        subject: q.subject || exam.subject || 'A',
        explanation: q.explanation || '',
        createdBy: req.user._id
      });
      createdQuestions.push(question);
    }

    const allQuestionIds = [...(exam.questions || []).map((q) => q._id?.toString()), ...createdQuestions.map((q) => q._id)];
    await examRepository.updateById(examId, { questions: allQuestionIds });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: { total: createdQuestions.length, questions: createdQuestions }
    });
  });
}

export const examController = new ExamController();