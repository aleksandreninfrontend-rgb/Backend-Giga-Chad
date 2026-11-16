import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '@app/common';
import { NotificationGateway } from './features/notifications/notification.gateway.js';
import { TestNotificationDto } from './features/notifications/dto/test-notification.dto.js';
import type { TransferNotification } from './features/notifications/types/socket.types.js';

@Controller()
export class NotificationServiceController {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  @Post('notifications/test')
  testNotification(
    @CurrentUser() user: JwtPayload,
    @Body() body: TestNotificationDto,
  ): { ok: true; userId: string } {
    const payload: TransferNotification = {
      eventId: body.eventId,
      fromUserId: body.fromUserId,
      toUserId: body.toUserId,
      amount: body.amount,
      occurredAt: body.occurredAt,
    };

    this.notificationGateway.sendNotification(user.sub, payload);

    return { ok: true, userId: user.sub };
  }
}
