import { ExamSubmission } from '../models/ExamSubmission.js';
import { BaseRepository } from './BaseRepository.js';

class SubmissionRepository extends BaseRepository {
  constructor() {
    super(ExamSubmission);
  }

  findByExamAndStudent(exam, student) {
    return this.model.findOne({ exam, student }).populate({ path: 'exam', populate: { path: 'questions' } });
  }

  list(filter = {}) {
    return this.model.find(filter).populate('student', 'name email studentId course status').populate('exam', 'title totalMarks passingMarks scheduledAt');
  }
}

export const submissionRepository = new SubmissionRepository();
