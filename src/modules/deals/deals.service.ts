import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Deal, DealDocument, DealStatus, PaymentScheduleStatus, ScheduledPayment } from './schemas/deal.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { CreateDealDto, RoundingMode } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';
import { ContractsService } from '../contracts/contracts.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class DealsService implements OnModuleInit {
  private readonly logger = new Logger(DealsService.name);

  constructor(
    @InjectModel(Deal.name) private dealModel: Model<DealDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @Inject(forwardRef(() => ContractsService))
    private readonly contractsService: ContractsService,
    @Inject(forwardRef(() => SmsService))
    private readonly smsService: SmsService,
  ) {}

  // One-time migration: drop the legacy global-unique index on `dealNumber` so
  // that two organizations can both have a deal numbered "0001". The compound
  // `(organizationId, dealNumber)` index defined in the schema is the new guard.
  async onModuleInit(): Promise<void> {
    try {
      const indexes = await this.dealModel.collection.indexes();
      const legacy = indexes.find(
        (i) => i.name === 'dealNumber_1' && i.unique === true,
      );
      if (legacy) {
        await this.dealModel.collection.dropIndex('dealNumber_1');
        this.logger.log('Dropped legacy global-unique index dealNumber_1');
      }
      await this.dealModel.syncIndexes();
    } catch (err) {
      this.logger.warn(
        `Failed to sync deal indexes: ${(err as Error).message}`,
      );
    }
  }

  async create(
    orgId: Types.ObjectId,
    dto: CreateDealDto,
    userId: Types.ObjectId,
  ): Promise<DealDocument> {
    const dealNumber = await this.generateDealNumber(orgId);

    const purchasePrice = dto.purchasePrice ?? 0;
    const totalAmount = dto.salePrice;
    const markup = Math.max(0, dto.salePrice - purchasePrice);
    const markupPercent = purchasePrice > 0 ? (markup / purchasePrice) * 100 : 0;

    const remainingAmount = totalAmount - dto.downPayment;
    const rawMonthlyPayment = remainingAmount / dto.termMonths;
    const monthlyPayment = this.applyRounding(rawMonthlyPayment, dto.roundingMode);

    const startDate = new Date(dto.startDate);
    const firstPaymentDate = dto.firstPaymentDate
      ? new Date(dto.firstPaymentDate)
      : (() => {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + 1);
          return d;
        })();

    const paymentSchedule = this.generatePaymentSchedule(
      firstPaymentDate,
      dto.termMonths,
      monthlyPayment,
      remainingAmount,
    );

    const endDate = new Date(firstPaymentDate);
    endDate.setMonth(endDate.getMonth() + dto.termMonths - 1);

    const deal = new this.dealModel({
      organizationId: orgId,
      clientId: new Types.ObjectId(dto.clientId),
      dealNumber,
      productDescription: dto.productDescription,
      purchasePrice,
      salePrice: dto.salePrice,
      markup: Math.round(markup * 100) / 100,
      markupPercent: Math.round(markupPercent * 100) / 100,
      downPayment: dto.downPayment,
      totalAmount,
      remainingAmount,
      termMonths: dto.termMonths,
      monthlyPayment,
      startDate,
      firstPaymentDate,
      endDate,
      paymentSchedule,
      status: DealStatus.ACTIVE,
      managerId: userId,
      comments: dto.comments || null,
      createdBy: userId,
    });

    const saved = await deal.save();

    try {
      await this.contractsService.createFromDeal(orgId, saved._id);
    } catch (err) {
      this.logger.warn(
        `Failed to auto-generate contract for deal ${saved._id}: ${(err as Error).message}`,
      );
    }

    try {
      await this.smsService.notifyDealCreated(orgId, saved);
    } catch (err) {
      this.logger.warn(
        `Failed to send SMS notification for deal ${saved._id}: ${(err as Error).message}`,
      );
    }

    return saved;
  }

  private applyRounding(value: number, mode?: RoundingMode): number {
    if (mode === RoundingMode.UP) {
      return Math.ceil(value / 100) * 100;
    }
    if (mode === RoundingMode.DOWN) {
      return Math.floor(value / 100) * 100;
    }
    return Math.round(value * 100) / 100;
  }

  async findAll(
    orgId: Types.ObjectId,
    query: QueryDealDto,
  ): Promise<{ data: DealDocument[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, status, clientId, managerId, search, startDateFrom, startDateTo, sortBy = 'createdAt', sortOrder = 'desc' } = query;

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
    if (search && search.trim().length > 0) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.dealNumber = { $regex: regex };
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

    // Recalculate financial fields if relevant fields changed
    const needsRecalc =
      dto.salePrice !== undefined ||
      dto.downPayment !== undefined ||
      dto.termMonths !== undefined ||
      dto.startDate !== undefined ||
      dto.firstPaymentDate !== undefined;

    if (needsRecalc) {
      const salePrice = dto.salePrice ?? deal.salePrice;
      const downPayment = dto.downPayment ?? deal.downPayment;
      const termMonths = dto.termMonths ?? deal.termMonths;
      const startDate = dto.startDate ? new Date(dto.startDate) : deal.startDate;
      const firstPaymentDate = dto.firstPaymentDate
        ? new Date(dto.firstPaymentDate)
        : deal.firstPaymentDate ?? (() => {
            const d = new Date(startDate);
            d.setMonth(d.getMonth() + 1);
            return d;
          })();

      const totalAmount = salePrice;
      const remainingAmountBase = totalAmount - downPayment;
      const monthlyPayment = remainingAmountBase / termMonths;

      // БАГ-04 fix: use deal.totalAmount (old value), not totalAmount (new value)
      const totalPaid = deal.totalAmount - deal.downPayment - deal.remainingAmount;
      const newRemaining = remainingAmountBase - totalPaid;

      const endDate = new Date(firstPaymentDate);
      endDate.setMonth(endDate.getMonth() + termMonths - 1);

      const newSchedule = this.generatePaymentSchedule(
        firstPaymentDate,
        termMonths,
        monthlyPayment,
        remainingAmountBase,
      );

      // БАГ-03 fix: preserve PAID/PARTIAL entries from the original schedule so payment
      // history is not wiped when financial terms are edited
      const oldSchedule = deal.paymentSchedule;
      for (let i = 0; i < newSchedule.length && i < oldSchedule.length; i++) {
        if (
          oldSchedule[i].status === PaymentScheduleStatus.PAID ||
          oldSchedule[i].status === PaymentScheduleStatus.PARTIAL
        ) {
          newSchedule[i].status = oldSchedule[i].status;
          newSchedule[i].date = oldSchedule[i].date;
          newSchedule[i].amount = oldSchedule[i].amount;
        }
      }

      updateData.totalAmount = totalAmount;
      updateData.remainingAmount = Math.max(0, newRemaining);
      updateData.monthlyPayment = Math.round(monthlyPayment * 100) / 100;
      updateData.startDate = startDate;
      updateData.firstPaymentDate = firstPaymentDate;
      updateData.endDate = endDate;
      updateData.paymentSchedule = newSchedule;
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
    // БАГ-07 fix: prevent closing a deal that still has an outstanding balance
    if (deal.remainingAmount > 0) {
      throw new BadRequestException(
        `Cannot close deal with unpaid balance of ${deal.remainingAmount} ₽`,
      );
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

    // Update only the paymentSchedule field to avoid overwriting status/remainingAmount
    // that were set atomically during payment processing
    await this.dealModel
      .findOneAndUpdate(
        { _id: deal._id },
        { $set: { paymentSchedule: deal.paymentSchedule } },
      )
      .exec();
  }

  async checkOverdue(): Promise<void> {
    const now = new Date();

    // БАГ-06 fix: include OVERDUE deals so new overdue entries within them are also updated
    const deals = await this.dealModel
      .find({
        status: { $in: [DealStatus.ACTIVE, DealStatus.OVERDUE] },
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
        try {
          await this.smsService.notifyOverdue(deal.organizationId, deal);
        } catch (err) {
          this.logger.error(
            `Failed to send overdue SMS for deal ${deal._id}: ${(err as Error).message}`,
          );
        }
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
    firstPaymentDate: Date,
    termMonths: number,
    monthlyPayment: number,
    remainingAmount?: number,
  ): ScheduledPayment[] {
    const schedule: ScheduledPayment[] = [];
    const roundedPayment = Math.round(monthlyPayment * 100) / 100;

    for (let i = 0; i < termMonths; i++) {
      const paymentDate = new Date(firstPaymentDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);

      schedule.push({
        date: paymentDate,
        amount: roundedPayment,
        status: PaymentScheduleStatus.PENDING,
      });
    }

    if (remainingAmount !== undefined && schedule.length > 0) {
      const totalScheduled = roundedPayment * termMonths;
      const diff = Math.round((remainingAmount - totalScheduled) * 100) / 100;
      if (diff !== 0) {
        const last = schedule[schedule.length - 1];
        last.amount = Math.max(0, Math.round((last.amount + diff) * 100) / 100);
      }
    }

    return schedule;
  }

  // Per-organization sequential contract numbers: 0001, 0002, ... Uniqueness is
  // enforced by the compound `(organizationId, dealNumber)` index — if two
  // concurrent inserts land on the same number, the loser gets a duplicate-key
  // error and the request is retried below.
  private async generateDealNumber(orgId: Types.ObjectId): Promise<string> {
    const lastDeal = await this.dealModel
      .findOne({ organizationId: orgId, dealNumber: { $regex: '^[0-9]+$' } })
      .sort({ dealNumber: -1 })
      .collation({ locale: 'en_US', numericOrdering: true })
      .select('dealNumber')
      .exec();

    let sequence = 1;
    if (lastDeal) {
      const lastSeq = parseInt(lastDeal.dealNumber, 10);
      sequence = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
    }

    return String(sequence).padStart(4, '0');
  }
}
