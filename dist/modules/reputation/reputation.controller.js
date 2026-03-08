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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReputationController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const reputation_service_1 = require("./reputation.service");
const create_warning_dto_1 = require("./dto/create-warning.dto");
let ReputationController = class ReputationController {
    constructor(reputationService) {
        this.reputationService = reputationService;
    }
    async addWarning(req, dto) {
        const orgId = req.user.organizationId.toString();
        const userId = req.user._id.toString();
        return this.reputationService.addWarning(orgId, dto, userId);
    }
    async findClientWarnings(req, clientId) {
        const orgId = req.user.organizationId.toString();
        return this.reputationService.findWarnings(orgId, clientId);
    }
    async findAllWarnings(req, page, limit, type, severity, isActive, clientId) {
        const orgId = req.user.organizationId.toString();
        return this.reputationService.findAllWarnings(orgId, {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            type,
            severity,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            clientId,
        });
    }
    async deactivateWarning(req, id) {
        const orgId = req.user.organizationId.toString();
        const userId = req.user._id.toString();
        return this.reputationService.deactivateWarning(orgId, id, userId);
    }
    async getClientReputationSummary(req, clientId) {
        const orgId = req.user.organizationId.toString();
        return this.reputationService.getClientReputationSummary(orgId, clientId);
    }
};
exports.ReputationController = ReputationController;
__decorate([
    (0, common_1.Post)('warnings'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_warning_dto_1.CreateWarningDto]),
    __metadata("design:returntype", Promise)
], ReputationController.prototype, "addWarning", null);
__decorate([
    (0, common_1.Get)('warnings/client/:clientId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReputationController.prototype, "findClientWarnings", null);
__decorate([
    (0, common_1.Get)('warnings'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('severity')),
    __param(5, (0, common_1.Query)('isActive')),
    __param(6, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReputationController.prototype, "findAllWarnings", null);
__decorate([
    (0, common_1.Patch)('warnings/:id/deactivate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReputationController.prototype, "deactivateWarning", null);
__decorate([
    (0, common_1.Get)('summary/:clientId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReputationController.prototype, "getClientReputationSummary", null);
exports.ReputationController = ReputationController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('reputation'),
    __metadata("design:paramtypes", [reputation_service_1.ReputationService])
], ReputationController);
//# sourceMappingURL=reputation.controller.js.map