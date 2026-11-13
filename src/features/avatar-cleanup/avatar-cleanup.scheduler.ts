import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AvatarCleanupService } from './avatar-cleanup.service.js';

@Injectable()
export class AvatarCleanupScheduler {
  private readonly logger = new Logger(AvatarCleanupScheduler.name);
  constructor(private readonly avatarCleanupService: AvatarCleanupService) {}
  @Cron(process.env.AVATAR_CLEANUP_CRON ?? '0 3 * * *')
  handleCron() {
    this.logger.log({ msg: 'Avatar cleanup cron fired, enqueueing job' });
    return this.avatarCleanupService.enqueueCleanup();
  }
}
