import { Model, Types } from 'mongoose';
import { DealDocument, ScheduledPayment } from './schemas/deal.schema';
import { PaymentDocument } from '../payments/schemas/payment.schema';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';
export declare class DealsService {
    private dealModel;
    private paymentModel;
    constructor(dealModel: Model<DealDocument>, paymentModel: Model<PaymentDocument>);
    create(orgId: Types.ObjectId, dto: CreateDealDto, userId: Types.ObjectId): Promise<DealDocument>;
    findAll(orgId: Types.ObjectId, query: QueryDealDto): Promise<{
        data: DealDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findById(orgId: Types.ObjectId, dealId: string): Promise<DealDocument>;
    update(orgId: Types.ObjectId, dealId: string, dto: UpdateDealDto, userId: Types.ObjectId): Promise<DealDocument>;
    cancel(orgId: Types.ObjectId, dealId: string, userId: Types.ObjectId): Promise<DealDocument>;
    close(orgId: Types.ObjectId, dealId: string, userId: Types.ObjectId): Promise<DealDocument>;
    getDealPayments(orgId: Types.ObjectId, dealId: string): Promise<PaymentDocument[]>;
    updatePaymentScheduleStatus(dealId: Types.ObjectId): Promise<void>;
    checkOverdue(): Promise<void>;
    getStats(orgId: Types.ObjectId): Promise<{
        totalDeals: number;
        active: number;
        closed: number;
        overdue: number;
        cancelled: number;
        totalVolume: number;
        totalCollected: number;
        totalRemaining: number;
    }>;
    getUpcomingPayments(orgId: Types.ObjectId, days?: number): Promise<{
        dealId: string;
        dealNumber: string;
        clientName: string;
        clientPhone: string;
        date: Date;
        amount: number;
        daysUntil: number;
        status: string;
    }[]>;
    generatePaymentSchedule(startDate: Date, termMonths: number, monthlyPayment: number): ScheduledPayment[];
    private generateDealNumber;
}
