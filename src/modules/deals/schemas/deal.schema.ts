import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DealStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PaymentScheduleStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
}

export class ScheduledPayment {
  date: Date;
  amount: number;
  status: PaymentScheduleStatus;
}

export type DealDocument = Deal & Document;

@Schema({ timestamps: true, collection: 'deals' })
export class Deal {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
  clientId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  dealNumber: string;

  @Prop({ required: true, trim: true })
  productDescription: string;

  @Prop({ required: true, type: Number, min: 0 })
  purchasePrice: number;

  @Prop({ required: true, type: Number, min: 0 })
  salePrice: number;

  @Prop({ required: true, type: Number, min: 0 })
  markup: number;

  @Prop({ required: true, type: Number, min: 0 })
  markupPercent: number;

  @Prop({ required: true, type: Number, min: 0 })
  downPayment: number;

  @Prop({ required: true, type: Number, min: 0 })
  totalAmount: number;

  @Prop({ required: true, type: Number, min: 0 })
  remainingAmount: number;

  @Prop({ required: true, type: Number, min: 1 })
  termMonths: number;

  @Prop({ required: true, type: Number, min: 0 })
  monthlyPayment: number;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  firstPaymentDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({
    type: [
      {
        date: { type: Date, required: true },
        amount: { type: Number, required: true, min: 0 },
        status: {
          type: String,
          enum: Object.values(PaymentScheduleStatus),
          default: PaymentScheduleStatus.PENDING,
        },
      },
    ],
    default: [],
  })
  paymentSchedule: ScheduledPayment[];

  @Prop({
    required: true,
    enum: DealStatus,
    default: DealStatus.ACTIVE,
    index: true,
  })
  status: DealStatus;

  @Prop({ type: String, trim: true, default: null })
  branchName: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  managerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Guarantor', required: false })
  guarantorId?: Types.ObjectId;

  @Prop({ type: String, trim: true, default: null })
  comments: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const DealSchema = SchemaFactory.createForClass(Deal);

DealSchema.index({ organizationId: 1, status: 1 });
DealSchema.index({ organizationId: 1, clientId: 1, status: 1 });
DealSchema.index({ organizationId: 1, managerId: 1 });
DealSchema.index({ organizationId: 1, createdAt: -1 });
DealSchema.index({ organizationId: 1, endDate: 1, status: 1 });
