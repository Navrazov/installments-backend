import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Deal, DealSchema } from './schemas/deal.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { ContractsModule } from '../contracts/contracts.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deal.name, schema: DealSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
    forwardRef(() => ContractsModule),
    forwardRef(() => SmsModule),
  ],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
