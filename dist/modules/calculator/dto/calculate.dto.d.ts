export declare class CalculateBySalePriceDto {
    salePrice: number;
    downPayment: number;
    termMonths: number;
    startDate?: string;
}
export declare class CalculateByPurchasePriceDto {
    purchasePrice: number;
    markupPercent: number;
    downPayment: number;
    termMonths: number;
    startDate?: string;
}
export declare class CalculateByMonthlyPaymentDto {
    salePrice: number;
    downPayment: number;
    desiredMonthlyPayment: number;
    startDate?: string;
}
export interface ScheduleEntry {
    month: number;
    date: string;
    amount: number;
    cumulativePaid: number;
    remaining: number;
}
export interface CalculationResult {
    salePrice?: number;
    markup?: number;
    monthlyPayment: number;
    totalAmount: number;
    remainingAmount: number;
    termMonths?: number;
    schedule: ScheduleEntry[];
}
