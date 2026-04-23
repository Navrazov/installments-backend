import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsMongoId,
  IsEnum,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RoundingMode {
  NONE = 'none',
  UP = 'up',
  DOWN = 'down',
}

export class CreateDealDto {
  @IsMongoId()
  clientId: string;

  @IsString()
  @MinLength(1)
  productDescription: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  purchasePrice?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice: number;

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
  @IsDateString()
  firstPaymentDate?: string;

  @IsOptional()
  @IsEnum(RoundingMode)
  roundingMode?: RoundingMode;

  @IsOptional()
  @IsString()
  comments?: string;
}
