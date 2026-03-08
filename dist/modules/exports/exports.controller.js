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
exports.ExportsController = void 0;
const common_1 = require("@nestjs/common");
const exports_service_1 = require("./exports.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const report_query_dto_1 = require("../reports/dto/report-query.dto");
let ExportsController = class ExportsController {
    constructor(exportsService) {
        this.exportsService = exportsService;
    }
    async exportClientsPdf(req, res, query) {
        const buffer = await this.exportsService.exportClientsToPdf(req.user.organizationId.toString(), query);
        this.sendPdf(res, buffer, 'clients');
    }
    async exportClientsExcel(req, res, query) {
        const buffer = await this.exportsService.exportClientsToExcel(req.user.organizationId.toString(), query);
        this.sendExcel(res, buffer, 'clients');
    }
    async exportDealsPdf(req, res, query) {
        const buffer = await this.exportsService.exportDealsToPdf(req.user.organizationId.toString(), query);
        this.sendPdf(res, buffer, 'deals');
    }
    async exportDealsExcel(req, res, query) {
        const buffer = await this.exportsService.exportDealsToExcel(req.user.organizationId.toString(), query);
        this.sendExcel(res, buffer, 'deals');
    }
    async exportPaymentsPdf(req, res, query) {
        const buffer = await this.exportsService.exportPaymentsToPdf(req.user.organizationId.toString(), query);
        this.sendPdf(res, buffer, 'payments');
    }
    async exportPaymentsExcel(req, res, query) {
        const buffer = await this.exportsService.exportPaymentsToExcel(req.user.organizationId.toString(), query);
        this.sendExcel(res, buffer, 'payments');
    }
    async exportReportPdf(req, res, type, query) {
        const buffer = await this.exportsService.exportReportToPdf(req.user.organizationId.toString(), type, {
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
            monthsBack: query.monthsBack ? Number(query.monthsBack) : undefined,
        });
        this.sendPdf(res, buffer, `report-${type}`);
    }
    async exportReportExcel(req, res, type, query) {
        const buffer = await this.exportsService.exportReportToExcel(req.user.organizationId.toString(), type, {
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
            monthsBack: query.monthsBack ? Number(query.monthsBack) : undefined,
        });
        this.sendExcel(res, buffer, `report-${type}`);
    }
    sendPdf(res, buffer, filename) {
        const timestamp = new Date().toISOString().slice(0, 10);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}_${timestamp}.pdf"`,
            'Content-Length': buffer.length,
            'Cache-Control': 'no-cache',
        });
        res.end(buffer);
    }
    sendExcel(res, buffer, filename) {
        const timestamp = new Date().toISOString().slice(0, 10);
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}_${timestamp}.xlsx"`,
            'Content-Length': buffer.length,
            'Cache-Control': 'no-cache',
        });
        res.end(buffer);
    }
};
exports.ExportsController = ExportsController;
__decorate([
    (0, common_1.Get)('clients/pdf'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportClientsPdf", null);
__decorate([
    (0, common_1.Get)('clients/excel'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportClientsExcel", null);
__decorate([
    (0, common_1.Get)('deals/pdf'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportDealsPdf", null);
__decorate([
    (0, common_1.Get)('deals/excel'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportDealsExcel", null);
__decorate([
    (0, common_1.Get)('payments/pdf'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportPaymentsPdf", null);
__decorate([
    (0, common_1.Get)('payments/excel'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportPaymentsExcel", null);
__decorate([
    (0, common_1.Get)('reports/:type/pdf'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)('type')),
    __param(3, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportReportPdf", null);
__decorate([
    (0, common_1.Get)('reports/:type/excel'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)('type')),
    __param(3, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportReportExcel", null);
exports.ExportsController = ExportsController = __decorate([
    (0, common_1.Controller)('exports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [exports_service_1.ExportsService])
], ExportsController);
//# sourceMappingURL=exports.controller.js.map