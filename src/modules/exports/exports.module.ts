import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { ReportsModule } from '../reports/reports.module';
import { Deal, DealSchema } from '../deals/schemas/deal.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Client, ClientSchema } from '../clients/schemas/client.schema';

@Module({
  imports: [
    ReportsModule,
    MongooseModule.forFeature([
      { name: Deal.name, schema: DealSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {}
