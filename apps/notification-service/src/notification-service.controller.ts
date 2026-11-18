import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser, resolveRequestId, type JwtPayload } from '@app/common';
import { ClsService } from 'nestjs-cls';
import { NotificationGateway } from './features/notifications/notification.gateway.js';
import { TestNotificationDto } from './features/notifications/dto/test-notification.dto.js';
import type { TransferNotification } from './features/notifications/types/socket.types.js';

@Controller()
export class NotificationServiceController {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly cls: ClsService,
  ) {}

  @Post('notifications/test')
  testNotification(
    @CurrentUser() user: JwtPayload,
    @Body() body: TestNotificationDto,
  ): { ok: true; userId: string } {
    const payload: TransferNotification = {
      eventId: body.eventId,
      requestId: resolveRequestId(body.requestId, this.cls.getId()),
      fromUserId: body.fromUserId,
      toUserId: body.toUserId,
      amount: body.amount,
      occurredAt: body.occurredAt,
    };

    this.notificationGateway.sendNotification(user.sub, payload);

    return { ok: true, userId: user.sub };
  }
}
