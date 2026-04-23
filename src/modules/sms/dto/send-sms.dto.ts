import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { SmsMessageType } from '../schemas/sms-message.schema';

export class BroadcastSmsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  recipients: string[];

  @IsString()
  @MinLength(1)
  body: string;

  @IsEnum(SmsMessageType)
  @IsOptional()
  type?: SmsMessageType;

  @IsMongoId()
  @IsOptional()
  dealId?: string;
}
