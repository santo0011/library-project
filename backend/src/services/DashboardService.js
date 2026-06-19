import { User } from '../models/User.js';
import { Exam } from '../models/Exam.js';
import { ExamSubmission } from '../models/ExamSubmission.js';
import { Roles } from '../config/roles.js';

class DashboardService {
  async summary(user) {
    if (user.role === Roles.STUDENT) return this.studentSummary(user);

    const [totalStudents, maleCount, femaleCount, totalExams, publishedExams, activeExams, examsByStatus, passFail, studentGrowth, examParticipation] = await Promise.all([
      User.countDocuments({ role: Roles.STUDENT }),
      User.countDocuments({ role: Roles.STUDENT, gender: 'Male' }),
      User.countDocuments({ role: Roles.STUDENT, gender: 'Female' }),
      Exam.countDocuments(),
      Exam.countDocuments({ status: 'published' }),
      Exam.countDocuments({ isActive: true, status: 'published', startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }),
      Exam.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      ExamSubmission.aggregate([
        { $match: { status: 'submitted' } },
        { $group: { _id: '$passed', count: { $sum: 1 } } }
      ]),
      // Student growth by month (last 6 months)
      User.aggregate([
        { $match: { role: Roles.STUDENT } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } },
        { $limit: 6 }
      ]),
      // Exam participation
      ExamSubmission.aggregate([
        { $match: { status: 'submitted' } },
        { $group: { _id: '$exam', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'exams', localField: '_id', foreignField: '_id', as: 'exam' } },
        { $unwind: { path: '$exam', preserveNullAndEmptyArrays: true } },
        { $project: { examName: { $ifNull: ['$exam.name', 'Unknown'] }, count: 1 } }
      ])
    ]);

    const totalPct = totalStudents > 0 ? {
      malePct: Number(((maleCount / totalStudents) * 100).toFixed(1)),
      femalePct: Number(((femaleCount / totalStudents) * 100).toFixed(1))
    } : { malePct: 0, femalePct: 0 };

    // Recent students
    const recentStudents = await User.find({ role: Roles.STUDENT })
      .select('name email gender status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent exam attempts
    const recentAttempts = await ExamSubmission.find()
      .populate('student', 'name email')
      .populate('exam', 'name subject totalMarks')
      .sort({ submittedAt: -1 })
      .limit(5);

    return {
      cards: {
        totalStudents,
        maleCount,
        femaleCount,
        malePct: totalPct.malePct,
        femalePct: totalPct.femalePct,
        totalExams,
        completedExams: publishedExams,
        pendingExams: activeExams
      },
      examsByStatus: examsByStatus.map((item) => ({ status: item._id, count: item.count })),
      passFail: passFail.map((item) => ({ label: item._id ? 'Pass' : 'Fail', count: item.count })),
      studentGrowth: studentGrowth.map((item) => ({ month: item._id, count: item.count })),
      examParticipation: examParticipation.map((item) => ({ examName: item.examName, count: item.count })),
      recentStudents,
      recentAttempts
    };
  }

  async studentSummary(user) {
    const submissions = await ExamSubmission.find({ student: user._id });
    const totalExams = submissions.length;
    const completedExams = submissions.filter((s) => s.status === 'submitted').length;
    const pendingExams = submissions.filter((s) => s.status === 'in_progress').length;
    const totalMarksObtained = submissions.reduce((sum, s) => sum + (s.score || 0), 0);

    const recentResults = await ExamSubmission.find({ student: user._id })
      .populate('exam', 'name subject totalMarks')
      .sort({ submittedAt: -1 })
      .limit(5);

    return {
      cards: {
        totalExams,
        completedExams,
        pendingExams,
        totalMarksObtained
      },
      recentResults
    };
  }
}

export const dashboardService = new DashboardService();