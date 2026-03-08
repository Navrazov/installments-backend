import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OverdueController } from './overdue.controller';
import { OverdueService } from './overdue.service';
import { Overdue, OverdueSchema } from './schemas/overdue.schema';
import { Deal, DealSchema } from '../deals/schemas/deal.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Overdue.name, schema: OverdueSchema },
      { name: Deal.name, schema: DealSchema },
    ]),
  ],
  controllers: [OverdueController],
  providers: [OverdueService],
  exports: [OverdueService],
})
export class OverdueModule {}
