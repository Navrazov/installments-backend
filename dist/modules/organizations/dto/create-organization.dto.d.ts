import { SubscriptionTier } from '../schemas/organization.schema';
export declare class OrganizationSettingsDto {
    currency?: string;
    timezone?: string;
    language?: string;
}
export declare class OrganizationBranchDto {
    name: string;
    address: string;
    phone?: string;
}
export declare class CreateOrganizationDto {
    name: string;
    slug: string;
    ownerId: string;
    subscriptionTier?: SubscriptionTier;
    settings?: OrganizationSettingsDto;
}
