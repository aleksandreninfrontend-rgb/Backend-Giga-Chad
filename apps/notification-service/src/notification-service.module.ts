import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import {
  AccessTokenGuard,
  AllExceptionsFilter,
  CommonLoggerModule,
  JwtAuthModule,
} from '@app/common';
import { NotificationServiceController } from './notification-service.controller.js';
import { NotificationModule } from './features/notifications/notification.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonLoggerModule,
    JwtAuthModule,
    NotificationModule,
  ],
  controllers: [NotificationServiceController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: AccessTokenGuard },
  ],
})
export class NotificationServiceModule {}
