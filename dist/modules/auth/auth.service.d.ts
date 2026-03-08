import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { UserDocument } from '../users/schemas/user.schema';
import { OrganizationDocument } from '../organizations/schemas/organization.schema';
export declare class AuthService {
    private readonly userModel;
    private readonly organizationModel;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(userModel: Model<UserDocument>, organizationModel: Model<OrganizationDocument>, jwtService: JwtService, configService: ConfigService);
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
        organizationTier?: string;
    }>;
    getMe(userId: string): Promise<import("mongoose").FlattenMaps<UserDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    validateUser(email: string, password: string): Promise<any | null>;
    hashPassword(password: string): Promise<string>;
    comparePasswords(plainText: string, hashed: string): Promise<boolean>;
    private generateTokens;
    private updateRefreshToken;
}
