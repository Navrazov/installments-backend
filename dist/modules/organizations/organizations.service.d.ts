import { Model } from 'mongoose';
import { OrganizationDocument, SubscriptionTier, SubscriptionStatus } from './schemas/organization.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationBranchDto } from './dto/create-organization.dto';
import { Feature } from '../../common/constants/subscription';
export declare class OrganizationsService {
    private readonly orgModel;
    constructor(orgModel: Model<OrganizationDocument>);
    create(dto: CreateOrganizationDto): Promise<OrganizationDocument>;
    findAll(filters?: {
        search?: string;
        subscriptionTier?: SubscriptionTier;
        subscriptionStatus?: SubscriptionStatus;
        isActive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        organizations: OrganizationDocument[];
        total: number;
    }>;
    findById(id: string): Promise<OrganizationDocument>;
    update(id: string, dto: UpdateOrganizationDto): Promise<OrganizationDocument>;
    suspend(id: string): Promise<OrganizationDocument>;
    activate(id: string): Promise<OrganizationDocument>;
    updateSubscription(id: string, tier: SubscriptionTier): Promise<OrganizationDocument>;
    addBranch(orgId: string, branchDto: OrganizationBranchDto): Promise<OrganizationDocument>;
    updateBranch(orgId: string, branchIndex: number, branchDto: Partial<OrganizationBranchDto>): Promise<OrganizationDocument>;
    removeBranch(orgId: string, branchIndex: number): Promise<OrganizationDocument>;
    checkFeatureAccess(orgId: string, feature: Feature): Promise<boolean>;
    getOrgStats(orgId: string): Promise<{
        organization: OrganizationDocument;
        activeBranches: number;
        totalBranches: number;
    }>;
}
