import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway.js';
import { JwtAuthModule } from '@app/common';

@Module({
  imports: [JwtAuthModule],
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class NotificationModule {}
