import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsMongoId,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDealDto {
  @IsOptional()
  @IsString()
  productDescription?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  markup?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  markupPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  downPayment?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  termMonths?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  branchName?: string;

  @IsOptional()
  @IsMongoId()
  managerId?: string;

  @IsOptional()
  @IsMongoId()
  guarantorId?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
