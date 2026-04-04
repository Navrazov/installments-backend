import { PaymentMethod } from '../schemas/payment.schema';
export declare class QueryPaymentDto {
    page?: number;
    limit?: number;
    dealId?: string;
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    paymentMethod?: PaymentMethod;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
