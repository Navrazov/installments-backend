import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionTier } from '../schemas/organization.schema';

export class UpdateOrganizationSettingsDto {
  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  language?: string;
}

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsMongoId()
  @IsOptional()
  ownerId?: string;

  @IsEnum(SubscriptionTier)
  @IsOptional()
  subscriptionTier?: SubscriptionTier;

  @ValidateNested()
  @Type(() => UpdateOrganizationSettingsDto)
  @IsOptional()
  settings?: UpdateOrganizationSettingsDto;
}
