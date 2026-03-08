import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGuarantorDto } from './create-guarantor.dto';

export class UpdateGuarantorDto extends PartialType(
  OmitType(CreateGuarantorDto, ['clientId'] as const),
) {}
