import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN_PARTNER = 'admin_partner',
  ORG_OWNER = 'org_owner',
  ORG_MANAGER = 'org_manager',
  ORG_EMPLOYEE = 'org_employee',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({
    required: true,
    enum: UserRole,
    default: UserRole.ORG_EMPLOYEE,
    index: true,
  })
  role: UserRole;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: false,
    index: true,
  })
  organizationId?: Types.ObjectId;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  invitedBy?: Types.ObjectId;

  @Prop({ default: null, select: false })
  refreshToken: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ organizationId: 1, role: 1 });
UserSchema.index({ organizationId: 1, isActive: 1 });
