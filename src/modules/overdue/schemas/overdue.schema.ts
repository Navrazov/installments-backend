import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OverdueStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  PROMISED = 'promised',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export type OverdueDocument = Overdue & Document;

@Schema({ timestamps: true, collection: 'overdues' })
export class Overdue {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Deal', required: true, index: true })
  dealId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
  clientId: Types.ObjectId;

  @Prop({ required: true, type: Number, min: 0 })
  overdueAmount: number;

  @Prop({ required: true, type: Number, min: 0 })
  overdueDays: number;

  @Prop({
    required: true,
    enum: OverdueStatus,
    default: OverdueStatus.NEW,
    index: true,
  })
  status: OverdueStatus;

  @Prop({ type: Date, default: null })
  lastContactDate: Date | null;

  @Prop({ type: Date, default: null })
  promisedPaymentDate: Date | null;

  @Prop({ trim: true, default: null })
  managerComment: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  assignedTo?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const OverdueSchema = SchemaFactory.createForClass(Overdue);

OverdueSchema.index({ organizationId: 1, status: 1 });
OverdueSchema.index({ organizationId: 1, clientId: 1 });
OverdueSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });
OverdueSchema.index({ organizationId: 1, overdueDays: -1 });
