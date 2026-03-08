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
exports.GuarantorsController = void 0;
const common_1 = require("@nestjs/common");
const guarantors_service_1 = require("./guarantors.service");
const create_guarantor_dto_1 = require("./dto/create-guarantor.dto");
const update_guarantor_dto_1 = require("./dto/update-guarantor.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let GuarantorsController = class GuarantorsController {
    constructor(guarantorsService) {
        this.guarantorsService = guarantorsService;
    }
    async create(req, dto) {
        const orgId = req.user.organizationId;
        const userId = req.user._id;
        return this.guarantorsService.create(orgId, dto, userId);
    }
    async findAll(req, page, limit) {
        const orgId = req.user.organizationId;
        return this.guarantorsService.findAll(orgId, Number(page) || 1, Number(limit) || 20);
    }
    async findByClientId(req, clientId) {
        const orgId = req.user.organizationId;
        return this.guarantorsService.findByClientId(orgId, clientId);
    }
    async findById(req, id) {
        const orgId = req.user.organizationId;
        return this.guarantorsService.findById(orgId, id);
    }
    async update(req, id, dto) {
        const orgId = req.user.organizationId;
        const userId = req.user._id;
        return this.guarantorsService.update(orgId, id, dto, userId);
    }
    async remove(req, id) {
        const orgId = req.user.organizationId;
        return this.guarantorsService.remove(orgId, id);
    }
};
exports.GuarantorsController = GuarantorsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_guarantor_dto_1.CreateGuarantorDto]),
    __metadata("design:returntype", Promise)
], GuarantorsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], GuarantorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('by-client/:clientId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GuarantorsController.prototype, "findByClientId", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GuarantorsController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_guarantor_dto_1.UpdateGuarantorDto]),
    __metadata("design:returntype", Promise)
], GuarantorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GuarantorsController.prototype, "remove", null);
exports.GuarantorsController = GuarantorsController = __decorate([
    (0, common_1.Controller)('guarantors'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [guarantors_service_1.GuarantorsService])
], GuarantorsController);
//# sourceMappingURL=guarantors.controller.js.map