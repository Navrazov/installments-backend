import { PaymentMethod } from '../schemas/payment.schema';
export declare class CreatePaymentDto {
    dealId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    comment?: string;
}
