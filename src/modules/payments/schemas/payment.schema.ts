import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  OTHER = 'other',
}

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: false, collection: 'payments' })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Deal', required: true, index: true })
  dealId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
  clientId: Types.ObjectId;

  @Prop({ required: true, type: Number, min: 0 })
  amount: number;

  @Prop({ type: Date, required: true })
  paymentDate: Date;

  @Prop({
    required: true,
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Prop({ type: Date, required: false })
  scheduledDate?: Date;

  @Prop({ default: false })
  isEarly: boolean;

  @Prop({ required: true, type: Number, min: 0 })
  remainingAfterPayment: number;

  @Prop({ type: String, trim: true, default: null })
  comment: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ organizationId: 1, createdAt: -1 });
PaymentSchema.index({ organizationId: 1, dealId: 1, createdAt: -1 });
PaymentSchema.index({ organizationId: 1, clientId: 1, createdAt: -1 });
PaymentSchema.index({ organizationId: 1, paymentDate: -1 });
