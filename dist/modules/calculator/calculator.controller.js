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
exports.CalculatorController = void 0;
const common_1 = require("@nestjs/common");
const calculator_service_1 = require("./calculator.service");
const calculate_dto_1 = require("./dto/calculate.dto");
let CalculatorController = class CalculatorController {
    constructor(calculatorService) {
        this.calculatorService = calculatorService;
    }
    calculateBySalePrice(dto) {
        return this.calculatorService.calculateBySalePrice(dto.salePrice, dto.downPayment, dto.termMonths, dto.startDate);
    }
    calculateByPurchasePrice(dto) {
        return this.calculatorService.calculateByPurchasePrice(dto.purchasePrice, dto.markupPercent, dto.downPayment, dto.termMonths, dto.startDate);
    }
    calculateByMonthlyPayment(dto) {
        return this.calculatorService.calculateByMonthlyPayment(dto.salePrice, dto.downPayment, dto.desiredMonthlyPayment, dto.startDate);
    }
};
exports.CalculatorController = CalculatorController;
__decorate([
    (0, common_1.Post)('by-sale-price'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_dto_1.CalculateBySalePriceDto]),
    __metadata("design:returntype", void 0)
], CalculatorController.prototype, "calculateBySalePrice", null);
__decorate([
    (0, common_1.Post)('by-purchase-price'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_dto_1.CalculateByPurchasePriceDto]),
    __metadata("design:returntype", void 0)
], CalculatorController.prototype, "calculateByPurchasePrice", null);
__decorate([
    (0, common_1.Post)('by-monthly-payment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_dto_1.CalculateByMonthlyPaymentDto]),
    __metadata("design:returntype", void 0)
], CalculatorController.prototype, "calculateByMonthlyPayment", null);
exports.CalculatorController = CalculatorController = __decorate([
    (0, common_1.Controller)('calculator'),
    __metadata("design:paramtypes", [calculator_service_1.CalculatorService])
], CalculatorController);
//# sourceMappingURL=calculator.controller.js.map