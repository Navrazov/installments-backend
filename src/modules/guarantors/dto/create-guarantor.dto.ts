import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsMongoId,
  ValidateNested,
  IsDate,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GuarantorPassportDto {
  @IsOptional()
  @IsString()
  series?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  issuedBy?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  issuedDate?: Date;

  @IsOptional()
  @IsString()
  registrationAddress?: string;
}

export class CreateGuarantorDto {
  @IsMongoId()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  relationship: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GuarantorPassportDto)
  passport?: GuarantorPassportDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
