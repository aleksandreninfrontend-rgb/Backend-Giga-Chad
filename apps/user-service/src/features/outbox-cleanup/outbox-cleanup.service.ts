import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CleanupConfig } from '@app/common';
import {
  OUTBOX_CLEANUP_BATCH_SIZE,
  OUTBOX_CLEANUP_JOB,
} from './outbox-cleanup.constants.js';
import { OutboxRepository } from './outbox.repository.js';

@Injectable()
export class OutboxCleanupService {
  private readonly logger = new Logger(OutboxCleanupService.name);
  private readonly retentionMs: number;

  constructor(
    private readonly outboxRepository: OutboxRepository,
    config: ConfigService,
  ) {
    this.retentionMs =
      config.getOrThrow<CleanupConfig>('cleanup').outboxRetentionMs;
  }

  async cleanup(): Promise<void> {
    const claimed =
      await this.outboxRepository.tryClaimCronJob(OUTBOX_CLEANUP_JOB);
    if (!claimed) {
      this.logger.log({
        msg: 'Outbox cleanup skipped — another replica already claimed today',
        job: OUTBOX_CLEANUP_JOB,
      });
      return;
    }

    const cutoff = new Date(Date.now() - this.retentionMs);
    let totalDeleted = 0;

    for (;;) {
      const deleted = await this.outboxRepository.deleteOlderThanBatch(
        cutoff,
        OUTBOX_CLEANUP_BATCH_SIZE,
      );

      totalDeleted += deleted;
      if (deleted < OUTBOX_CLEANUP_BATCH_SIZE) {
        break;
      }
    }

    this.logger.log({
      msg: 'Outbox cleanup completed',
      job: OUTBOX_CLEANUP_JOB,
      deleted: totalDeleted,
      cutoff: cutoff.toISOString(),
      retentionMs: this.retentionMs,
    });
  }
}
