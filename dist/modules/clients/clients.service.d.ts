import { Model, Types } from 'mongoose';
import { ClientDocument, RiskStatus } from './schemas/client.schema';
import { DealDocument } from '../deals/schemas/deal.schema';
import { PaymentDocument } from '../payments/schemas/payment.schema';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class ClientsService {
    private readonly clientModel;
    private readonly dealModel;
    private readonly paymentModel;
    private readonly logger;
    constructor(clientModel: Model<ClientDocument>, dealModel: Model<DealDocument>, paymentModel: Model<PaymentDocument>);
    create(orgId: Types.ObjectId, dto: CreateClientDto, userId: Types.ObjectId): Promise<ClientDocument>;
    findAll(orgId: Types.ObjectId, query: QueryClientDto): Promise<PaginatedResponse<ClientDocument>>;
    findById(orgId: Types.ObjectId, clientId: string): Promise<ClientDocument>;
    update(orgId: Types.ObjectId, clientId: string, dto: UpdateClientDto, userId: Types.ObjectId): Promise<ClientDocument>;
    addToBlacklist(orgId: Types.ObjectId, clientId: string, userId: Types.ObjectId): Promise<ClientDocument>;
    removeFromBlacklist(orgId: Types.ObjectId, clientId: string, userId: Types.ObjectId): Promise<ClientDocument>;
    updateRiskStatus(orgId: Types.ObjectId, clientId: string, status: RiskStatus, userId: Types.ObjectId): Promise<ClientDocument>;
    getClientHistory(orgId: Types.ObjectId, clientId: string): Promise<{
        client: ClientDocument;
        deals: DealDocument[];
        payments: PaymentDocument[];
        summary: {
            totalDeals: number;
            activeDeals: number;
            totalPayments: number;
            totalPaid: number;
            totalRemaining: number;
        };
    }>;
    search(orgId: Types.ObjectId, query: string): Promise<ClientDocument[]>;
    getGuarantorsForClient(orgId: Types.ObjectId, clientId: string): Promise<ClientDocument[]>;
    addGuarantor(orgId: Types.ObjectId, clientId: string, guarantorId: string, relationship: string): Promise<ClientDocument>;
    removeGuarantor(orgId: Types.ObjectId, clientId: string, guarantorId: string): Promise<ClientDocument>;
    importClients(orgId: Types.ObjectId, dtos: CreateClientDto[], userId: Types.ObjectId): Promise<{
        imported: number;
        errors: {
            row: number;
            error: string;
        }[];
    }>;
    exportClients(orgId: Types.ObjectId): Promise<ClientDocument[]>;
    private encryptPassport;
    private decryptClientPassport;
}
