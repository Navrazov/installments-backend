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
exports.OverdueController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const overdue_service_1 = require("./overdue.service");
const update_overdue_dto_1 = require("./dto/update-overdue.dto");
const query_overdue_dto_1 = require("./dto/query-overdue.dto");
let OverdueController = class OverdueController {
    constructor(overdueService) {
        this.overdueService = overdueService;
    }
    async findAll(req, query) {
        const orgId = req.user.organizationId.toString();
        await this.overdueService.syncOverdueFromDeals(orgId);
        return this.overdueService.findAll(orgId, query);
    }
    async getStats(req) {
        const orgId = req.user.organizationId.toString();
        await this.overdueService.syncOverdueFromDeals(orgId);
        return this.overdueService.getStats(orgId);
    }
    async findById(req, id) {
        const orgId = req.user.organizationId.toString();
        return this.overdueService.findById(orgId, id);
    }
    async updateStatus(req, id, dto) {
        const orgId = req.user.organizationId.toString();
        const userId = req.user._id.toString();
        return this.overdueService.updateStatus(orgId, id, dto, userId);
    }
    async resolve(req, id) {
        const orgId = req.user.organizationId.toString();
        const userId = req.user._id.toString();
        return this.overdueService.resolve(orgId, id, userId);
    }
    async syncFromDeals(req) {
        const orgId = req.user.organizationId.toString();
        return this.overdueService.syncOverdueFromDeals(orgId);
    }
};
exports.OverdueController = OverdueController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_overdue_dto_1.QueryOverdueDto]),
    __metadata("design:returntype", Promise)
], OverdueController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OverdueController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OverdueController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_overdue_dto_1.UpdateOverdueDto]),
    __metadata("design:returntype", Promise)
], OverdueController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/resolve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OverdueController.prototype, "resolve", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OverdueController.prototype, "syncFromDeals", null);
exports.OverdueController = OverdueController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('overdue'),
    __metadata("design:paramtypes", [overdue_service_1.OverdueService])
], OverdueController);
//# sourceMappingURL=overdue.controller.js.map