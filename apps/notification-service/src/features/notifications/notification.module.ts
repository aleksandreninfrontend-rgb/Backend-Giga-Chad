import { Module } from '@nestjs/common';
import { JwtAuthModule } from '@app/common';
import { NotificationGateway } from './notification.gateway.js';
import { TransferEventsController } from './transfer-events.controller.js';
import { TransferNotificationService } from './transfer-notification.service.js';

@Module({
  imports: [JwtAuthModule],
  controllers: [TransferEventsController],
  providers: [NotificationGateway, TransferNotificationService],
  exports: [NotificationGateway],
})
export class NotificationModule {}
