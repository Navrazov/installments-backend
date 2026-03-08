import { Document, Types } from 'mongoose';
export declare enum WarningType {
    CHRONIC_OVERDUE = "chronic_overdue",
    NO_CONTACT = "no_contact",
    GUARANTOR_ISSUE = "guarantor_issue",
    SUSPICIOUS_DATA = "suspicious_data",
    FRAUD_ATTEMPT = "fraud_attempt",
    OTHER = "other"
}
export declare enum WarningSeverity {
    INFO = "info",
    WARNING = "warning",
    CRITICAL = "critical"
}
export type WarningDocument = Warning & Document;
export declare class Warning {
    organizationId: Types.ObjectId;
    clientId: Types.ObjectId;
    type: WarningType;
    severity: WarningSeverity;
    description: string;
    evidence: string | null;
    issuedBy: Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
}
export declare const WarningSchema: import("mongoose").Schema<Warning, import("mongoose").Model<Warning, any, any, any, Document<unknown, any, Warning, any, {}> & Warning & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Warning, Document<unknown, {}, import("mongoose").FlatRecord<Warning>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Warning> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
