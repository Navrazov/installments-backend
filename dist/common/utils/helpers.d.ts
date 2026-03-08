export interface PaymentScheduleEntry {
    paymentNumber: number;
    dueDate: Date;
    amount: number;
    principalPortion: number;
    remainingBalance: number;
    status: 'pending' | 'paid' | 'overdue';
}
export interface PaymentScheduleOptions {
    totalAmount: number;
    numberOfPayments: number;
    startDate: Date;
    paymentDayOfMonth?: number;
}
export declare function formatCurrency(amount: number, currency?: string, locale?: string): string;
export declare function maskPassport(passport: string): string;
export declare function generatePaymentSchedule(options: PaymentScheduleOptions): PaymentScheduleEntry[];
export declare function maskPhone(phone: string): string;
export declare function generateReferenceNumber(prefix?: string): string;
