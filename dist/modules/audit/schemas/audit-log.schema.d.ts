import { Document, Types } from 'mongoose';
export declare class AuditChanges {
    before: Record<string, any>;
    after: Record<string, any>;
}
export type AuditLogDocument = AuditLog & Document;
export declare class AuditLog {
    organizationId?: Types.ObjectId;
    userId: Types.ObjectId;
    userEmail: string;
    action: string;
    entity: string;
    entityId?: Types.ObjectId;
    changes: AuditChanges;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
}
export declare const AuditLogSchema: import("mongoose").Schema<AuditLog, import("mongoose").Model<AuditLog, any, any, any, Document<unknown, any, AuditLog, any, {}> & AuditLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AuditLog, Document<unknown, {}, import("mongoose").FlatRecord<AuditLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AuditLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
