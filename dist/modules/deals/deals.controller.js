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
exports.DealsController = void 0;
const common_1 = require("@nestjs/common");
const deals_service_1 = require("./deals.service");
const create_deal_dto_1 = require("./dto/create-deal.dto");
const update_deal_dto_1 = require("./dto/update-deal.dto");
const query_deal_dto_1 = require("./dto/query-deal.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let DealsController = class DealsController {
    constructor(dealsService) {
        this.dealsService = dealsService;
    }
    async create(req, dto) {
        const orgId = req.user.organizationId;
        const userId = req.user._id;
        return this.dealsService.create(orgId, dto, userId);
    }
    async getStats(req) {
        const orgId = req.user.organizationId;
        return this.dealsService.getStats(orgId);
    }
    async findAll(req, query) {
        const orgId = req.user.organizationId;
        return this.dealsService.findAll(orgId, query);
    }
    async findById(req, id) {
        const orgId = req.user.organizationId;
        return this.dealsService.findById(orgId, id);
    }
    async update(req, id, dto) {
        const orgId = req.user.organizationId;
        const userId = req.user._id;
        return this.dealsService.update(orgId, id, dto, userId);
    }
    async cancel(req, id) {
        const orgId = req.user.organizationId;
        const userId = req.user._id;
        return this.dealsService.cancel(orgId, id, userId);
    }
    async close(req, id) {
        const orgId = req.user.organizationId;
        const userId = req.user._id;
        return this.dealsService.close(orgId, id, userId);
    }
};
exports.DealsController = DealsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_deal_dto_1.CreateDealDto]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_deal_dto_1.QueryDealDto]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_deal_dto_1.UpdateDealDto]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/close'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "close", null);
exports.DealsController = DealsController = __decorate([
    (0, common_1.Controller)('deals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [deals_service_1.DealsService])
], DealsController);
//# sourceMappingURL=deals.controller.js.map