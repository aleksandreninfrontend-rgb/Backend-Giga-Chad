import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import {
  TRANSFER_COMPLETED_EVENT,
  type TransferCompletedEvent,
} from '@app/common';
import { NotificationGateway } from './notification.gateway.js';

@Controller()
export class TransferEventsController {
  private readonly logger = new Logger(TransferEventsController.name);

  constructor(private readonly notificationGateway: NotificationGateway) {}

  @EventPattern(TRANSFER_COMPLETED_EVENT)
  async handleTransferCompleted(
    @Payload() payload: TransferCompletedEvent,
    @Ctx() ctx: unknown,
  ): Promise<void> {
    const kafkaCtx = ctx as KafkaContext;

    this.logger.log({
      msg: 'Transfer event received',
      eventId: payload.eventId,
      fromUserId: payload.fromUserId,
      toUserId: payload.toUserId,
      amount: payload.amount,
    });

    this.notificationGateway.sendNotification(payload.toUserId, payload);
    this.notificationGateway.sendNotification(payload.fromUserId, payload);

    const { offset } = kafkaCtx.getMessage();
    const partition = kafkaCtx.getPartition();
    const topic = kafkaCtx.getTopic();
    const consumer = kafkaCtx.getConsumer();

    await consumer.commitOffsets([
      {
        topic,
        partition,
        offset: (Number(offset) + 1).toString(),
      },
    ]);

    this.logger.log({
      msg: 'Transfer event offset committed',
      eventId: payload.eventId,
      topic,
      partition,
      offset,
    });
  }
}
