import { Document, Types } from 'mongoose';
export declare enum PaymentMethod {
    CASH = "cash",
    CARD = "card",
    TRANSFER = "transfer",
    OTHER = "other"
}
export type PaymentDocument = Payment & Document;
export declare class Payment {
    organizationId: Types.ObjectId;
    dealId: Types.ObjectId;
    clientId: Types.ObjectId;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    scheduledDate?: Date;
    isEarly: boolean;
    remainingAfterPayment: number;
    comment: string | null;
    createdBy: Types.ObjectId;
    createdAt: Date;
}
export declare const PaymentSchema: import("mongoose").Schema<Payment, import("mongoose").Model<Payment, any, any, any, Document<unknown, any, Payment, any, {}> & Payment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Payment, Document<unknown, {}, import("mongoose").FlatRecord<Payment>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Payment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
