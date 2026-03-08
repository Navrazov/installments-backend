"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcryptjs");
const user_schema_1 = require("../users/schemas/user.schema");
const BCRYPT_SALT_ROUNDS = 12;
let AuthService = AuthService_1 = class AuthService {
    constructor(userModel, jwtService, configService) {
        this.userModel = userModel;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(email, password) {
        const user = await this.validateUser(email, password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const tokens = await this.generateTokens(user);
        await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);
        await this.userModel
            .findByIdAndUpdate(user._id, { lastLoginAt: new Date() })
            .exec();
        this.logger.log(`User logged in: ${user.email}`);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                organizationId: user.organizationId,
            },
        };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.userModel
            .findById(userId)
            .select('+refreshToken')
            .lean()
            .exec();
        if (!user || !user.refreshToken) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('User account is deactivated');
        }
        const refreshTokenMatches = await this.comparePasswords(refreshToken, user.refreshToken);
        if (!refreshTokenMatches) {
            throw new common_1.ForbiddenException('Invalid refresh token');
        }
        const tokens = await this.generateTokens(user);
        await this.updateRefreshToken(userId, tokens.refreshToken);
        this.logger.log(`Tokens refreshed for user: ${user.email}`);
        return tokens;
    }
    async logout(userId) {
        await this.userModel
            .findByIdAndUpdate(userId, { refreshToken: null })
            .exec();
        this.logger.log(`User logged out: ${userId}`);
    }
    async validateUser(email, password) {
        const user = await this.userModel
            .findOne({ email: email.toLowerCase().trim() })
            .select('+passwordHash')
            .lean()
            .exec();
        if (!user) {
            return null;
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('User account is deactivated');
        }
        const isPasswordValid = await this.comparePasswords(password, user.passwordHash);
        if (!isPasswordValid) {
            return null;
        }
        const { passwordHash, refreshToken, ...result } = user;
        return result;
    }
    async hashPassword(password) {
        return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    }
    async comparePasswords(plainText, hashed) {
        return bcrypt.compare(plainText, hashed);
    }
    async generateTokens(user) {
        const payload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
            organizationId: user.organizationId?.toString(),
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async updateRefreshToken(userId, refreshToken) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_SALT_ROUNDS);
        await this.userModel
            .findByIdAndUpdate(userId, { refreshToken: hashedRefreshToken })
            .exec();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map