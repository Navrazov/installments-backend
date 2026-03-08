import { GuarantorsService } from './guarantors.service';
import { CreateGuarantorDto } from './dto/create-guarantor.dto';
import { UpdateGuarantorDto } from './dto/update-guarantor.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
export declare class GuarantorsController {
    private readonly guarantorsService;
    constructor(guarantorsService: GuarantorsService);
    create(req: AuthenticatedRequest, dto: CreateGuarantorDto): Promise<import("./schemas/guarantor.schema").GuarantorDocument>;
    findAll(req: AuthenticatedRequest, page?: number, limit?: number): Promise<import("./guarantors.service").PaginatedResponse<import("./schemas/guarantor.schema").GuarantorDocument>>;
    findByClientId(req: AuthenticatedRequest, clientId: string): Promise<import("./schemas/guarantor.schema").GuarantorDocument[]>;
    findById(req: AuthenticatedRequest, id: string): Promise<import("./schemas/guarantor.schema").GuarantorDocument>;
    update(req: AuthenticatedRequest, id: string, dto: UpdateGuarantorDto): Promise<import("./schemas/guarantor.schema").GuarantorDocument>;
    remove(req: AuthenticatedRequest, id: string): Promise<void>;
}
