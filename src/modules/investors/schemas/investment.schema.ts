import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum InvestmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export type InvestmentDocument = Investment & Document;

@Schema({ timestamps: true, collection: 'investments' })
export class Investment {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Investor', required: true, index: true })
  investorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Deal', required: true, index: true })
  dealId: Types.ObjectId;

  /** Сумма, вложенная инвестором (обычно = purchasePrice сделки) */
  @Prop({ required: true, type: Number, min: 0 })
  investedAmount: number;

  /** Доля инвестора в прибыли (наценке), % — например 70 */
  @Prop({ required: true, type: Number, min: 0, max: 100 })
  profitSharePercent: number;

  /** Статус инвестиции (рассчитывается автоматически по статусу сделки) */
  @Prop({
    type: String,
    enum: InvestmentStatus,
    default: InvestmentStatus.ACTIVE,
    index: true,
  })
  status: InvestmentStatus;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const InvestmentSchema = SchemaFactory.createForClass(Investment);
InvestmentSchema.index({ organizationId: 1, investorId: 1 });
InvestmentSchema.index({ organizationId: 1, dealId: 1 }, { unique: true });
InvestmentSchema.index({ organizationId: 1, status: 1 });
