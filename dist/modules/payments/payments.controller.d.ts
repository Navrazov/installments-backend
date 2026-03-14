import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    private assertCanWritePayments;
    create(req: AuthenticatedRequest, dto: CreatePaymentDto): Promise<import("./schemas/payment.schema").PaymentDocument>;
    getStats(req: AuthenticatedRequest, dateFrom?: string, dateTo?: string): Promise<{
        totalCollected: number;
        totalCount: number;
        byMethod: Record<string, {
            count: number;
            total: number;
        }>;
    }>;
    getPaymentsByDeal(req: AuthenticatedRequest, dealId: string): Promise<import("./schemas/payment.schema").PaymentDocument[]>;
    earlyRepayment(req: AuthenticatedRequest, body: {
        dealId: string;
        amount: number;
    }): Promise<import("./schemas/payment.schema").PaymentDocument>;
    findAll(req: AuthenticatedRequest, query: QueryPaymentDto): Promise<{
        data: import("./schemas/payment.schema").PaymentDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findById(req: AuthenticatedRequest, id: string): Promise<import("./schemas/payment.schema").PaymentDocument>;
}
