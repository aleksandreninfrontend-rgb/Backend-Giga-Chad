import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { AvatarCleanupService } from './avatar-cleanup.service.js';
import {
  AVATAR_CLEANUP_CRON_DEFAULT,
  AVATAR_CLEANUP_CRON_NAME,
} from './avatar-cleanup.constants.js';

@Injectable()
export class AvatarCleanupScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AvatarCleanupScheduler.name);

  constructor(
    private readonly avatarCleanupService: AvatarCleanupService,
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const expression =
      this.config.get<string>('AVATAR_CLEANUP_CRON') ??
      AVATAR_CLEANUP_CRON_DEFAULT;

    const job = CronJob.from({
      cronTime: expression,
      onTick: () => {
        this.logger.log({ msg: 'Avatar cleanup cron fired, enqueueing job' });
        void this.avatarCleanupService.enqueueCleanup();
      },
      start: true,
    });

    this.schedulerRegistry.addCronJob(AVATAR_CLEANUP_CRON_NAME, job);
    this.logger.log({
      msg: 'Avatar cleanup cron registered',
      expression,
    });
  }

  onModuleDestroy() {
    if (this.schedulerRegistry.doesExist('cron', AVATAR_CLEANUP_CRON_NAME)) {
      this.schedulerRegistry.deleteCronJob(AVATAR_CLEANUP_CRON_NAME);
    }
  }
}
