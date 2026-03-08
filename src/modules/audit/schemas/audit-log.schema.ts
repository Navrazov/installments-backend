import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class AuditChanges {
  before: Record<string, any>;
  after: Record<string, any>;
}

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: false, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: false, index: true })
  organizationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  userEmail: string;

  @Prop({ required: true, trim: true, index: true })
  action: string;

  @Prop({ required: true, trim: true, index: true })
  entity: string;

  @Prop({ type: Types.ObjectId, required: false })
  entityId?: Types.ObjectId;

  @Prop(
    raw({
      before: { type: Object, default: null },
      after: { type: Object, default: null },
    }),
  )
  changes: AuditChanges;

  @Prop({ type: String, trim: true, default: null })
  ipAddress: string | null;

  @Prop({ type: String, trim: true, default: null })
  userAgent: string | null;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, entity: 1, entityId: 1 });
AuditLogSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, action: 1, createdAt: -1 });
