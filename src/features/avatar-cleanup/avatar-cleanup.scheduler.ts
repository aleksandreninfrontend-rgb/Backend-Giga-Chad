import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AvatarCleanupService } from './avatar-cleanup.service.js';

@Injectable()
export class AvatarCleanupScheduler {
  constructor(private readonly avatarCleanupService: AvatarCleanupService) {}
  @Cron(process.env.AVATAR_CLEANUP_CRON ?? '0 3 * * *')
  handleCron() {
    return this.avatarCleanupService.enqueueCleanup();
  }
}
