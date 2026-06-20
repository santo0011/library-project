import { Fee } from '../models/Fee.js';
import { Roles } from '../config/roles.js';
import { BaseRepository } from './BaseRepository.js';

class FeeRepository extends BaseRepository {
  constructor() {
    super(Fee);
  }

  async findByStudent(studentId) {
    const fee = await this.model.findOne({ student: studentId }).populate('student', 'name email studentId mobile status').lean();
    if (!fee) return null;

    // Convert ObjectId feeType fields to strings for frontend compatibility
    if (fee.assignedFees) {
      fee.assignedFees = fee.assignedFees.map((af) => ({
        ...af,
        feeType: af.feeType?.toString() || af.feeType
      }));
    }
    if (fee.payments) {
      fee.payments = fee.payments.map((p) => ({
        ...p,
        feeType: p.feeType?.toString() || p.feeType
      }));
    }

    return fee;
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
                assignedFees: {
                  $ifNull: [
                    {
                      $map: {
                        input: { $ifNull: ['$fee.assignedFees', []] },
                        as: 'af',
                        in: {
                          $mergeObjects: [
                            '$$af',
                            { feeType: { $toString: '$$af.feeType' } }
                          ]
                        }
                      }
                    },
                    []
                  ]
                },
                payments: {
                  $ifNull: [
                    {
                      $map: {
                        input: { $ifNull: ['$fee.payments', []] },
                        as: 'p',
                        in: {
                          $mergeObjects: [
                            '$$p',
                            { feeType: { $toString: '$$p.feeType' } }
                          ]
                        }
                      }
                    },
                    []
                  ]
                },
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

  async getRecentPayments(limit = 5) {
    const pipeline = [
      { $unwind: { path: '$payments', preserveNullAndEmptyArrays: false } },
      { $sort: { 'payments.paymentDate': -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          paymentId: '$payments._id',
          amount: '$payments.amount',
          paymentDate: '$payments.paymentDate',
          paymentMode: '$payments.paymentMode',
          transactionId: '$payments.transactionId',
          feeName: '$payments.feeName',
          feeType: { $toString: '$payments.feeType' },
          remarks: '$payments.remarks',
          recordedBy: '$payments.recordedBy',
          student: {
            _id: '$studentInfo._id',
            name: '$studentInfo.name',
            studentId: '$studentInfo.studentId',
            email: '$studentInfo.email'
          }
        }
      }
    ];

    return this.model.aggregate(pipeline);
  }
}

export const feeRepository = new FeeRepository();