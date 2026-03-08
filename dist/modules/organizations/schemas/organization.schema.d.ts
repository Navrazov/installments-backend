import { Document, Types } from 'mongoose';
export declare enum SubscriptionTier {
    BASIC = "basic",
    PRO = "pro",
    PREMIUM = "premium"
}
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    CANCELLED = "cancelled"
}
export declare class OrganizationBranch {
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
}
export declare class OrganizationSettings {
    currency: string;
    timezone: string;
    language: string;
}
export declare class OrganizationLimits {
    maxUsers: number;
    maxClients: number;
    maxDeals: number;
}
export type OrganizationDocument = Organization & Document;
export declare class Organization {
    name: string;
    slug: string;
    subscriptionTier: SubscriptionTier;
    subscriptionStatus: SubscriptionStatus;
    subscriptionExpiresAt?: Date;
    ownerId: Types.ObjectId;
    settings: OrganizationSettings;
    limits: OrganizationLimits;
    branches: OrganizationBranch[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const OrganizationSchema: import("mongoose").Schema<Organization, import("mongoose").Model<Organization, any, any, any, Document<unknown, any, Organization, any, {}> & Organization & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Organization, Document<unknown, {}, import("mongoose").FlatRecord<Organization>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Organization> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
