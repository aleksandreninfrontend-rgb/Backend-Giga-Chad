import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EnqueueCleanupResponseDto } from './dto/enqueue-avatars-cleanup-response.dto.js';

@Injectable()
export class AvatarCleanupService {
  private readonly logger = new Logger(AvatarCleanupService.name);
  constructor(@InjectQueue('avatar-cleanup') private readonly queue: Queue) {}

  async enqueueCleanup(): Promise<EnqueueCleanupResponseDto> {
    await this.queue.add(
      'cleanup',
      {},
      {
        jobId: 'avatar-cleanup',
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    this.logger.log({
      msg: 'Avatar cleanup job enqueued',
      jobId: 'avatar-cleanup',
    });
    return { queued: true };
  }
}
