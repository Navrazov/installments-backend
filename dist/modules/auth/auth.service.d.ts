import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { UserDocument } from '../users/schemas/user.schema';
export declare class AuthService {
    private readonly userModel;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService, configService: ConfigService);
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
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
