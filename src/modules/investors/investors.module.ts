import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Investor, InvestorSchema } from './schemas/investor.schema';
import { Investment, InvestmentSchema } from './schemas/investment.schema';
import { Deal, DealSchema } from '../deals/schemas/deal.schema';
import { InvestorsService } from './investors.service';
import { InvestorsController } from './investors.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Investor.name, schema: InvestorSchema },
      { name: Investment.name, schema: InvestmentSchema },
      { name: Deal.name, schema: DealSchema },
    ]),
  ],
  controllers: [InvestorsController],
  providers: [InvestorsService],
  exports: [InvestorsService],
})
export class InvestorsModule {}
