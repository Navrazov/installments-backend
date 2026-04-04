import {
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { OverdueStatus } from '../schemas/overdue.schema';

export class QueryOverdueDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsEnum(OverdueStatus, { message: 'Invalid overdue status' })
  @IsOptional()
  status?: OverdueStatus;

  @IsMongoId({ message: 'assignedTo must be a valid MongoDB ObjectId' })
  @IsOptional()
  assignedTo?: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  minDays?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  maxDays?: number;

  @IsString()
  @IsOptional()
  sortBy?: string = 'overdueDays';

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
