import { Injectable, BadRequestException } from '@nestjs/common';
import { ScheduleEntry, CalculationResult } from './dto/calculate.dto';

@Injectable()
export class CalculatorService {
  /**
   * All internal calculations use kopecks (integer) to avoid floating point issues.
   * Final results are converted to rubles (divide by 100).
   */

  calculateBySalePrice(
    salePrice: number,
    downPayment: number,
    termMonths: number,
    startDate?: string,
  ): CalculationResult {
    this.validateInputs(salePrice, downPayment, termMonths);

    const salePriceKop = Math.round(salePrice * 100);
    const downPaymentKop = Math.round(downPayment * 100);
    const remainingKop = salePriceKop - downPaymentKop;

    if (remainingKop < 0) {
      throw new BadRequestException('Первоначальный взнос не может превышать цену продажи');
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

  calculateByPurchasePrice(
    purchasePrice: number,
    markupPercent: number,
    downPayment: number,
    termMonths: number,
    startDate?: string,
  ): CalculationResult {
    if (purchasePrice <= 0) {
      throw new BadRequestException('Закупочная цена должна быть больше нуля');
    }
    if (markupPercent < 0) {
      throw new BadRequestException('Процент наценки не может быть отрицательным');
    }

    const purchasePriceKop = Math.round(purchasePrice * 100);
    const markupKop = Math.round(purchasePriceKop * markupPercent / 100);
    const salePriceKop = purchasePriceKop + markupKop;
    const salePrice = this.kopToRub(salePriceKop);

    this.validateInputs(salePrice, downPayment, termMonths);

    const downPaymentKop = Math.round(downPayment * 100);
    const remainingKop = salePriceKop - downPaymentKop;

    if (remainingKop < 0) {
      throw new BadRequestException('Первоначальный взнос не может превышать цену продажи');
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

  calculateByMonthlyPayment(
    salePrice: number,
    downPayment: number,
    desiredMonthlyPayment: number,
    startDate?: string,
  ): CalculationResult {
    if (salePrice <= 0) {
      throw new BadRequestException('Цена продажи должна быть больше нуля');
    }
    if (desiredMonthlyPayment <= 0) {
      throw new BadRequestException('Ежемесячный платеж должен быть больше нуля');
    }

    const salePriceKop = Math.round(salePrice * 100);
    const downPaymentKop = Math.round(downPayment * 100);
    const desiredMonthlyKop = Math.round(desiredMonthlyPayment * 100);
    const remainingKop = salePriceKop - downPaymentKop;

    if (remainingKop <= 0) {
      throw new BadRequestException('Первоначальный взнос не может превышать цену продажи');
    }

    const termMonths = Math.ceil(remainingKop / desiredMonthlyKop);

    if (termMonths > 120) {
      throw new BadRequestException(
        'Рассчитанный срок превышает 120 месяцев. Увеличьте ежемесячный платеж или уменьшите сумму.',
      );
    }

    // Recalculate actual monthly payment to be even across the term
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

  generateSchedule(
    startDate: Date,
    termMonths: number,
    monthlyPayment: number,
  ): ScheduleEntry[] {
    const monthlyKop = Math.round(monthlyPayment * 100);
    const totalKop = monthlyKop * termMonths;
    return this.generateScheduleInternal(startDate, termMonths, monthlyKop, monthlyKop, totalKop);
  }

  private generateScheduleInternal(
    startDate: Date,
    termMonths: number,
    monthlyPaymentKop: number,
    lastPaymentKop: number,
    totalRemainingKop: number,
  ): ScheduleEntry[] {
    const schedule: ScheduleEntry[] = [];
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

  private validateInputs(salePrice: number, downPayment: number, termMonths: number): void {
    if (salePrice <= 0) {
      throw new BadRequestException('Цена продажи должна быть больше нуля');
    }
    if (downPayment < 0) {
      throw new BadRequestException('Первоначальный взнос не может быть отрицательным');
    }
    if (termMonths < 1 || termMonths > 120) {
      throw new BadRequestException('Срок рассрочки должен быть от 1 до 120 месяцев');
    }
  }

  private kopToRub(kopecks: number): number {
    return Math.round(kopecks) / 100;
  }
}
