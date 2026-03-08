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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const report_query_dto_1 = require("./dto/report-query.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getDashboard(req) {
        return this.reportsService.getDashboardSummary(req.user.organizationId.toString());
    }
    async getDealsReport(req, query) {
        return this.reportsService.getDealsReport(req.user.organizationId.toString(), query.dateFrom, query.dateTo);
    }
    async getPaymentsReport(req, query) {
        return this.reportsService.getPaymentsReport(req.user.organizationId.toString(), query.dateFrom, query.dateTo);
    }
    async getOverdueReport(req) {
        return this.reportsService.getOverdueReport(req.user.organizationId.toString());
    }
    async getClientsReport(req) {
        return this.reportsService.getClientsReport(req.user.organizationId.toString());
    }
    async getManagerPerformance(req, query) {
        return this.reportsService.getManagerPerformance(req.user.organizationId.toString(), query.dateFrom, query.dateTo);
    }
    async getBranchPerformance(req, query) {
        return this.reportsService.getBranchPerformance(req.user.organizationId.toString(), query.dateFrom, query.dateTo);
    }
    async getMonthlyDynamics(req, query) {
        return this.reportsService.getMonthlyDynamics(req.user.organizationId.toString(), query.monthsBack);
    }
    async getDownPaymentAnalysis(req) {
        return this.reportsService.getDownPaymentAnalysis(req.user.organizationId.toString());
    }
    async getTermDistribution(req) {
        return this.reportsService.getTermDistribution(req.user.organizationId.toString());
    }
    async getCollectionEfficiency(req, query) {
        return this.reportsService.getCollectionEfficiency(req.user.organizationId.toString(), query.dateFrom, query.dateTo);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('deals'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDealsReport", null);
__decorate([
    (0, common_1.Get)('payments'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPaymentsReport", null);
__decorate([
    (0, common_1.Get)('overdue'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getOverdueReport", null);
__decorate([
    (0, common_1.Get)('clients'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getClientsReport", null);
__decorate([
    (0, common_1.Get)('managers'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getManagerPerformance", null);
__decorate([
    (0, common_1.Get)('branches'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getBranchPerformance", null);
__decorate([
    (0, common_1.Get)('dynamics'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, report_query_dto_1.DynamicsQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getMonthlyDynamics", null);
__decorate([
    (0, common_1.Get)('down-payments'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDownPaymentAnalysis", null);
__decorate([
    (0, common_1.Get)('terms'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTermDistribution", null);
__decorate([
    (0, common_1.Get)('collection-efficiency'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCollectionEfficiency", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map