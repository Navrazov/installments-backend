"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatorService = void 0;
const common_1 = require("@nestjs/common");
let CalculatorService = class CalculatorService {
    calculateBySalePrice(salePrice, downPayment, termMonths, startDate) {
        this.validateInputs(salePrice, downPayment, termMonths);
        const salePriceKop = Math.round(salePrice * 100);
        const downPaymentKop = Math.round(downPayment * 100);
        const remainingKop = salePriceKop - downPaymentKop;
        if (remainingKop < 0) {
            throw new common_1.BadRequestException('Первоначальный взнос не может превышать цену продажи');
        }
        const monthlyPaymentKop = Math.floor(remainingKop / termMonths);
        const lastPaymentKop = remainingKop - monthlyPaymentKop * (termMonths - 1);
        const start = startDate ? new Date(startDate) : new Date();
        const schedule = this.generateScheduleInternal(start, termMonths, monthlyPaymentKop, lastPaymentKop, remainingKop);
        return {
            monthlyPayment: this.kopToRub(monthlyPaymentKop),
            totalAmount: this.kopToRub(salePriceKop),
            remainingAmount: this.kopToRub(remainingKop),
            schedule,
        };
    }
    calculateByPurchasePrice(purchasePrice, markupPercent, downPayment, termMonths, startDate) {
        if (purchasePrice <= 0) {
            throw new common_1.BadRequestException('Закупочная цена должна быть больше нуля');
        }
        if (markupPercent < 0) {
            throw new common_1.BadRequestException('Процент наценки не может быть отрицательным');
        }
        const purchasePriceKop = Math.round(purchasePrice * 100);
        const markupKop = Math.round(purchasePriceKop * markupPercent / 100);
        const salePriceKop = purchasePriceKop + markupKop;
        const salePrice = this.kopToRub(salePriceKop);
        this.validateInputs(salePrice, downPayment, termMonths);
        const downPaymentKop = Math.round(downPayment * 100);
        const remainingKop = salePriceKop - downPaymentKop;
        if (remainingKop < 0) {
            throw new common_1.BadRequestException('Первоначальный взнос не может превышать цену продажи');
        }
        const monthlyPaymentKop = Math.floor(remainingKop / termMonths);
        const lastPaymentKop = remainingKop - monthlyPaymentKop * (termMonths - 1);
        const start = startDate ? new Date(startDate) : new Date();
        const schedule = this.generateScheduleInternal(start, termMonths, monthlyPaymentKop, lastPaymentKop, remainingKop);
        return {
            salePrice,
            markup: this.kopToRub(markupKop),
            monthlyPayment: this.kopToRub(monthlyPaymentKop),
            totalAmount: this.kopToRub(salePriceKop),
            remainingAmount: this.kopToRub(remainingKop),
            schedule,
        };
    }
    calculateByMonthlyPayment(salePrice, downPayment, desiredMonthlyPayment, startDate) {
        if (salePrice <= 0) {
            throw new common_1.BadRequestException('Цена продажи должна быть больше нуля');
        }
        if (desiredMonthlyPayment <= 0) {
            throw new common_1.BadRequestException('Ежемесячный платеж должен быть больше нуля');
        }
        const salePriceKop = Math.round(salePrice * 100);
        const downPaymentKop = Math.round(downPayment * 100);
        const desiredMonthlyKop = Math.round(desiredMonthlyPayment * 100);
        const remainingKop = salePriceKop - downPaymentKop;
        if (remainingKop <= 0) {
            throw new common_1.BadRequestException('Первоначальный взнос не может превышать цену продажи');
        }
        const termMonths = Math.ceil(remainingKop / desiredMonthlyKop);
        if (termMonths > 120) {
            throw new common_1.BadRequestException('Рассчитанный срок превышает 120 месяцев. Увеличьте ежемесячный платеж или уменьшите сумму.');
        }
        const monthlyPaymentKop = Math.floor(remainingKop / termMonths);
        const lastPaymentKop = remainingKop - monthlyPaymentKop * (termMonths - 1);
        const start = startDate ? new Date(startDate) : new Date();
        const schedule = this.generateScheduleInternal(start, termMonths, monthlyPaymentKop, lastPaymentKop, remainingKop);
        return {
            termMonths,
            monthlyPayment: this.kopToRub(monthlyPaymentKop),
            totalAmount: this.kopToRub(salePriceKop),
            remainingAmount: this.kopToRub(remainingKop),
            schedule,
        };
    }
    generateSchedule(startDate, termMonths, monthlyPayment) {
        const monthlyKop = Math.round(monthlyPayment * 100);
        const totalKop = monthlyKop * termMonths;
        return this.generateScheduleInternal(startDate, termMonths, monthlyKop, monthlyKop, totalKop);
    }
    generateScheduleInternal(startDate, termMonths, monthlyPaymentKop, lastPaymentKop, totalRemainingKop) {
        const schedule = [];
        let cumulativeKop = 0;
        let remainingKop = totalRemainingKop;
        for (let i = 0; i < termMonths; i++) {
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(paymentDate.getMonth() + i + 1);
            const isLast = i === termMonths - 1;
            const amountKop = isLast ? lastPaymentKop : monthlyPaymentKop;
            cumulativeKop += amountKop;
            remainingKop -= amountKop;
            schedule.push({
                month: i + 1,
                date: paymentDate.toISOString().slice(0, 10),
                amount: this.kopToRub(amountKop),
                cumulativePaid: this.kopToRub(cumulativeKop),
                remaining: this.kopToRub(Math.max(0, remainingKop)),
            });
        }
        return schedule;
    }
    validateInputs(salePrice, downPayment, termMonths) {
        if (salePrice <= 0) {
            throw new common_1.BadRequestException('Цена продажи должна быть больше нуля');
        }
        if (downPayment < 0) {
            throw new common_1.BadRequestException('Первоначальный взнос не может быть отрицательным');
        }
        if (termMonths < 1 || termMonths > 120) {
            throw new common_1.BadRequestException('Срок рассрочки должен быть от 1 до 120 месяцев');
        }
    }
    kopToRub(kopecks) {
        return Math.round(kopecks) / 100;
    }
};
exports.CalculatorService = CalculatorService;
exports.CalculatorService = CalculatorService = __decorate([
    (0, common_1.Injectable)()
], CalculatorService);
//# sourceMappingURL=calculator.service.js.map