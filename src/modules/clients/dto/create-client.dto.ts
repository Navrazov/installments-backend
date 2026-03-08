import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDate,
  IsEnum,
  IsBoolean,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RiskStatus } from '../schemas/client.schema';

export class PassportDto {
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

export class CreateClientDto {
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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalPhones?: string[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  birthDate?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => PassportDto)
  passport?: PassportDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  workplace?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  income?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(RiskStatus)
  riskStatus?: RiskStatus;

  @IsOptional()
  @IsBoolean()
  isBlacklisted?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  reputationScore?: number;
}
