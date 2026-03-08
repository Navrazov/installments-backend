import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';
import { Warning, WarningSchema } from './schemas/warning.schema';
import { Client, ClientSchema } from '../clients/schemas/client.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Warning.name, schema: WarningSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
  ],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
