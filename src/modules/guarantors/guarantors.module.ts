import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuarantorsService } from './guarantors.service';
import { GuarantorsController } from './guarantors.controller';
import { Guarantor, GuarantorSchema } from './schemas/guarantor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Guarantor.name, schema: GuarantorSchema },
    ]),
  ],
  controllers: [GuarantorsController],
  providers: [GuarantorsService],
  exports: [GuarantorsService],
})
export class GuarantorsModule {}
