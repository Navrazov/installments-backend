import { IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateBySalePriceDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  salePrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  downPayment: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  termMonths: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class CalculateByPurchasePriceDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  purchasePrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  markupPercent: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  downPayment: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  termMonths: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class CalculateByMonthlyPaymentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  salePrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  downPayment: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  desiredMonthlyPayment: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export interface ScheduleEntry {
  month: number;
  date: string;
  amount: number;
  cumulativePaid: number;
  remaining: number;
}

export interface CalculationResult {
  salePrice?: number;
  markup?: number;
  monthlyPayment: number;
  totalAmount: number;
  remainingAmount: number;
  termMonths?: number;
  schedule: ScheduleEntry[];
}
