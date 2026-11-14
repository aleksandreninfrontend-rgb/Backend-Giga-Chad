import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter, CommonLoggerModule } from '@app/common';
import { NotificationServiceController } from './notification-service.controller.js';
import { NotificationServiceService } from './notification-service.service.js';
import { NotificationModule } from './features/notifications/notification.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonLoggerModule,
    NotificationModule,
  ],
  controllers: [NotificationServiceController],
  providers: [
    NotificationServiceService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class NotificationServiceModule {}
