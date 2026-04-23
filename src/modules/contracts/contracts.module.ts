import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Contract, ContractSchema } from './schemas/contract.schema';
import { Deal, DealSchema } from '../deals/schemas/deal.schema';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import {
  Organization,
  OrganizationSchema,
} from '../organizations/schemas/organization.schema';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
      { name: Deal.name, schema: DealSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
