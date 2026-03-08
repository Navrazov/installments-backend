import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Model } from 'mongoose';
import { UserDocument } from '../../users/schemas/user.schema';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    organizationId?: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly userModel;
    constructor(configService: ConfigService, userModel: Model<UserDocument>);
    validate(payload: JwtPayload): Promise<{
        _id: import("mongoose").Types.ObjectId;
        email: string;
        firstName: string;
        lastName: string;
        role: import("../../users/schemas/user.schema").UserRole;
        organizationId: import("mongoose").Types.ObjectId | undefined;
        isActive: true;
    }>;
}
export {};
