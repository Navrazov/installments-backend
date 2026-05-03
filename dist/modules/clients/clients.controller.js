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
exports.ClientsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const clients_service_1 = require("./clients.service");
const create_client_dto_1 = require("./dto/create-client.dto");
const update_client_dto_1 = require("./dto/update-client.dto");
const query_client_dto_1 = require("./dto/query-client.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_1 = require("../../common/constants/roles");
const client_schema_1 = require("./schemas/client.schema");
class UpdateRiskStatusBody {
}
__decorate([
    (0, class_validator_1.IsEnum)(client_schema_1.RiskStatus),
    __metadata("design:type", String)
], UpdateRiskStatusBody.prototype, "riskStatus", void 0);
let ClientsController = class ClientsController {
    constructor(clientsService) {
        this.clientsService = clientsService;
    }
    async create(req, dto) {
        const orgId = req.user.organizationId;
        const userId = req.user._id;
        return this.clientsService.create(orgId, dto, userId);
    }
    async findAll(req, query) {
        const orgId = req.user.organizationId;
        return this.clientsService.findAll(orgId, query);
    }
    async exportClients(req) {
        const orgId = req.user.organizationId;
        return this.clientsService.exportClients(orgId);
    }
    async search(req, q) {
        const orgId = req.user.organizationId;
        return this.clientsService.search(orgId, q);
    }
    async findById(req, id) {
        const orgId = req.user.organizationId;
        return this.clientsService.findById(orgId, id);
    }
    async getGuarantors(req, id) {
        const orgId = req.user.organizationId;
        return this.clientsService.getGuarantorsForClient(orgId, id);
    }
    async getClientHistory(req, id) {
        const orgId = req.user.organizationId;
        return this.clientsService.getClientHistory(orgId, id);
    }
    async update(req, id, dto) {
        const orgId = req.user.organizationId;
        const userId = req.user._id;
        return this.clientsService.update(orgId, id, dto, userId);
    }
    async toggleBlacklist(req, id, blacklisted) {
        const orgId = req.user.organizationId;
        const userId = req.user._id;
        if (blacklisted) {
            return this.clientsService.addToBlacklist(orgId, id, userId);
        }
        return this.clientsService.removeFromBlacklist(orgId, id, userId);
    }
    async addGuarantor(req, clientId, body) {
        const orgId = req.user.organizationId;
        return this.clientsService.addGuarantor(orgId, clientId, body.guarantorId, body.relationship);
    }
    async removeGuarantor(req, clientId, body) {
        const orgId = req.user.organizationId;
        return this.clientsService.removeGuarantor(orgId, clientId, body.guarantorId);
    }
    async importClients(req, body) {
        if (!Array.isArray(body.clients) || body.clients.length === 0) {
            throw new common_1.BadRequestException('clients array is required and cannot be empty');
        }
        if (body.clients.length > 1000) {
            throw new common_1.BadRequestException('Cannot import more than 1000 clients at once');
        }
        const orgId = req.user.organizationId;
        const userId = req.user._id;
        return this.clientsService.importClients(orgId, body.clients, userId);
    }
    async updateRiskStatus(req, id, body) {
        const orgId = req.user.organizationId;
        const userId = req.user._id;
        return this.clientsService.updateRiskStatus(orgId, id, body.riskStatus, userId);
    }
};
exports.ClientsController = ClientsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_client_dto_1.CreateClientDto]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_client_dto_1.QueryClientDto]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('export/all'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.MANAGER, roles_1.UserRole.ORG_MANAGER, roles_1.UserRole.ORG_OWNER, roles_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "exportClients", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/guarantors'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "getGuarantors", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "getClientHistory", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_client_dto_1.UpdateClientDto]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/blacklist'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('blacklisted')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "toggleBlacklist", null);
__decorate([
    (0, common_1.Post)(':id/add-guarantor'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "addGuarantor", null);
__decorate([
    (0, common_1.Post)(':id/remove-guarantor'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "removeGuarantor", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.MANAGER, roles_1.UserRole.ORG_MANAGER, roles_1.UserRole.ORG_OWNER, roles_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "importClients", null);
__decorate([
    (0, common_1.Patch)(':id/risk-status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateRiskStatusBody]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "updateRiskStatus", null);
exports.ClientsController = ClientsController = __decorate([
    (0, common_1.Controller)('clients'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [clients_service_1.ClientsService])
], ClientsController);
//# sourceMappingURL=clients.controller.js.map