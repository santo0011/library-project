import { StatusCodes } from 'http-status-codes';
import { submissionRepository } from '../repositories/SubmissionRepository.js';
import { AppError } from '../utils/AppError.js';

class ResultService {
  async list(query) {
    const filter = {};
    if (query.exam) filter.exam = query.exam;
    const submissions = await submissionRepository.list(filter);
    const ranked = submissions
      .sort((a, b) => b.percentage - a.percentage)
      .map((item, index) => ({ ...item.toObject(), rank: index + 1 }));
    return ranked;
  }

  async review(id, payload) {
    const result = await submissionRepository.updateById(id, {
      score: payload.score,
      percentage: payload.totalMarks ? Number(((payload.score / payload.totalMarks) * 100).toFixed(2)) : payload.percentage,
      passed: payload.passed,
      status: 'reviewed',
      reviewNotes: payload.reviewNotes
    });
    if (!result) throw new AppError('Result not found', StatusCodes.NOT_FOUND);
    return result;
  }
}

export const resultService = new ResultService();
  }
}

export const resultService = new ResultService();
