import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Payment, PaymentDocument, PaymentMethod } from './schemas/payment.schema';
import { Deal, DealDocument, DealStatus, PaymentScheduleStatus } from '../deals/schemas/deal.schema';
import { Client, ClientDocument } from '../clients/schemas/client.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { DealsService } from '../deals/deals.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Deal.name) private dealModel: Model<DealDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    private readonly dealsService: DealsService,
    private readonly smsService: SmsService,
  ) {}

  async create(
    orgId: Types.ObjectId,
    dto: CreatePaymentDto,
    userId: Types.ObjectId,
  ): Promise<PaymentDocument> {
    const deal = await this.dealModel
      .findOne({
        _id: new Types.ObjectId(dto.dealId),
        organizationId: orgId,
      })
      .exec();

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.status === DealStatus.CLOSED) {
      throw new BadRequestException('Cannot add payment to a closed deal');
    }
    if (deal.status === DealStatus.CANCELLED) {
      throw new BadRequestException('Cannot add payment to a cancelled deal');
    }

    if (dto.amount > deal.remainingAmount) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds remaining amount (${deal.remainingAmount})`,
      );
    }

    // Find the closest unpaid schedule entry and mark it
    const scheduledDate = this.findAndUpdateScheduleEntry(deal, dto.amount);

    const newRemaining = Math.round((deal.remainingAmount - dto.amount) * 100) / 100;

    const payment = new this.paymentModel({
      organizationId: orgId,
      dealId: deal._id,
      clientId: deal.clientId,
      amount: dto.amount,
      paymentDate: new Date(dto.paymentDate),
      paymentMethod: dto.paymentMethod,
      scheduledDate: scheduledDate || undefined,
      isEarly: false,
      remainingAfterPayment: Math.max(0, newRemaining),
      comment: dto.comment || null,
      createdBy: userId,
    });

    const savedPayment = await payment.save();

    // Update deal remaining amount
    deal.remainingAmount = Math.max(0, newRemaining);

    // If remaining is 0, close the deal
    if (deal.remainingAmount <= 0) {
      deal.status = DealStatus.CLOSED;
    } else if (deal.status === DealStatus.OVERDUE) {
      // Check if there are still overdue entries
      const hasOverdue = deal.paymentSchedule.some(
        (entry) => entry.status === PaymentScheduleStatus.OVERDUE,
      );
      if (!hasOverdue) {
        deal.status = DealStatus.ACTIVE;
      }
    }

    deal.markModified('paymentSchedule');
    await deal.save();

    // Recalculate full schedule statuses based on all payments
    await this.dealsService.updatePaymentScheduleStatus(deal._id);

    try {
      await this.smsService.notifyPayment(orgId, deal, savedPayment);
    } catch (err) {
      this.logger.warn(
        `Failed to send payment SMS for deal ${deal._id}: ${(err as Error).message}`,
      );
    }

    return savedPayment;
  }

  async findAll(
    orgId: Types.ObjectId,
    query: QueryPaymentDto,
  ): Promise<{ data: PaymentDocument[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, dealId, clientId, dateFrom, dateTo, paymentMethod, sortBy = 'paymentDate', sortOrder = 'desc' } = query;

    const filter: FilterQuery<PaymentDocument> = { organizationId: orgId };

    if (dealId) {
      filter.dealId = new Types.ObjectId(dealId);
    }
    if (clientId) {
      filter.clientId = new Types.ObjectId(clientId);
    }
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }
    if (dateFrom || dateTo) {
      filter.paymentDate = {};
      if (dateFrom) {
        filter.paymentDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.paymentDate.$lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('dealId', 'dealNumber productDescription status')
        .populate('clientId', 'firstName lastName phone')
        .exec(),
      this.paymentModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findById(
    orgId: Types.ObjectId,
    paymentId: string,
  ): Promise<PaymentDocument> {
    const payment = await this.paymentModel
      .findOne({
        _id: new Types.ObjectId(paymentId),
        organizationId: orgId,
      })
      .populate('dealId', 'dealNumber productDescription status clientId')
      .populate('clientId', 'firstName lastName phone')
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getPaymentsByDeal(
    orgId: Types.ObjectId,
    dealId: string,
  ): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({
        organizationId: orgId,
        dealId: new Types.ObjectId(dealId),
      })
      .sort({ createdAt: -1 })
      .populate('clientId', 'firstName lastName phone')
      .exec();
  }

  async getPaymentsByClient(
    orgId: Types.ObjectId,
    clientId: string,
  ): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({
        organizationId: orgId,
        clientId: new Types.ObjectId(clientId),
      })
      .sort({ createdAt: -1 })
      .populate('dealId', 'dealNumber productDescription status')
      .exec();
  }

  async getStats(
    orgId: Types.ObjectId,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{
    totalCollected: number;
    totalCount: number;
    byMethod: Record<string, { count: number; total: number }>;
  }> {
    const matchStage: FilterQuery<PaymentDocument> = {
      organizationId: orgId,
    };

    if (dateFrom || dateTo) {
      matchStage.paymentDate = {};
      if (dateFrom) {
        matchStage.paymentDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        matchStage.paymentDate.$lte = new Date(dateTo);
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalCollected: { $sum: '$amount' },
                totalCount: { $sum: 1 },
              },
            },
          ],
          byMethod: [
            {
              $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
                total: { $sum: '$amount' },
              },
            },
          ],
        },
      },
    ];

    const [result] = await this.paymentModel.aggregate(pipeline).exec();

    const totals = result?.totals?.[0] || {
      totalCollected: 0,
      totalCount: 0,
    };

    const byMethod: Record<string, { count: number; total: number }> = {};
    for (const method of Object.values(PaymentMethod)) {
      byMethod[method] = { count: 0, total: 0 };
    }
    if (result?.byMethod) {
      for (const entry of result.byMethod) {
        byMethod[entry._id] = { count: entry.count, total: entry.total };
      }
    }

    return {
      totalCollected: totals.totalCollected,
      totalCount: totals.totalCount,
      byMethod,
    };
  }

  async earlyRepayment(
    orgId: Types.ObjectId,
    dealId: string,
    amount: number,
    userId: Types.ObjectId,
  ): Promise<PaymentDocument> {
    const deal = await this.dealModel
      .findOne({
        _id: new Types.ObjectId(dealId),
        organizationId: orgId,
      })
      .exec();

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.status === DealStatus.CLOSED) {
      throw new BadRequestException('Deal is already closed');
    }
    if (deal.status === DealStatus.CANCELLED) {
      throw new BadRequestException('Deal is cancelled');
    }

    if (amount > deal.remainingAmount) {
      throw new BadRequestException(
        `Early repayment amount (${amount}) exceeds remaining amount (${deal.remainingAmount})`,
      );
    }

    const newRemaining = Math.round((deal.remainingAmount - amount) * 100) / 100;

    // Mark all remaining schedule entries proportionally
    this.applyEarlyRepaymentToSchedule(deal, amount);

    const payment = new this.paymentModel({
      organizationId: orgId,
      dealId: deal._id,
      clientId: deal.clientId,
      amount,
      paymentDate: new Date(),
      paymentMethod: PaymentMethod.TRANSFER,
      isEarly: true,
      remainingAfterPayment: Math.max(0, newRemaining),
      comment: `Early repayment${newRemaining <= 0 ? ' - full closure' : ''}`,
      createdBy: userId,
    });

    const savedPayment = await payment.save();

    deal.remainingAmount = Math.max(0, newRemaining);

    if (deal.remainingAmount <= 0) {
      deal.status = DealStatus.CLOSED;
      // Mark all remaining pending entries as paid
      for (const entry of deal.paymentSchedule) {
        if (
          entry.status === PaymentScheduleStatus.PENDING ||
          entry.status === PaymentScheduleStatus.PARTIAL ||
          entry.status === PaymentScheduleStatus.OVERDUE
        ) {
          entry.status = PaymentScheduleStatus.PAID;
        }
      }
    }

    deal.markModified('paymentSchedule');
    await deal.save();

    return savedPayment;
  }

  /**
   * Find the closest unpaid schedule entry and update its status.
   * Returns the scheduled date of the matched entry, or null if none found.
   */
  private findAndUpdateScheduleEntry(
    deal: DealDocument,
    paymentAmount: number,
  ): Date | null {
    // Find first non-paid entry (prefer overdue, then pending)
    let targetEntry = deal.paymentSchedule.find(
      (e) => e.status === PaymentScheduleStatus.OVERDUE,
    );

    if (!targetEntry) {
      targetEntry = deal.paymentSchedule.find(
        (e) =>
          e.status === PaymentScheduleStatus.PARTIAL ||
          e.status === PaymentScheduleStatus.PENDING,
      );
    }

    if (!targetEntry) {
      return null;
    }

    if (paymentAmount >= targetEntry.amount) {
      targetEntry.status = PaymentScheduleStatus.PAID;
    } else {
      targetEntry.status = PaymentScheduleStatus.PARTIAL;
    }

    return targetEntry.date;
  }

  /**
   * For early repayment, mark schedule entries as paid starting from earliest unpaid.
   */
  private applyEarlyRepaymentToSchedule(
    deal: DealDocument,
    totalAmount: number,
  ): void {
    let remaining = totalAmount;

    for (const entry of deal.paymentSchedule) {
      if (remaining <= 0) break;

      if (
        entry.status === PaymentScheduleStatus.OVERDUE ||
        entry.status === PaymentScheduleStatus.PARTIAL ||
        entry.status === PaymentScheduleStatus.PENDING
      ) {
        if (remaining >= entry.amount) {
          entry.status = PaymentScheduleStatus.PAID;
          remaining -= entry.amount;
        } else {
          entry.status = PaymentScheduleStatus.PARTIAL;
          remaining = 0;
        }
      }
    }
  }
}
