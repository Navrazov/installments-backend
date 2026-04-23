import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ClientsModule } from './modules/clients/clients.module';
import { GuarantorsModule } from './modules/guarantors/guarantors.module';
import { DealsModule } from './modules/deals/deals.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OverdueModule } from './modules/overdue/overdue.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ExportsModule } from './modules/exports/exports.module';
import { CalculatorModule } from './modules/calculator/calculator.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { SmsModule } from './modules/sms/sms.module';
import { InvestorsModule } from './modules/investors/investors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
        autoIndex: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: configService.get<number>('THROTTLE_SHORT_TTL', 1000),
            limit: configService.get<number>('THROTTLE_SHORT_LIMIT', 10),
          },
          {
            name: 'medium',
            ttl: configService.get<number>('THROTTLE_MEDIUM_TTL', 10000),
            limit: configService.get<number>('THROTTLE_MEDIUM_LIMIT', 50),
          },
          {
            name: 'long',
            ttl: configService.get<number>('THROTTLE_LONG_TTL', 60000),
            limit: configService.get<number>('THROTTLE_LONG_LIMIT', 200),
          },
        ],
      }),
    }),

    AuthModule,
    UsersModule,
    OrganizationsModule,
    ClientsModule,
    GuarantorsModule,
    DealsModule,
    PaymentsModule,
    OverdueModule,
    ReputationModule,
    ReportsModule,
    ExportsModule,
    CalculatorModule,
    ContractsModule,
    SmsModule,
    InvestorsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
