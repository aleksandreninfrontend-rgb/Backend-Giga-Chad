import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  OUTBOX_CLEANUP_BATCH_SIZE,
  OUTBOX_CLEANUP_JOB,
  OUTBOX_CLEANUP_RETENTION_MS_DEFAULT,
} from './outbox-cleanup.constants.js';

@Injectable()
export class OutboxCleanupService {
  private readonly logger = new Logger(OutboxCleanupService.name);
  private readonly retentionMs: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.retentionMs = Number(
      config.get(
        'OUTBOX_CLEANUP_RETENTION_MS',
        String(OUTBOX_CLEANUP_RETENTION_MS_DEFAULT),
      ),
    );
  }

  /**
   * Claim today's run via cron_runs, then delete old outbox rows in batches.
   * Other replicas get no RETURNING row and skip — avoids N concurrent big DELETEs.
   */
  async cleanup(): Promise<void> {
    const claimed = await this.tryClaimJob(OUTBOX_CLEANUP_JOB);
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
      const deleted = await this.prisma.$executeRaw`
        DELETE FROM outbox
        WHERE id IN (
          SELECT id FROM outbox
          WHERE created_at < ${cutoff}
          ORDER BY created_at
          LIMIT ${OUTBOX_CLEANUP_BATCH_SIZE}
        )
      `;

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

  /**
   * Atomic claim: only one replica gets a RETURNING row per calendar day (DB TZ).
   */
  private async tryClaimJob(job: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ job: string }[]>`
      UPDATE cron_runs
      SET started_at = now()
      WHERE job = ${job}
        AND (started_at AT TIME ZONE 'UTC')::date < (now() AT TIME ZONE 'UTC')::date
      RETURNING job
    `;
    return rows.length > 0;
  }
}
