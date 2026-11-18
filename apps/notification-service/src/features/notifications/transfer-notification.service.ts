import { Injectable } from '@nestjs/common';
import type { TransferCompletedEvent } from '@app/common';
import { NotificationGateway } from './notification.gateway.js';

@Injectable()
export class TransferNotificationService {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  notifyTransferCompleted(payload: TransferCompletedEvent): void {
    this.notificationGateway.sendNotification(payload.toUserId, payload);
    this.notificationGateway.sendNotification(payload.fromUserId, payload);
  }
}
