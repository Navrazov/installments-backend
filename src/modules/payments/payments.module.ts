import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Deal, DealSchema } from '../deals/schemas/deal.schema';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { DealsModule } from '../deals/deals.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Deal.name, schema: DealSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
    DealsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
