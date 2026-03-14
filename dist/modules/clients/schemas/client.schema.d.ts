import { Document, Types } from 'mongoose';
export declare enum RiskStatus {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical",
    BLACKLISTED = "blacklisted"
}
export declare class ClientPassport {
    series: string;
    number: string;
    issuedBy: string;
    issuedDate: Date;
    registrationAddress: string;
}
export type ClientDocument = Client & Document;
export declare class Client {
    organizationId: Types.ObjectId;
    firstName: string;
    lastName: string;
    middleName: string | null;
    phone: string;
    additionalPhones: string[];
    birthDate: Date | null;
    passport: ClientPassport;
    address: string | null;
    region: string | null;
    city: string | null;
    workplace: string | null;
    income: number | null;
    notes: string | null;
    tags: string[];
    riskStatus: RiskStatus;
    isBlacklisted: boolean;
    reputationScore: number;
    warningsCount: number;
    actualAddress: string | null;
    isGuarantor: boolean;
    guarantorFor: {
        clientId: Types.ObjectId;
        relationship: string;
    }[];
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ClientSchema: import("mongoose").Schema<Client, import("mongoose").Model<Client, any, any, any, Document<unknown, any, Client, any, {}> & Client & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Client, Document<unknown, {}, import("mongoose").FlatRecord<Client>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Client> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
