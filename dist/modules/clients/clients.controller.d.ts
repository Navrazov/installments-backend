import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
import { RiskStatus } from './schemas/client.schema';
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
    create(req: AuthenticatedRequest, dto: CreateClientDto): Promise<import("./schemas/client.schema").ClientDocument>;
    findAll(req: AuthenticatedRequest, query: QueryClientDto): Promise<import("./clients.service").PaginatedResponse<import("./schemas/client.schema").ClientDocument>>;
    search(req: AuthenticatedRequest, q: string): Promise<import("./schemas/client.schema").ClientDocument[]>;
    findById(req: AuthenticatedRequest, id: string): Promise<import("./schemas/client.schema").ClientDocument>;
    getClientHistory(req: AuthenticatedRequest, id: string): Promise<{
        client: import("./schemas/client.schema").ClientDocument;
        deals: import("../deals/schemas/deal.schema").DealDocument[];
        payments: import("../payments/schemas/payment.schema").PaymentDocument[];
        summary: {
            totalDeals: number;
            activeDeals: number;
            totalPayments: number;
            totalPaid: number;
            totalRemaining: number;
        };
    }>;
    update(req: AuthenticatedRequest, id: string, dto: UpdateClientDto): Promise<import("./schemas/client.schema").ClientDocument>;
    toggleBlacklist(req: AuthenticatedRequest, id: string, blacklisted: boolean): Promise<import("./schemas/client.schema").ClientDocument>;
    updateRiskStatus(req: AuthenticatedRequest, id: string, riskStatus: RiskStatus): Promise<import("./schemas/client.schema").ClientDocument>;
}
