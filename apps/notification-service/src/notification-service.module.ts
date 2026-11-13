import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter, CommonLoggerModule } from '@app/common';
import { NotificationServiceController } from './notification-service.controller.js';
import { NotificationServiceService } from './notification-service.service.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CommonLoggerModule],
  controllers: [NotificationServiceController],
  providers: [
    NotificationServiceService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class NotificationServiceModule {}
