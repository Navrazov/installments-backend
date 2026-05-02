import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Overdue, OverdueDocument, OverdueStatus } from './schemas/overdue.schema';
import { Deal, DealDocument, DealStatus, PaymentScheduleStatus } from '../deals/schemas/deal.schema';
import { UpdateOverdueDto } from './dto/update-overdue.dto';
import { QueryOverdueDto } from './dto/query-overdue.dto';

@Injectable()
export class OverdueService {
  private readonly logger = new Logger(OverdueService.name);

  constructor(
    @InjectModel(Overdue.name) private readonly overdueModel: Model<OverdueDocument>,
    @InjectModel(Deal.name) private readonly dealModel: Model<DealDocument>,
  ) {}

  async findAll(
    orgId: string,
    query: QueryOverdueDto,
  ): Promise<{ data: OverdueDocument[]; total: number; page: number; limit: number }> {
    const filter: FilterQuery<OverdueDocument> = {
      organizationId: new Types.ObjectId(orgId),
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.assignedTo) {
      filter.assignedTo = new Types.ObjectId(query.assignedTo);
    }

    if (query.minDays !== undefined || query.maxDays !== undefined) {
      filter.overdueDays = {};
      if (query.minDays !== undefined) {
        filter.overdueDays.$gte = query.minDays;
      }
      if (query.maxDays !== undefined) {
        filter.overdueDays.$lte = query.maxDays;
      }
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? 'overdueDays';
    const sortOrder = query.sortOrder ?? 'desc';
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      this.overdueModel
        .find(filter)
        .populate('clientId', 'firstName lastName phone')
        .populate('dealId', 'dealNumber totalAmount remainingAmount')
        .populate('assignedTo', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.overdueModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findById(orgId: string, overdueId: string): Promise<OverdueDocument> {
    if (!Types.ObjectId.isValid(overdueId)) {
      throw new BadRequestException('Invalid overdue ID');
    }

    const overdue = await this.overdueModel
      .findOne({
        _id: new Types.ObjectId(overdueId),
        organizationId: new Types.ObjectId(orgId),
      })
      .populate('clientId', 'firstName lastName phone riskStatus')
      .populate('dealId', 'dealNumber totalAmount remainingAmount status paymentSchedule')
      .populate('assignedTo', 'firstName lastName email')
      .exec();

    if (!overdue) {
      throw new NotFoundException(`Overdue record with ID "${overdueId}" not found`);
    }

    return overdue;
  }

  async createOrUpdate(
    orgId: string,
    dealId: string,
    clientId: string,
    overdueAmount: number,
    overdueDays: number,
  ): Promise<OverdueDocument> {
    const orgOid = new Types.ObjectId(orgId);
    const dealOid = new Types.ObjectId(dealId);
    const clientOid = new Types.ObjectId(clientId);

    const existing = await this.overdueModel
      .findOne({
        organizationId: orgOid,
        dealId: dealOid,
        status: { $ne: OverdueStatus.RESOLVED },
      })
      .exec();

    if (existing) {
      existing.overdueAmount = overdueAmount;
      existing.overdueDays = overdueDays;
      return existing.save();
    }

    const overdue = new this.overdueModel({
      organizationId: orgOid,
      dealId: dealOid,
      clientId: clientOid,
      overdueAmount,
      overdueDays,
      status: OverdueStatus.NEW,
    });

    return overdue.save();
  }

  async updateStatus(
    orgId: string,
    overdueId: string,
    dto: UpdateOverdueDto,
    userId: string,
  ): Promise<OverdueDocument> {
    if (!Types.ObjectId.isValid(overdueId)) {
      throw new BadRequestException('Invalid overdue ID');
    }

    const overdue = await this.overdueModel
      .findOne({
        _id: new Types.ObjectId(overdueId),
        organizationId: new Types.ObjectId(orgId),
      })
      .exec();

    if (!overdue) {
      throw new NotFoundException(`Overdue record with ID "${overdueId}" not found`);
    }

    if (overdue.status === OverdueStatus.RESOLVED) {
      throw new BadRequestException('Cannot update a resolved overdue record');
    }

    if (dto.status !== undefined) {
      overdue.status = dto.status;
    }

    if (dto.lastContactDate !== undefined) {
      overdue.lastContactDate = new Date(dto.lastContactDate);
    }

    if (dto.promisedPaymentDate !== undefined) {
      overdue.promisedPaymentDate = new Date(dto.promisedPaymentDate);
    }

    if (dto.managerComment !== undefined) {
      overdue.managerComment = dto.managerComment;
    }

    if (dto.assignedTo !== undefined) {
      overdue.assignedTo = new Types.ObjectId(dto.assignedTo);
    }

    this.logger.log(
      `Overdue ${overdueId} status updated by user ${userId}: ${JSON.stringify(dto)}`,
    );

    return overdue.save();
  }

  async resolve(
    orgId: string,
    overdueId: string,
    userId: string,
  ): Promise<OverdueDocument> {
    if (!Types.ObjectId.isValid(overdueId)) {
      throw new BadRequestException('Invalid overdue ID');
    }

    const overdue = await this.overdueModel
      .findOne({
        _id: new Types.ObjectId(overdueId),
        organizationId: new Types.ObjectId(orgId),
      })
      .exec();

    if (!overdue) {
      throw new NotFoundException(`Overdue record with ID "${overdueId}" not found`);
    }

    if (overdue.status === OverdueStatus.RESOLVED) {
      throw new BadRequestException('Overdue record is already resolved');
    }

    overdue.status = OverdueStatus.RESOLVED;

    this.logger.log(`Overdue ${overdueId} resolved by user ${userId}`);

    return overdue.save();
  }

  async getStats(orgId: string): Promise<{
    totalOverdue: number;
    totalOverdueAmount: number;
    averageOverdueDays: number;
    byStatus: Record<string, number>;
    newThisWeek: number;
    resolvedThisWeek: number;
  }> {
    const orgOid = new Types.ObjectId(orgId);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [aggregateResult, statusBreakdown, newThisWeek, resolvedThisWeek] =
      await Promise.all([
        this.overdueModel
          .aggregate([
            {
              $match: {
                organizationId: orgOid,
                status: { $ne: OverdueStatus.RESOLVED },
              },
            },
            {
              $group: {
                _id: null,
                totalCount: { $sum: 1 },
                totalAmount: { $sum: '$overdueAmount' },
                averageDays: { $avg: '$overdueDays' },
              },
            },
          ])
          .exec(),
        this.overdueModel
          .aggregate([
            {
              $match: {
                organizationId: orgOid,
                status: { $ne: OverdueStatus.RESOLVED },
              },
            },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ])
          .exec(),
        this.overdueModel
          .countDocuments({
            organizationId: orgOid,
            createdAt: { $gte: weekAgo },
          })
          .exec(),
        this.overdueModel
          .countDocuments({
            organizationId: orgOid,
            status: OverdueStatus.RESOLVED,
            updatedAt: { $gte: weekAgo },
          })
          .exec(),
      ]);

    const stats = aggregateResult[0] || {
      totalCount: 0,
      totalAmount: 0,
      averageDays: 0,
    };

    const byStatus: Record<string, number> = {};
    for (const item of statusBreakdown) {
      byStatus[item._id] = item.count;
    }

    return {
      totalOverdue: stats.totalCount,
      totalOverdueAmount: stats.totalAmount,
      averageOverdueDays: Math.round((stats.averageDays || 0) * 100) / 100,
      byStatus,
      newThisWeek,
      resolvedThisWeek,
    };
  }

  async syncOverdueFromDeals(orgId: string): Promise<{ created: number; updated: number }> {
    const orgOid = new Types.ObjectId(orgId);
    const now = new Date();
    let created = 0;
    let updated = 0;

    const activeDeals = await this.dealModel
      .find({
        organizationId: orgOid,
        status: { $in: [DealStatus.ACTIVE, DealStatus.OVERDUE] },
      })
      .exec();

    for (const deal of activeDeals) {
      let totalOverdueAmount = 0;
      let maxOverdueDays = 0;
      let scheduleDirty = false;

      for (const payment of deal.paymentSchedule) {
        const paymentDate = new Date(payment.date);
        const isPastDue = paymentDate < now;

        if (
          isPastDue &&
          (payment.status === PaymentScheduleStatus.PENDING ||
            payment.status === PaymentScheduleStatus.PARTIAL)
        ) {
          payment.status = PaymentScheduleStatus.OVERDUE;
          scheduleDirty = true;
        }

        if (payment.status === PaymentScheduleStatus.OVERDUE) {
          totalOverdueAmount += payment.amount;
          const diffMs = now.getTime() - paymentDate.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays > maxOverdueDays) {
            maxOverdueDays = diffDays;
          }
        }
      }

      if (scheduleDirty) {
        deal.markModified('paymentSchedule');
      }

      const shouldBeOverdue = totalOverdueAmount > 0 && maxOverdueDays > 0;
      if (shouldBeOverdue && deal.status === DealStatus.ACTIVE) {
        deal.status = DealStatus.OVERDUE;
      } else if (!shouldBeOverdue && deal.status === DealStatus.OVERDUE) {
        deal.status = DealStatus.ACTIVE;
      }

      if (scheduleDirty || deal.isModified('status')) {
        await deal.save();
      }

      if (shouldBeOverdue) {
        const existing = await this.overdueModel
          .findOne({
            organizationId: orgOid,
            dealId: deal._id,
            status: { $ne: OverdueStatus.RESOLVED },
          })
          .exec();

        if (existing) {
          existing.overdueAmount = totalOverdueAmount;
          existing.overdueDays = maxOverdueDays;
          await existing.save();
          updated++;
        } else {
          const overdue = new this.overdueModel({
            organizationId: orgOid,
            dealId: deal._id,
            clientId: deal.clientId,
            overdueAmount: totalOverdueAmount,
            overdueDays: maxOverdueDays,
            status: OverdueStatus.NEW,
          });
          await overdue.save();
          created++;
        }
      }
    }

    return { created, updated };
  }
}
