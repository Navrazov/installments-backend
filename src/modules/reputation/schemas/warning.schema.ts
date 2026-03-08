/**
 * LEGAL NOTICE:
 * This module handles personal data warnings and reputation tracking.
 * It MUST undergo a thorough legal review for compliance with applicable
 * personal data protection laws (including but not limited to Federal Law
 * No. 152-FZ "On Personal Data" in Russia, GDPR if applicable) BEFORE
 * any production deployment. Storing and processing risk assessments,
 * warnings, and reputation data about individuals carries significant
 * legal obligations regarding consent, data minimization, accuracy,
 * and the right to contest automated decisions.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum WarningType {
  CHRONIC_OVERDUE = 'chronic_overdue',
  NO_CONTACT = 'no_contact',
  GUARANTOR_ISSUE = 'guarantor_issue',
  SUSPICIOUS_DATA = 'suspicious_data',
  FRAUD_ATTEMPT = 'fraud_attempt',
  OTHER = 'other',
}

export enum WarningSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export type WarningDocument = Warning & Document;

@Schema({ timestamps: false, collection: 'warnings' })
export class Warning {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
  clientId: Types.ObjectId;

  @Prop({
    required: true,
    enum: WarningType,
    index: true,
  })
  type: WarningType;

  @Prop({
    required: true,
    enum: WarningSeverity,
    default: WarningSeverity.WARNING,
    index: true,
  })
  severity: WarningSeverity;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: String, trim: true, default: null })
  evidence: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  issuedBy: Types.ObjectId;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;
}

export const WarningSchema = SchemaFactory.createForClass(Warning);

WarningSchema.index({ organizationId: 1, clientId: 1, isActive: 1 });
WarningSchema.index({ organizationId: 1, type: 1, severity: 1 });
WarningSchema.index({ organizationId: 1, createdAt: -1 });
