import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsMongoId,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @IsMongoId()
  dealId: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsDateString()
  paymentDate: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  comment?: string;
}
