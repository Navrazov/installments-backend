import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OverdueStatus } from '../schemas/overdue.schema';

export class UpdateOverdueDto {
  @IsEnum(OverdueStatus, { message: 'Invalid overdue status' })
  @IsOptional()
  status?: OverdueStatus;

  @IsDateString({}, { message: 'lastContactDate must be a valid ISO date string' })
  @IsOptional()
  lastContactDate?: string;

  @IsDateString({}, { message: 'promisedPaymentDate must be a valid ISO date string' })
  @IsOptional()
  promisedPaymentDate?: string;

  @IsString()
  @MaxLength(2000, { message: 'Manager comment must not exceed 2000 characters' })
  @IsOptional()
  managerComment?: string;

  @IsMongoId({ message: 'assignedTo must be a valid MongoDB ObjectId' })
  @IsOptional()
  assignedTo?: string;
}
