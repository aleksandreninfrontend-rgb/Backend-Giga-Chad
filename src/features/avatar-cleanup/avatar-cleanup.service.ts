import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EnqueueCleanupResponseDto } from './dto/enqueue-avatars-cleanup-response.dto.js';
import {
  AVATAR_CLEANUP_JOB,
  AVATAR_CLEANUP_JOB_ID,
  AVATAR_CLEANUP_QUEUE,
} from './avatar-cleanup.constants.js';

@Injectable()
export class AvatarCleanupService {
  private readonly logger = new Logger(AvatarCleanupService.name);
  constructor(
    @InjectQueue(AVATAR_CLEANUP_QUEUE) private readonly queue: Queue,
  ) {}

  async enqueueCleanup(): Promise<EnqueueCleanupResponseDto> {
    await this.queue.add(
      AVATAR_CLEANUP_JOB,
      {},
      {
        jobId: AVATAR_CLEANUP_JOB_ID,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    this.logger.log({
      msg: 'Avatar cleanup job enqueued',
      jobId: AVATAR_CLEANUP_JOB_ID,
    });
    return { queued: true };
  }
}
