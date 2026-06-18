import { StatusCodes } from 'http-status-codes';
import { examRepository } from '../repositories/ExamRepository.js';
import { submissionRepository } from '../repositories/SubmissionRepository.js';
import { AppError } from '../utils/AppError.js';

class StudentExamService {
  async getAvailableExams(studentId) {
    const result = await examRepository.paginate({
      page: 1,
      limit: 100,
      publishedOnly: true
    });
    const exams = result.items || [];
    // Check which exams the student already attempted
    const examIds = exams.map((e) => e._id);
    const submissions = await submissionRepository.model.find({
      exam: { $in: examIds },
      student: studentId
    }).select('exam status score percentage passed submittedAt');
    const submittedMap = {};
    submissions.forEach((s) => {
      submittedMap[s.exam.toString()] = s;
    });
    return exams.map((exam) => {
      const sub = submittedMap[exam._id.toString()];
      return {
        ...exam.toObject(),
        attempted: !!sub,
        submission: sub || null
      };
    });
  }

  async startExam(examId, studentId) {
    const exam = await examRepository.model.findById(examId).populate('questions');
    if (!exam || exam.status !== 'published' || !exam.isActive) {
      throw new AppError('Exam is not available', StatusCodes.NOT_FOUND);
    }
    const now = new Date();
    if (now < exam.startDate || now > exam.endDate) {
      throw new AppError('Exam is not within the scheduled time', StatusCodes.FORBIDDEN);
    }
    let submission = await submissionRepository.findByExamAndStudent(examId, studentId);
    if (!submission) {
      submission = await submissionRepository.create({
        exam: examId,
        student: studentId,
        totalMarks: exam.totalMarks
      });
    } else if (submission.status === 'submitted') {
      throw new AppError('You have already submitted this exam', StatusCodes.FORBIDDEN);
    }
    return submission.populate({ path: 'exam', populate: { path: 'questions' } });
  }

  async submitAnswer(examId, studentId, questionId, selectedOption) {
    const submission = await submissionRepository.findByExamAndStudent(examId, studentId);
    if (!submission || submission.status !== 'in_progress') {
      throw new AppError('Active submission not found', StatusCodes.NOT_FOUND);
    }
    const existingIdx = submission.answers.findIndex(
      (a) => a.question.toString() === questionId
    );
    const answer = { question: questionId, selectedOption, answeredAt: new Date() };
    if (existingIdx >= 0) {
      submission.answers[existingIdx] = answer;
    } else {
      submission.answers.push(answer);
    }
    await submission.save();
    return submission;
  }

  async submitExam(examId, studentId) {
    const submission = await submissionRepository.findByExamAndStudent(examId, studentId);
    if (!submission || submission.status !== 'in_progress') {
      throw new AppError('Active submission not found', StatusCodes.NOT_FOUND);
    }
    const exam = await examRepository.model.findById(examId).populate('questions');
    if (!exam) throw new AppError('Exam not found', StatusCodes.NOT_FOUND);

    let score = 0;
    const resultItems = exam.questions.map((question) => {
      const answer = submission.answers.find(
        (a) => a.question.toString() === question._id.toString()
      );
      const selectedOption = answer ? Number(answer.selectedOption) : null;
      const isCorrect = selectedOption !== null && selectedOption === Number(question.correctOption);
      const awardedMarks = isCorrect ? question.marks : 0;
      if (isCorrect) score += question.marks;
      return {
        question: question._id,
        title: question.title,
        options: question.options,
        selectedOption,
        correctOption: question.correctOption,
        isCorrect,
        marks: question.marks,
        awardedMarks,
        explanation: question.explanation
      };
    });

    const totalMarks = exam.totalMarks;
    const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0;
    const passed = score >= exam.passMarks;

    submission.score = score;
    submission.totalMarks = totalMarks;
    submission.percentage = percentage;
    submission.passed = passed;
    submission.submittedAt = new Date();
    submission.status = 'submitted';
    submission.resultItems = resultItems;
    await submission.save();
    return submission;
  }

  async getMyResults(studentId) {
    const submissions = await submissionRepository.model.find({ student: studentId })
      .populate('exam', 'name subject totalMarks passMarks durationMinutes')
      .sort({ submittedAt: -1 });
    return submissions;
  }

  async getResultById(submissionId, studentId) {
    const submission = await submissionRepository.model.findOne({
      _id: submissionId,
      student: studentId
    }).populate({ path: 'exam', populate: { path: 'questions' } });
    if (!submission) {
      throw new AppError('Result not found', StatusCodes.NOT_FOUND);
    }
    return submission;
  }

  async getStudentSubmissions(studentId) {
    const submissions = await submissionRepository.model.find({ student: studentId })
      .populate('exam', 'name subject totalMarks passMarks durationMinutes')
      .sort({ submittedAt: -1 });
    return submissions;
  }

  async getMyDashboard(studentId) {
    const submissions = await submissionRepository.model.find({ student: studentId });
    const totalExams = submissions.length;
    const completedExams = submissions.filter((s) => s.status === 'submitted').length;
    const pendingExams = submissions.filter((s) => s.status === 'in_progress').length;
    const totalMarksObtained = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
    const recentResults = await submissionRepository.model.find({ student: studentId })
      .populate('exam', 'name subject totalMarks')
      .sort({ submittedAt: -1 })
      .limit(5);
    return { totalExams, completedExams, pendingExams, totalMarksObtained, recentResults };
  }
}

export const studentExamService = new StudentExamService();