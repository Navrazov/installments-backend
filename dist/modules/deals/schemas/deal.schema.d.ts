import { Document, Types } from 'mongoose';
export declare enum DealStatus {
    ACTIVE = "active",
    CLOSED = "closed",
    OVERDUE = "overdue",
    CANCELLED = "cancelled"
}
export declare enum PaymentScheduleStatus {
    PENDING = "pending",
    PAID = "paid",
    OVERDUE = "overdue",
    PARTIAL = "partial"
}
export declare class ScheduledPayment {
    date: Date;
    amount: number;
    status: PaymentScheduleStatus;
}
export type DealDocument = Deal & Document;
export declare class Deal {
    organizationId: Types.ObjectId;
    clientId: Types.ObjectId;
    dealNumber: string;
    productDescription: string;
    purchasePrice: number;
    salePrice: number;
    markup: number;
    markupPercent: number;
    downPayment: number;
    totalAmount: number;
    remainingAmount: number;
    termMonths: number;
    monthlyPayment: number;
    startDate: Date;
    endDate: Date;
    paymentSchedule: ScheduledPayment[];
    status: DealStatus;
    branchName: string | null;
    managerId: Types.ObjectId;
    guarantorId?: Types.ObjectId;
    comments: string | null;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DealSchema: import("mongoose").Schema<Deal, import("mongoose").Model<Deal, any, any, any, Document<unknown, any, Deal, any, {}> & Deal & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Deal, Document<unknown, {}, import("mongoose").FlatRecord<Deal>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Deal> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
