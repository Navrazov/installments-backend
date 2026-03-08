import { Document, Types } from 'mongoose';
export declare class GuarantorPassport {
    series: string;
    number: string;
    issuedBy: string;
    issuedDate: Date;
    registrationAddress: string;
}
export type GuarantorDocument = Guarantor & Document;
export declare class Guarantor {
    organizationId: Types.ObjectId;
    clientId: Types.ObjectId;
    firstName: string;
    lastName: string;
    middleName: string | null;
    phone: string;
    relationship: string;
    passport: GuarantorPassport;
    address: string | null;
    notes: string | null;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const GuarantorSchema: import("mongoose").Schema<Guarantor, import("mongoose").Model<Guarantor, any, any, any, Document<unknown, any, Guarantor, any, {}> & Guarantor & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Guarantor, Document<unknown, {}, import("mongoose").FlatRecord<Guarantor>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Guarantor> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
