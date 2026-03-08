import { ScheduleEntry, CalculationResult } from './dto/calculate.dto';
export declare class CalculatorService {
    calculateBySalePrice(salePrice: number, downPayment: number, termMonths: number, startDate?: string): CalculationResult;
    calculateByPurchasePrice(purchasePrice: number, markupPercent: number, downPayment: number, termMonths: number, startDate?: string): CalculationResult;
    calculateByMonthlyPayment(salePrice: number, downPayment: number, desiredMonthlyPayment: number, startDate?: string): CalculationResult;
    generateSchedule(startDate: Date, termMonths: number, monthlyPayment: number): ScheduleEntry[];
    private generateScheduleInternal;
    private validateInputs;
    private kopToRub;
}
