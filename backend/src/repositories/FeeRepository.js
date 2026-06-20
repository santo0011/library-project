import { Fee } from '../models/Fee.js';
import { Roles } from '../config/roles.js';
import { BaseRepository } from './BaseRepository.js';

class FeeRepository extends BaseRepository {
  constructor() {
    super(Fee);
  }

  findByStudent(studentId) {
    return this.model.findOne({ student: studentId }).populate('student', 'name email studentId mobile status');
  }

  async paginate({ page = 1, limit = 10, search = '' }) {
    const studentMatch = { role: Roles.STUDENT };
    if (search) {
      studentMatch.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const pipeline = [
      { $match: studentMatch },
      {
        $lookup: {
          from: 'fees',
          localField: '_id',
          foreignField: 'student',
          as: 'fee'
        }
      },
      { $unwind: { path: '$fee', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: safeLimit },
            {
              $project: {
                student: {
                  _id: '$_id',
                  name: '$name',
                  email: '$email',
                  studentId: '$studentId',
                  mobile: '$mobile',
                  status: '$status'
                },
                totalFee: { $ifNull: ['$fee.totalFee', 0] },
                paidAmount: { $ifNull: ['$fee.paidAmount', 0] },
                dueAmount: { $ifNull: ['$fee.dueAmount', 0] },
                paymentStatus: { $ifNull: ['$fee.paymentStatus', 'Unpaid'] },
                assignedFees: { $ifNull: ['$fee.assignedFees', []] },
                payments: { $ifNull: ['$fee.payments', []] },
                feeId: '$fee._id'
              }
            }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ];

    const [result] = await this.model.db.model('User').aggregate(pipeline);
    const total = result?.total?.[0]?.count || 0;
    return {
      items: result?.items || [],
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit) || 1
    };
  }
}

export const feeRepository = new FeeRepository();
