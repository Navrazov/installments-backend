import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationBranchDto } from './dto/create-organization.dto';
import { SubscriptionTier, SubscriptionStatus } from './schemas/organization.schema';
import { JwtPayloadUser } from '../../common/interfaces/request.interface';
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    create(dto: CreateOrganizationDto): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    findAll(currentUser: JwtPayloadUser, search?: string, subscriptionTier?: SubscriptionTier, subscriptionStatus?: SubscriptionStatus, isActive?: string, page?: string, limit?: string): Promise<{
        organizations: import("./schemas/organization.schema").OrganizationDocument[];
        total: number;
    }>;
    findOne(id: string, currentUser: JwtPayloadUser): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    update(id: string, dto: UpdateOrganizationDto, currentUser: JwtPayloadUser): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    suspend(id: string): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    activate(id: string): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    updateSubscription(id: string, tier: SubscriptionTier): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    addBranch(id: string, branchDto: OrganizationBranchDto, currentUser: JwtPayloadUser): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    updateBranch(id: string, branchIndex: string, branchDto: Partial<OrganizationBranchDto>, currentUser: JwtPayloadUser): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    removeBranch(id: string, branchIndex: string, currentUser: JwtPayloadUser): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    getStats(id: string, currentUser: JwtPayloadUser): Promise<{
        organization: import("./schemas/organization.schema").OrganizationDocument;
        activeBranches: number;
        totalBranches: number;
    }>;
    checkFeature(id: string, feature: string, currentUser: JwtPayloadUser): Promise<{
        feature: string;
        hasAccess: boolean;
    }>;
    private assertOrgAccess;
}
