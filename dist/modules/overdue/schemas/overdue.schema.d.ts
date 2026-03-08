import { Document, Types } from 'mongoose';
export declare enum OverdueStatus {
    NEW = "new",
    IN_PROGRESS = "in_progress",
    PROMISED = "promised",
    RESOLVED = "resolved",
    ESCALATED = "escalated"
}
export type OverdueDocument = Overdue & Document;
export declare class Overdue {
    organizationId: Types.ObjectId;
    dealId: Types.ObjectId;
    clientId: Types.ObjectId;
    overdueAmount: number;
    overdueDays: number;
    status: OverdueStatus;
    lastContactDate: Date | null;
    promisedPaymentDate: Date | null;
    managerComment: string | null;
    assignedTo?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const OverdueSchema: import("mongoose").Schema<Overdue, import("mongoose").Model<Overdue, any, any, any, Document<unknown, any, Overdue, any, {}> & Overdue & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Overdue, Document<unknown, {}, import("mongoose").FlatRecord<Overdue>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Overdue> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
