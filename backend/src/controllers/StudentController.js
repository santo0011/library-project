import { StatusCodes } from 'http-status-codes';
import { studentService } from '../services/StudentService.js';
import { studentExamService } from '../services/StudentExamService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

class StudentController {
  create = asyncHandler(async (req, res) => {
    const data = await studentService.create(req.body);
    res.status(StatusCodes.CREATED).json({ success: true, data });
  });

  bulkCreate = asyncHandler(async (req, res) => {
    const { students } = req.body;
    const result = await studentService.bulkCreate(students);
    res.status(StatusCodes.CREATED).json({ success: true, data: result });
  });

  list = asyncHandler(async (req, res) => {
    const data = await studentService.list(req.query);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  getById = asyncHandler(async (req, res) => {
    const data = await studentService.getById(req.params.id);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  update = asyncHandler(async (req, res) => {
    const data = await studentService.update(req.params.id, req.body);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  resetPassword = asyncHandler(async (req, res) => {
    const data = await studentService.resetPassword(req.params.id, req.body.newPassword);
    res.status(StatusCodes.OK).json({ success: true, data, message: 'Password reset successfully' });
  });

  toggleStatus = asyncHandler(async (req, res) => {
    const data = await studentService.toggleStatus(req.params.id);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  stats = asyncHandler(async (req, res) => {
    const data = await studentService.getDashboardStats();
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  getAvailableExams = asyncHandler(async (req, res) => {
    const data = await studentExamService.getAvailableExams(req.user._id);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  startExam = asyncHandler(async (req, res) => {
    const data = await studentExamService.startExam(req.params.examId, req.user._id);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  submitAnswer = asyncHandler(async (req, res) => {
    const { questionId, selectedOption } = req.body;
    const data = await studentExamService.submitAnswer(req.params.examId, req.user._id, questionId, selectedOption);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  submitExam = asyncHandler(async (req, res) => {
    const data = await studentExamService.submitExam(req.params.examId, req.user._id);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  myResults = asyncHandler(async (req, res) => {
    const data = await studentExamService.getMyResults(req.user._id);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  getResultDetail = asyncHandler(async (req, res) => {
    const data = await studentExamService.getResultById(req.params.resultId, req.user._id);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  getStudentSubmissions = asyncHandler(async (req, res) => {
    const data = await studentExamService.getStudentSubmissions(req.params.studentId);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  myDashboard = asyncHandler(async (req, res) => {
    const data = await studentExamService.getMyDashboard(req.user._id);
    res.status(StatusCodes.OK).json({ success: true, data });
  });
}

export const studentController = new StudentController();