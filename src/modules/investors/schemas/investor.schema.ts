import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvestorDocument = Investor & Document;

@Schema({ timestamps: true, collection: 'investors' })
export class Investor {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ trim: true })
  middleName?: string;

  @Prop({ required: true, trim: true, index: true })
  phone: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const InvestorSchema = SchemaFactory.createForClass(Investor);
InvestorSchema.index({ organizationId: 1, isActive: 1 });
InvestorSchema.index({ organizationId: 1, createdAt: -1 });
