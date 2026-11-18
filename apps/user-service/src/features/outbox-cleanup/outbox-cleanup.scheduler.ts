import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import type { CleanupConfig } from '@app/common';
import { OutboxCleanupService } from './outbox-cleanup.service.js';
import { OUTBOX_CLEANUP_CRON_NAME } from './outbox-cleanup.constants.js';

@Injectable()
export class OutboxCleanupScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxCleanupScheduler.name);

  constructor(
    private readonly outboxCleanupService: OutboxCleanupService,
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const { outboxCron: expression } =
      this.config.getOrThrow<CleanupConfig>('cleanup');

    const job = CronJob.from({
      cronTime: expression,
      onTick: () => {
        this.logger.log({ msg: 'Outbox cleanup cron fired' });
        void this.outboxCleanupService.cleanup().catch((err: unknown) => {
          this.logger.error({
            msg: 'Outbox cleanup failed',
            error: err instanceof Error ? err.message : String(err),
          });
        });
      },
      start: true,
    });

    this.schedulerRegistry.addCronJob(OUTBOX_CLEANUP_CRON_NAME, job);
    this.logger.log({
      msg: 'Outbox cleanup cron registered',
      expression,
    });
  }

  onModuleDestroy() {
    if (this.schedulerRegistry.doesExist('cron', OUTBOX_CLEANUP_CRON_NAME)) {
      this.schedulerRegistry.deleteCronJob(OUTBOX_CLEANUP_CRON_NAME);
    }
  }
}
