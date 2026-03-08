import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { WarningType, WarningSeverity } from '../schemas/warning.schema';

export class CreateWarningDto {
  @IsMongoId({ message: 'clientId must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'clientId is required' })
  clientId: string;

  @IsEnum(WarningType, { message: 'Invalid warning type' })
  @IsNotEmpty({ message: 'Warning type is required' })
  type: WarningType;

  @IsEnum(WarningSeverity, { message: 'Invalid warning severity' })
  @IsNotEmpty({ message: 'Warning severity is required' })
  severity: WarningSeverity;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description: string;

  @IsString()
  @MaxLength(5000, { message: 'Evidence must not exceed 5000 characters' })
  @IsOptional()
  evidence?: string;
}
