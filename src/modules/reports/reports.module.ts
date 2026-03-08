import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Deal, DealSchema } from '../deals/schemas/deal.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import { Overdue, OverdueSchema } from '../overdue/schemas/overdue.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deal.name, schema: DealSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Overdue.name, schema: OverdueSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
