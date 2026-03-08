import { SubscriptionTier } from '../schemas/organization.schema';
export declare class UpdateOrganizationSettingsDto {
    currency?: string;
    timezone?: string;
    language?: string;
}
export declare class UpdateOrganizationDto {
    name?: string;
    slug?: string;
    ownerId?: string;
    subscriptionTier?: SubscriptionTier;
    settings?: UpdateOrganizationSettingsDto;
}
