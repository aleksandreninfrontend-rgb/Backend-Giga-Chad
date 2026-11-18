import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import {
  AccessTokenGuard,
  AllExceptionsFilter,
  CommonLoggerModule,
  JwtAuthModule,
  jwtConfig,
  kafkaConfig,
} from '@app/common';
import { NotificationServiceController } from './notification-service.controller.js';
import { NotificationModule } from './features/notifications/notification.module.js';
import { validateNotificationServiceEnv } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, kafkaConfig],
      validate: validateNotificationServiceEnv,
    }),
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
