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
    // Pre-validate existence and status before attempting the atomic update
    const existing = await this.dealModel
      .findOne({ _id: new Types.ObjectId(dto.dealId), organizationId: orgId })
      .exec();

    if (!existing) throw new NotFoundException('Deal not found');
    if (existing.status === DealStatus.CLOSED)
      throw new BadRequestException('Cannot add payment to a closed deal');
    if (existing.status === DealStatus.CANCELLED)
      throw new BadRequestException('Cannot add payment to a cancelled deal');

    const newRemaining = Math.round((existing.remainingAmount - dto.amount) * 100) / 100;

    // БАГ-01 fix: atomic decrement with guard — succeeds only if remainingAmount >= dto.amount
    // at the exact moment of the update, preventing concurrent over-payment
    const dealBeforeUpdate = await this.dealModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(dto.dealId),
          organizationId: orgId,
          status: { $nin: [DealStatus.CLOSED, DealStatus.CANCELLED] },
          remainingAmount: { $gte: dto.amount },
        },
        { $set: { remainingAmount: Math.max(0, newRemaining) } },
        { new: false }, // return document as it was BEFORE the update
      )
      .exec();

    if (!dealBeforeUpdate) {
      // Re-read to provide an accurate error message
      const current = await this.dealModel
        .findOne({ _id: new Types.ObjectId(dto.dealId), organizationId: orgId })
        .exec();
      if (!current) throw new NotFoundException('Deal not found');
      if (current.status === DealStatus.CLOSED)
        throw new BadRequestException('Cannot add payment to a closed deal');
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds remaining amount (${current.remainingAmount})`,
      );
    }

    // Update schedule entry in memory on the pre-update snapshot
    const scheduledDate = this.findAndUpdateScheduleEntry(dealBeforeUpdate, dto.amount);

    // БАГ-02 fix: create the payment document after the deal has been atomically updated,
    // so a failed payment save cannot leave the deal in a decremented state without a record
    const payment = new this.paymentModel({
      organizationId: orgId,
      dealId: dealBeforeUpdate._id,
      clientId: dealBeforeUpdate.clientId,
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

    // Atomically close the deal if fully paid
    if (newRemaining <= 0) {
      await this.dealModel
        .findOneAndUpdate(
          { _id: dealBeforeUpdate._id, organizationId: orgId },
          { $set: { status: DealStatus.CLOSED } },
        )
        .exec();
    } else if (dealBeforeUpdate.status === DealStatus.OVERDUE) {
      // Re-evaluate overdue status after payment — updatePaymentScheduleStatus will handle it
    }

    // Recalculate full schedule statuses from all payments (idempotent reconciliation)
    await this.dealsService.updatePaymentScheduleStatus(dealBeforeUpdate._id);

    try {
      await this.smsService.notifyPayment(orgId, dealBeforeUpdate, savedPayment);
    } catch (err) {
      // БАГ-20 fix: log as error so monitoring/alerting can pick it up
      this.logger.error(
        `Failed to send payment SMS for deal ${dealBeforeUpdate._id}: ${(err as Error).message}`,
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
    // Pre-validate
    const existing = await this.dealModel
      .findOne({ _id: new Types.ObjectId(dealId), organizationId: orgId })
      .exec();

    if (!existing) throw new NotFoundException('Deal not found');
    if (existing.status === DealStatus.CLOSED)
      throw new BadRequestException('Deal is already closed');
    if (existing.status === DealStatus.CANCELLED)
      throw new BadRequestException('Deal is cancelled');

    const newRemaining = Math.round((existing.remainingAmount - amount) * 100) / 100;

    // Atomic decrement with guard
    const dealBeforeUpdate = await this.dealModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(dealId),
          organizationId: orgId,
          status: { $nin: [DealStatus.CLOSED, DealStatus.CANCELLED] },
          remainingAmount: { $gte: amount },
        },
        { $set: { remainingAmount: Math.max(0, newRemaining) } },
        { new: false },
      )
      .exec();

    if (!dealBeforeUpdate) {
      const current = await this.dealModel
        .findOne({ _id: new Types.ObjectId(dealId), organizationId: orgId })
        .exec();
      if (!current) throw new NotFoundException('Deal not found');
      if (current.status === DealStatus.CLOSED)
        throw new BadRequestException('Deal is already closed');
      throw new BadRequestException(
        `Early repayment amount (${amount}) exceeds remaining amount (${current.remainingAmount})`,
      );
    }

    // Mark schedule entries proportionally on the pre-update snapshot
    this.applyEarlyRepaymentToSchedule(dealBeforeUpdate, amount);

    const payment = new this.paymentModel({
      organizationId: orgId,
      dealId: dealBeforeUpdate._id,
      clientId: dealBeforeUpdate.clientId,
      amount,
      paymentDate: new Date(),
      paymentMethod: PaymentMethod.TRANSFER,
      isEarly: true,
      remainingAfterPayment: Math.max(0, newRemaining),
      comment: `Early repayment${newRemaining <= 0 ? ' - full closure' : ''}`,
      createdBy: userId,
    });

    const savedPayment = await payment.save();

    if (newRemaining <= 0) {
      // Atomically close the deal and mark all remaining entries as paid
      const allPaidSchedule = dealBeforeUpdate.paymentSchedule.map((e) => ({
        ...e,
        status:
          e.status === PaymentScheduleStatus.PENDING ||
          e.status === PaymentScheduleStatus.PARTIAL ||
          e.status === PaymentScheduleStatus.OVERDUE
            ? PaymentScheduleStatus.PAID
            : e.status,
      }));
      await this.dealModel
        .findOneAndUpdate(
          { _id: dealBeforeUpdate._id, organizationId: orgId },
          { $set: { status: DealStatus.CLOSED, paymentSchedule: allPaidSchedule } },
        )
        .exec();
    }

    await this.dealsService.updatePaymentScheduleStatus(dealBeforeUpdate._id);

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
