import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvestmentDto {
  @IsMongoId()
  @IsNotEmpty()
  investorId: string;

  @IsMongoId()
  @IsNotEmpty()
  dealId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  investedAmount: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  profitSharePercent: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
