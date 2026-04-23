import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SmsMessageType {
  DEAL_CREATED = 'deal_created',
  PAYMENT_RECEIVED = 'payment_received',
  OVERDUE = 'overdue',
  BROADCAST = 'broadcast',
  OTHER = 'other',
}

export enum SmsMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export type SmsMessageDocument = SmsMessage & Document;

@Schema({ timestamps: true, collection: 'sms_messages' })
export class SmsMessage {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  recipient: string;

  @Prop({ required: true })
  body: string;

  @Prop({
    required: true,
    enum: SmsMessageType,
    default: SmsMessageType.OTHER,
    index: true,
  })
  type: SmsMessageType;

  @Prop({ type: Types.ObjectId, ref: 'Deal', required: false, index: true })
  dealId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId;

  @Prop({
    required: true,
    enum: SmsMessageStatus,
    default: SmsMessageStatus.PENDING,
  })
  status: SmsMessageStatus;

  @Prop({ type: Date, required: false })
  sentAt?: Date;

  @Prop({ type: String, default: null })
  errorMessage: string | null;

  @Prop({ type: String, default: null })
  externalId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const SmsMessageSchema = SchemaFactory.createForClass(SmsMessage);

SmsMessageSchema.index({ organizationId: 1, createdAt: -1 });
