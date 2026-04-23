import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SmsMessage, SmsMessageSchema } from './schemas/sms-message.schema';
import { Deal, DealSchema } from '../deals/schemas/deal.schema';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { GreenSmsService } from './green-sms.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SmsMessage.name, schema: SmsMessageSchema },
      { name: Deal.name, schema: DealSchema },
      { name: Client.name, schema: ClientSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SmsController],
  providers: [SmsService, GreenSmsService],
  exports: [SmsService],
})
export class SmsModule {}
