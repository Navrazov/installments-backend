import { Model, Types } from 'mongoose';
import { GuarantorDocument } from './schemas/guarantor.schema';
import { CreateGuarantorDto } from './dto/create-guarantor.dto';
import { UpdateGuarantorDto } from './dto/update-guarantor.dto';
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class GuarantorsService {
    private readonly guarantorModel;
    private readonly logger;
    constructor(guarantorModel: Model<GuarantorDocument>);
    create(orgId: Types.ObjectId, dto: CreateGuarantorDto, userId: Types.ObjectId): Promise<GuarantorDocument>;
    findAll(orgId: Types.ObjectId, page?: number, limit?: number): Promise<PaginatedResponse<GuarantorDocument>>;
    findById(orgId: Types.ObjectId, guarantorId: string): Promise<GuarantorDocument>;
    findByClientId(orgId: Types.ObjectId, clientId: string): Promise<GuarantorDocument[]>;
    update(orgId: Types.ObjectId, guarantorId: string, dto: UpdateGuarantorDto, userId: Types.ObjectId): Promise<GuarantorDocument>;
    remove(orgId: Types.ObjectId, guarantorId: string): Promise<void>;
    private encryptPassport;
    private decryptGuarantorPassport;
}
