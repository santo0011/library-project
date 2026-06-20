import { FeeType } from '../models/FeeType.js';
import { Fee } from '../models/Fee.js';
import { BaseRepository } from './BaseRepository.js';

class FeeTypeRepository extends BaseRepository {
  constructor() {
    super(FeeType);
  }

  async list({ activeOnly = false, page, limit, search = '' } = {}) {
    const filter = activeOnly ? { isActive: true } : {};
    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      filter.$or = [
        { name: { $regex: normalizedSearch, $options: 'i' } },
        { description: { $regex: normalizedSearch, $options: 'i' } }
      ];
    }

    const shouldPaginate = page !== undefined || limit !== undefined || normalizedSearch;
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const query = this.model.find(filter).sort({ createdAt: -1 });

    if (shouldPaginate) {
      query.skip((safePage - 1) * safeLimit).limit(safeLimit);
    }

    const [feeTypes, total, counts] = await Promise.all([
      query.lean(),
      shouldPaginate ? this.model.countDocuments(filter) : Promise.resolve(null),
      Fee.aggregate([
        { $unwind: '$assignedFees' },
        { $group: { _id: '$assignedFees.feeType', count: { $sum: 1 } } }
      ])
    ]);

    const countMap = new Map(counts.map((item) => [item._id?.toString(), item.count]));
    const items = feeTypes.map((type) => ({
      ...type,
      assignmentCount: countMap.get(type._id.toString()) || 0,
      isLocked: (countMap.get(type._id.toString()) || 0) > 0
    }));

    if (!shouldPaginate) return items;

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit) || 1
    };
  }
}

export const feeTypeRepository = new FeeTypeRepository();
