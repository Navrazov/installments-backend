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
var AuditInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const rxjs_1 = require("rxjs");
let AuditInterceptor = AuditInterceptor_1 = class AuditInterceptor {
    constructor(connection) {
        this.connection = connection;
        this.logger = new common_1.Logger(AuditInterceptor_1.name);
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();
        const handler = context.getHandler().name;
        const controller = context.getClass().name;
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
                const duration = Date.now() - startTime;
                const entry = this.buildAuditEntry(request, response.statusCode, handler, controller, duration);
                this.persistAuditLog(entry);
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                const statusCode = error?.status || error?.statusCode || 500;
                const entry = this.buildAuditEntry(request, statusCode, handler, controller, duration);
                entry.metadata = {
                    ...entry.metadata,
                    error: error?.message || 'Unknown error',
                };
                this.persistAuditLog(entry);
            },
        }));
    }
    buildAuditEntry(request, statusCode, handler, controller, duration) {
        return {
            userId: request.user?._id?.toString() || null,
            userRole: request.user?.role || null,
            orgId: request.user?.orgId?.toString() || request.org?._id?.toString() || null,
            action: handler,
            resource: controller,
            resourceId: request.params?.id || null,
            method: request.method,
            path: request.originalUrl,
            ip: String(request.headers['x-forwarded-for'] || request.ip || request.connection?.remoteAddress || 'unknown'),
            userAgent: request.headers['user-agent'] || 'unknown',
            statusCode,
            timestamp: new Date(),
            duration,
            metadata: {},
        };
    }
    async persistAuditLog(entry) {
        try {
            const collection = this.connection.collection('audit_logs');
            await collection.insertOne(entry);
        }
        catch (error) {
            this.logger.error(`Failed to persist audit log: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
        }
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = AuditInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Connection])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map