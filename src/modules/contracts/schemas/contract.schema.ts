import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type ContractDocument = Contract & Document;

@Schema({ timestamps: true, collection: 'contracts' })
export class Contract {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Deal',
    required: true,
    unique: true,
    index: true,
  })
  dealId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  contractNumber: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  templateData: Record<string, any>;

  @Prop({ type: Date, required: true, default: Date.now })
  generatedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

ContractSchema.index({ organizationId: 1, generatedAt: -1 });
