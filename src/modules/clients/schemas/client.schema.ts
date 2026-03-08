import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum RiskStatus {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  BLACKLISTED = 'blacklisted',
}

export class ClientPassport {
  series: string;
  number: string;
  issuedBy: string;
  issuedDate: Date;
  registrationAddress: string;
}

export type ClientDocument = Client & Document;

@Schema({ timestamps: true, collection: 'clients' })
export class Client {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ type: String, trim: true, default: null })
  middleName: string | null;

  @Prop({ required: true, trim: true, index: true })
  phone: string;

  @Prop({ type: [String], default: [] })
  additionalPhones: string[];

  @Prop({ type: Date, default: null })
  birthDate: Date | null;

  /**
   * IMPORTANT: All passport fields are stored ENCRYPTED at the application level.
   * Encryption/decryption must be handled in the service layer before persistence
   * and after retrieval. Never log or expose raw passport data.
   */
  @Prop(
    raw({
      series: { type: String, default: null },
      number: { type: String, default: null },
      issuedBy: { type: String, default: null },
      issuedDate: { type: Date, default: null },
      registrationAddress: { type: String, default: null },
    }),
  )
  passport: ClientPassport;

  @Prop({ type: String, trim: true, default: null })
  address: string | null;

  @Prop({ type: String, trim: true, default: null })
  region: string | null;

  @Prop({ type: String, trim: true, default: null })
  city: string | null;

  @Prop({ type: String, trim: true, default: null })
  workplace: string | null;

  @Prop({ type: Number, default: null })
  income: number | null;

  @Prop({ type: String, trim: true, default: null })
  notes: string | null;

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({
    required: true,
    enum: RiskStatus,
    default: RiskStatus.LOW,
    index: true,
  })
  riskStatus: RiskStatus;

  @Prop({ default: false, index: true })
  isBlacklisted: boolean;

  @Prop({ type: Number, default: 100, min: 0, max: 100 })
  reputationScore: number;

  @Prop({ type: Number, default: 0, min: 0 })
  warningsCount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

ClientSchema.index({ organizationId: 1, lastName: 1, firstName: 1 });
ClientSchema.index({ organizationId: 1, phone: 1 });
ClientSchema.index({ organizationId: 1, riskStatus: 1 });
ClientSchema.index({ organizationId: 1, isBlacklisted: 1 });
ClientSchema.index({ organizationId: 1, createdAt: -1 });
