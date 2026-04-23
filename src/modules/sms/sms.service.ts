import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SmsMessage,
  SmsMessageDocument,
  SmsMessageStatus,
  SmsMessageType,
} from './schemas/sms-message.schema';
import { GreenSmsService } from './green-sms.service';
import { Deal, DealDocument } from '../deals/schemas/deal.schema';
import { Client, ClientDocument } from '../clients/schemas/client.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';

interface SendArgs {
  recipient: string;
  body: string;
  type: SmsMessageType;
  dealId?: Types.ObjectId;
  userId?: Types.ObjectId;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @InjectModel(SmsMessage.name)
    private readonly smsModel: Model<SmsMessageDocument>,
    @InjectModel(Deal.name) private readonly dealModel: Model<DealDocument>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly greenSms: GreenSmsService,
  ) {}

  async send(orgId: Types.ObjectId, args: SendArgs): Promise<SmsMessageDocument> {
    const message = new this.smsModel({
      organizationId: orgId,
      recipient: args.recipient,
      body: args.body,
      type: args.type,
      dealId: args.dealId,
      userId: args.userId,
      status: SmsMessageStatus.PENDING,
    });

    try {
      const res = await this.greenSms.send(args.recipient, args.body);
      message.status = SmsMessageStatus.SENT;
      message.sentAt = new Date();
      message.externalId = res.externalId;
    } catch (err) {
      message.status = SmsMessageStatus.FAILED;
      message.errorMessage = (err as Error).message;
      this.logger.warn(
        `SMS send failed to ${args.recipient}: ${(err as Error).message}`,
      );
    }

    return message.save();
  }

  async broadcast(
    orgId: Types.ObjectId,
    payload: { recipients: string[]; body: string; type?: SmsMessageType; dealId?: string },
  ): Promise<{ total: number; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;
    for (const recipient of payload.recipients) {
      const msg = await this.send(orgId, {
        recipient,
        body: payload.body,
        type: payload.type ?? SmsMessageType.BROADCAST,
        dealId: payload.dealId ? new Types.ObjectId(payload.dealId) : undefined,
      });
      if (msg.status === SmsMessageStatus.SENT) sent++;
      else failed++;
    }
    return { total: payload.recipients.length, sent, failed };
  }

  async list(
    orgId: Types.ObjectId,
    params: {
      page?: number;
      limit?: number;
      type?: SmsMessageType;
      dealId?: string;
    },
  ): Promise<{ data: SmsMessageDocument[]; total: number; page: number; limit: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const filter: Record<string, any> = { organizationId: orgId };
    if (params.type) filter.type = params.type;
    if (params.dealId) filter.dealId = new Types.ObjectId(params.dealId);

    const [data, total] = await Promise.all([
      this.smsModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.smsModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, limit };
  }

  async notifyDealCreated(
    orgId: Types.ObjectId,
    deal: DealDocument,
  ): Promise<void> {
    const [client, manager] = await Promise.all([
      this.clientModel.findById(deal.clientId).exec(),
      this.userModel.findById(deal.managerId).exec(),
    ]);

    const body = `Создана сделка ${deal.dealNumber}. Сумма: ${deal.salePrice} ₽. Платёж: ${deal.monthlyPayment} ₽/мес.`;
    await this.safeSendTo(orgId, {
      recipient: client?.phone,
      body,
      type: SmsMessageType.DEAL_CREATED,
      dealId: deal._id,
      userId: undefined,
    });
    await this.safeSendTo(orgId, {
      recipient: manager?.phone,
      body: `Вы назначены ответственным за сделку ${deal.dealNumber}. ${body}`,
      type: SmsMessageType.DEAL_CREATED,
      dealId: deal._id,
      userId: manager?._id,
    });
  }

  async notifyPayment(
    orgId: Types.ObjectId,
    deal: DealDocument,
    payment: PaymentDocument,
  ): Promise<void> {
    const [client, manager] = await Promise.all([
      this.clientModel.findById(deal.clientId).exec(),
      this.userModel.findById(deal.managerId).exec(),
    ]);

    const clientBody = `Спасибо! Платёж ${payment.amount} ₽ по сделке ${deal.dealNumber} зачислен. Остаток: ${payment.remainingAfterPayment} ₽.`;
    const managerBody = `Платёж ${payment.amount} ₽ по ${deal.dealNumber} от ${client ? client.lastName + ' ' + client.firstName : 'клиента'}. Остаток: ${payment.remainingAfterPayment} ₽.`;

    await this.safeSendTo(orgId, {
      recipient: client?.phone,
      body: clientBody,
      type: SmsMessageType.PAYMENT_RECEIVED,
      dealId: deal._id,
    });
    await this.safeSendTo(orgId, {
      recipient: manager?.phone,
      body: managerBody,
      type: SmsMessageType.PAYMENT_RECEIVED,
      dealId: deal._id,
      userId: manager?._id,
    });
  }

  async notifyOverdue(
    orgId: Types.ObjectId,
    deal: DealDocument,
  ): Promise<void> {
    const [client, manager] = await Promise.all([
      this.clientModel.findById(deal.clientId).exec(),
      this.userModel.findById(deal.managerId).exec(),
    ]);

    const clientBody = `Напоминание: по сделке ${deal.dealNumber} есть просрочка. Пожалуйста, свяжитесь с нами.`;
    const managerBody = `Просрочка по сделке ${deal.dealNumber} (${client ? client.lastName + ' ' + client.firstName : 'клиент'}).`;

    await this.safeSendTo(orgId, {
      recipient: client?.phone,
      body: clientBody,
      type: SmsMessageType.OVERDUE,
      dealId: deal._id,
    });
    await this.safeSendTo(orgId, {
      recipient: manager?.phone,
      body: managerBody,
      type: SmsMessageType.OVERDUE,
      dealId: deal._id,
      userId: manager?._id,
    });
  }

  private async safeSendTo(
    orgId: Types.ObjectId,
    args: {
      recipient?: string | null;
      body: string;
      type: SmsMessageType;
      dealId?: Types.ObjectId;
      userId?: Types.ObjectId;
    },
  ): Promise<void> {
    if (!args.recipient) return;
    try {
      await this.send(orgId, {
        recipient: args.recipient,
        body: args.body,
        type: args.type,
        dealId: args.dealId,
        userId: args.userId,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to persist SMS for ${args.recipient}: ${(err as Error).message}`,
      );
    }
  }
}
