import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import {
  TRANSFER_COMPLETED_EVENT,
  resolveRequestId,
  type TransferCompletedEvent,
} from '@app/common';
import { UseCls } from 'nestjs-cls';
import { TransferNotificationService } from './transfer-notification.service.js';

@Controller()
export class TransferEventsController {
  private readonly logger = new Logger(TransferEventsController.name);

  constructor(
    private readonly transferNotificationService: TransferNotificationService,
  ) {}

  @EventPattern(TRANSFER_COMPLETED_EVENT)
  @UseCls<[TransferCompletedEvent, unknown]>({
    generateId: true,
    idGenerator: function (payload) {
      return resolveRequestId(payload.requestId, payload.eventId);
    },
  })
  async handleTransferCompleted(
    @Payload() payload: TransferCompletedEvent,
    @Ctx() ctx: unknown,
  ): Promise<void> {
    const kafkaCtx = ctx as KafkaContext;

    this.logger.log({
      msg: 'Transfer event received',
      eventId: payload.eventId,
      requestId: payload.requestId,
      fromUserId: payload.fromUserId,
      toUserId: payload.toUserId,
      amount: payload.amount,
    });

    this.transferNotificationService.notifyTransferCompleted(payload);

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
      requestId: payload.requestId,
      topic,
      partition,
      offset,
    });
  }
}
