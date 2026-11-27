import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma.module';
import { ArcjetSecurityModule } from './arcjet/arcjet.module';
import { ArcjetSecurityGuard } from './arcjet/arcjet.guard';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { PaymentsModule } from './payments/payments.module';
import { FraudModule } from './fraud/fraud.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    ArcjetSecurityModule,
    AuthModule,
    WalletModule,
    PaymentsModule,
    FraudModule,
    NotificationsModule,
    AnalyticsModule,
    BankAccountsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ArcjetSecurityGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
