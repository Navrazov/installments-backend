import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsMongoId,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDealDto {
  @IsMongoId()
  clientId: string;

  @IsString()
  @MinLength(1)
  productDescription: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  purchasePrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  markup: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  markupPercent: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  downPayment: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  termMonths: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsString()
  branchName?: string;

  @IsMongoId()
  managerId: string;

  @IsOptional()
  @IsMongoId()
  guarantorId?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
