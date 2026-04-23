import { Model, Types } from 'mongoose';
import { PaymentDocument } from './schemas/payment.schema';
import { DealDocument } from '../deals/schemas/deal.schema';
import { ClientDocument } from '../clients/schemas/client.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { DealsService } from '../deals/deals.service';
import { SmsService } from '../sms/sms.service';
export declare class PaymentsService {
    private paymentModel;
    private dealModel;
    private clientModel;
    private readonly dealsService;
    private readonly smsService;
    private readonly logger;
    constructor(paymentModel: Model<PaymentDocument>, dealModel: Model<DealDocument>, clientModel: Model<ClientDocument>, dealsService: DealsService, smsService: SmsService);
    create(orgId: Types.ObjectId, dto: CreatePaymentDto, userId: Types.ObjectId): Promise<PaymentDocument>;
    findAll(orgId: Types.ObjectId, query: QueryPaymentDto): Promise<{
        data: PaymentDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findById(orgId: Types.ObjectId, paymentId: string): Promise<PaymentDocument>;
    getPaymentsByDeal(orgId: Types.ObjectId, dealId: string): Promise<PaymentDocument[]>;
    getPaymentsByClient(orgId: Types.ObjectId, clientId: string): Promise<PaymentDocument[]>;
    getStats(orgId: Types.ObjectId, dateFrom?: string, dateTo?: string): Promise<{
        totalCollected: number;
        totalCount: number;
        byMethod: Record<string, {
            count: number;
            total: number;
        }>;
    }>;
    earlyRepayment(orgId: Types.ObjectId, dealId: string, amount: number, userId: Types.ObjectId): Promise<PaymentDocument>;
    private findAndUpdateScheduleEntry;
    private applyEarlyRepaymentToSchedule;
}
