import { Document, Types } from 'mongoose';
export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    ADMIN_PARTNER = "admin_partner",
    ORG_OWNER = "org_owner",
    ORG_MANAGER = "org_manager",
    ORG_EMPLOYEE = "org_employee"
}
export type UserDocument = User & Document;
export declare class User {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    organizationId?: Types.ObjectId;
    isActive: boolean;
    lastLoginAt: Date | null;
    invitedBy?: Types.ObjectId;
    refreshToken: string | null;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
