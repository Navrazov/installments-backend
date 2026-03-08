import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SubscriptionTier {
  BASIC = 'basic',
  PRO = 'pro',
  PREMIUM = 'premium',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export class OrganizationBranch {
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export class OrganizationSettings {
  currency: string;
  timezone: string;
  language: string;
}

export class OrganizationLimits {
  maxUsers: number;
  maxClients: number;
  maxDeals: number;
}

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true, collection: 'organizations' })
export class Organization {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  slug: string;

  @Prop({
    required: true,
    enum: SubscriptionTier,
    default: SubscriptionTier.BASIC,
  })
  subscriptionTier: SubscriptionTier;

  @Prop({
    required: true,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
    index: true,
  })
  subscriptionStatus: SubscriptionStatus;

  @Prop({ type: Date, required: false })
  subscriptionExpiresAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop(
    raw({
      currency: { type: String, default: 'RUB' },
      timezone: { type: String, default: 'Europe/Moscow' },
      language: { type: String, default: 'ru' },
    }),
  )
  settings: OrganizationSettings;

  @Prop(
    raw({
      maxUsers: { type: Number, default: 5 },
      maxClients: { type: Number, default: 500 },
      maxDeals: { type: Number, default: 1000 },
    }),
  )
  limits: OrganizationLimits;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: false },
        isActive: { type: Boolean, default: true },
      },
    ],
    default: [],
  })
  branches: OrganizationBranch[];

  @Prop({ default: true, index: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

OrganizationSchema.index({ subscriptionStatus: 1, subscriptionExpiresAt: 1 });
