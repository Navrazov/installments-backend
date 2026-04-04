import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Deal, DealDocument, DealStatus, PaymentScheduleStatus, ScheduledPayment } from './schemas/deal.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';

@Injectable()
export class DealsService {
  constructor(
    @InjectModel(Deal.name) private dealModel: Model<DealDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async create(
    orgId: Types.ObjectId,
    dto: CreateDealDto,
    userId: Types.ObjectId,
  ): Promise<DealDocument> {
    const dealNumber = await this.generateDealNumber();

    const totalAmount = dto.salePrice;
    const remainingAmount = totalAmount - dto.downPayment;
    const monthlyPayment = remainingAmount / dto.termMonths;

    const startDate = new Date(dto.startDate);
    const paymentSchedule = this.generatePaymentSchedule(
      startDate,
      dto.termMonths,
      monthlyPayment,
    );

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + dto.termMonths);

    const deal = new this.dealModel({
      organizationId: orgId,
      clientId: new Types.ObjectId(dto.clientId),
      dealNumber,
      productDescription: dto.productDescription,
      purchasePrice: dto.purchasePrice,
      salePrice: dto.salePrice,
      markup: dto.markup,
      markupPercent: dto.markupPercent,
      downPayment: dto.downPayment,
      totalAmount,
      remainingAmount,
      termMonths: dto.termMonths,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      startDate,
      endDate,
      paymentSchedule,
      status: DealStatus.ACTIVE,
      branchName: dto.branchName || null,
      managerId: new Types.ObjectId(dto.managerId),
      guarantorId: dto.guarantorId
        ? new Types.ObjectId(dto.guarantorId)
        : undefined,
      comments: dto.comments || null,
      createdBy: userId,
    });

    return deal.save();
  }

  async findAll(
    orgId: Types.ObjectId,
    query: QueryDealDto,
  ): Promise<{ data: DealDocument[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, status, clientId, managerId, branchName, startDateFrom, startDateTo, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter: FilterQuery<DealDocument> = { organizationId: orgId };

    if (status) {
      filter.status = status;
    }
    if (clientId) {
      filter.clientId = new Types.ObjectId(clientId);
    }
    if (managerId) {
      filter.managerId = new Types.ObjectId(managerId);
    }
    if (branchName) {
      filter.branchName = branchName;
    }
    if (startDateFrom || startDateTo) {
      filter.startDate = {};
      if (startDateFrom) {
        filter.startDate.$gte = new Date(startDateFrom);
      }
      if (startDateTo) {
        filter.startDate.$lte = new Date(startDateTo);
      }
    }

    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.dealModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clientId', 'firstName lastName phone')
        .populate('managerId', 'firstName lastName email')
        .exec(),
      this.dealModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findById(orgId: Types.ObjectId, dealId: string): Promise<DealDocument> {
    const deal = await this.dealModel
      .findOne({
        _id: new Types.ObjectId(dealId),
        organizationId: orgId,
      })
      .populate('clientId', 'firstName lastName phone address')
      .populate('managerId', 'firstName lastName email')
      .populate('guarantorId', 'firstName lastName phone')
      .exec();

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return deal;
  }

  async update(
    orgId: Types.ObjectId,
    dealId: string,
    dto: UpdateDealDto,
    userId: Types.ObjectId,
  ): Promise<DealDocument> {
    const deal = await this.findById(orgId, dealId);

    if (deal.status === DealStatus.CLOSED || deal.status === DealStatus.CANCELLED) {
      throw new BadRequestException(
        `Cannot update a deal with status "${deal.status}"`,
      );
    }

    const updateData: Record<string, any> = { ...dto };

    if (dto.managerId) {
      updateData.managerId = new Types.ObjectId(dto.managerId);
    }
    if (dto.guarantorId) {
      updateData.guarantorId = new Types.ObjectId(dto.guarantorId);
    }

    // Recalculate financial fields if relevant fields changed
    const needsRecalc =
      dto.salePrice !== undefined ||
      dto.downPayment !== undefined ||
      dto.termMonths !== undefined ||
      dto.startDate !== undefined;

    if (needsRecalc) {
      const salePrice = dto.salePrice ?? deal.salePrice;
      const downPayment = dto.downPayment ?? deal.downPayment;
      const termMonths = dto.termMonths ?? deal.termMonths;
      const startDate = dto.startDate ? new Date(dto.startDate) : deal.startDate;

      const totalAmount = salePrice;
      const remainingAmountBase = totalAmount - downPayment;
      const monthlyPayment = remainingAmountBase / termMonths;

      // Calculate how much has already been paid
      const totalPaid = totalAmount - deal.remainingAmount - deal.downPayment;
      const newRemaining = remainingAmountBase - totalPaid;

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + termMonths);

      const paymentSchedule = this.generatePaymentSchedule(
        startDate,
        termMonths,
        monthlyPayment,
      );

      updateData.totalAmount = totalAmount;
      updateData.remainingAmount = Math.max(0, newRemaining);
      updateData.monthlyPayment = Math.round(monthlyPayment * 100) / 100;
      updateData.startDate = startDate;
      updateData.endDate = endDate;
      updateData.paymentSchedule = paymentSchedule;
    }

    const updated = await this.dealModel
      .findOneAndUpdate(
        { _id: deal._id, organizationId: orgId },
        { $set: updateData },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Deal not found');
    }

    return updated;
  }

  async cancel(
    orgId: Types.ObjectId,
    dealId: string,
    userId: Types.ObjectId,
  ): Promise<DealDocument> {
    const deal = await this.findById(orgId, dealId);

    if (deal.status === DealStatus.CLOSED) {
      throw new BadRequestException('Cannot cancel a closed deal');
    }
    if (deal.status === DealStatus.CANCELLED) {
      throw new BadRequestException('Deal is already cancelled');
    }

    deal.status = DealStatus.CANCELLED;
    return deal.save();
  }

  async close(
    orgId: Types.ObjectId,
    dealId: string,
    userId: Types.ObjectId,
  ): Promise<DealDocument> {
    const deal = await this.findById(orgId, dealId);

    if (deal.status === DealStatus.CANCELLED) {
      throw new BadRequestException('Cannot close a cancelled deal');
    }
    if (deal.status === DealStatus.CLOSED) {
      throw new BadRequestException('Deal is already closed');
    }

    deal.status = DealStatus.CLOSED;
    return deal.save();
  }

  async getDealPayments(
    orgId: Types.ObjectId,
    dealId: string,
  ): Promise<PaymentDocument[]> {
    // Verify deal exists and belongs to org
    await this.findById(orgId, dealId);

    return this.paymentModel
      .find({
        organizationId: orgId,
        dealId: new Types.ObjectId(dealId),
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updatePaymentScheduleStatus(dealId: Types.ObjectId): Promise<void> {
    const deal = await this.dealModel.findById(dealId).exec();
    if (!deal) return;

    const now = new Date();
    const payments = await this.paymentModel
      .find({ dealId: deal._id })
      .sort({ paymentDate: 1 })
      .exec();

    // Calculate total paid (excluding down payment which is separate)
    let totalPaidSoFar = 0;
    for (const payment of payments) {
      totalPaidSoFar += payment.amount;
    }

    let cumulativeScheduled = 0;
    for (const entry of deal.paymentSchedule) {
      cumulativeScheduled += entry.amount;

      if (totalPaidSoFar >= cumulativeScheduled) {
        entry.status = PaymentScheduleStatus.PAID;
      } else if (totalPaidSoFar > cumulativeScheduled - entry.amount) {
        entry.status = PaymentScheduleStatus.PARTIAL;
      } else if (new Date(entry.date) < now) {
        entry.status = PaymentScheduleStatus.OVERDUE;
      } else {
        entry.status = PaymentScheduleStatus.PENDING;
      }
    }

    deal.markModified('paymentSchedule');
    await deal.save();
  }

  async checkOverdue(): Promise<void> {
    const now = new Date();

    // Find active deals that have overdue schedule entries
    const deals = await this.dealModel
      .find({
        status: DealStatus.ACTIVE,
        'paymentSchedule.date': { $lt: now },
        'paymentSchedule.status': {
          $in: [PaymentScheduleStatus.PENDING, PaymentScheduleStatus.PARTIAL],
        },
      })
      .exec();

    for (const deal of deals) {
      let hasOverdue = false;

      for (const entry of deal.paymentSchedule) {
        if (
          new Date(entry.date) < now &&
          (entry.status === PaymentScheduleStatus.PENDING ||
            entry.status === PaymentScheduleStatus.PARTIAL)
        ) {
          entry.status = PaymentScheduleStatus.OVERDUE;
          hasOverdue = true;
        }
      }

      if (hasOverdue) {
        deal.status = DealStatus.OVERDUE;
        deal.markModified('paymentSchedule');
        await deal.save();
      }
    }
  }

  async getStats(
    orgId: Types.ObjectId,
  ): Promise<{
    totalDeals: number;
    active: number;
    closed: number;
    overdue: number;
    cancelled: number;
    totalVolume: number;
    totalCollected: number;
    totalRemaining: number;
  }> {
    const pipeline = [
      { $match: { organizationId: orgId } },
      {
        $group: {
          _id: null,
          totalDeals: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', DealStatus.ACTIVE] }, 1, 0] },
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', DealStatus.CLOSED] }, 1, 0] },
          },
          overdue: {
            $sum: { $cond: [{ $eq: ['$status', DealStatus.OVERDUE] }, 1, 0] },
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$status', DealStatus.CANCELLED] }, 1, 0],
            },
          },
          totalVolume: { $sum: '$totalAmount' },
          totalCollected: {
            $sum: { $subtract: ['$totalAmount', '$remainingAmount'] },
          },
          totalRemaining: { $sum: '$remainingAmount' },
        },
      },
    ];

    const [result] = await this.dealModel.aggregate(pipeline).exec();

    return (
      result || {
        totalDeals: 0,
        active: 0,
        closed: 0,
        overdue: 0,
        cancelled: 0,
        totalVolume: 0,
        totalCollected: 0,
        totalRemaining: 0,
      }
    );
  }

  async getUpcomingPayments(
    orgId: Types.ObjectId,
    days = 7,
  ): Promise<{
    dealId: string;
    dealNumber: string;
    clientName: string;
    clientPhone: string;
    date: Date;
    amount: number;
    daysUntil: number;
    status: string;
  }[]> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const future = new Date(now);
    future.setDate(future.getDate() + days);

    const deals = await this.dealModel
      .find({
        organizationId: orgId,
        status: { $in: [DealStatus.ACTIVE, DealStatus.OVERDUE] },
      })
      .populate<{ clientId: { firstName: string; lastName: string; phone: string } }>(
        'clientId',
        'firstName lastName phone',
      )
      .select('dealNumber clientId paymentSchedule')
      .exec();

    const result: {
      dealId: string;
      dealNumber: string;
      clientName: string;
      clientPhone: string;
      date: Date;
      amount: number;
      daysUntil: number;
      status: string;
    }[] = [];

    for (const deal of deals) {
      const client = deal.clientId as any;
      const clientName = client
        ? `${client.lastName} ${client.firstName}`
        : '—';
      const clientPhone = client?.phone || '';

      for (const entry of deal.paymentSchedule) {
        if (entry.status === PaymentScheduleStatus.PAID) continue;

        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);

        // Include overdue entries + entries due within `days`
        if (entryDate <= future) {
          const daysUntil = Math.ceil(
            (entryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );
          result.push({
            dealId: deal._id.toString(),
            dealNumber: deal.dealNumber,
            clientName,
            clientPhone,
            date: entry.date,
            amount: entry.amount,
            daysUntil,
            status: entry.status,
          });
        }
      }
    }

    return result.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 30);
  }

  generatePaymentSchedule(
    startDate: Date,
    termMonths: number,
    monthlyPayment: number,
  ): ScheduledPayment[] {
    const schedule: ScheduledPayment[] = [];
    const roundedPayment = Math.round(monthlyPayment * 100) / 100;

    for (let i = 1; i <= termMonths; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);

      schedule.push({
        date: paymentDate,
        amount: roundedPayment,
        status: PaymentScheduleStatus.PENDING,
      });
    }

    return schedule;
  }

  private async generateDealNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const prefix = `HL-${dateStr}-`;

    // Find the last deal number for today
    const lastDeal = await this.dealModel
      .findOne({
        dealNumber: { $regex: `^${prefix}` },
      })
      .sort({ dealNumber: -1 })
      .select('dealNumber')
      .exec();

    let sequence = 1;
    if (lastDeal) {
      const lastSeq = parseInt(lastDeal.dealNumber.split('-').pop() || '0', 10);
      sequence = lastSeq + 1;
    }

    const seqStr = String(sequence).padStart(4, '0');
    return `${prefix}${seqStr}`;
  }
}
