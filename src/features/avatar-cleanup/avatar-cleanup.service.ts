import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EnqueueCleanupResponseDto } from './dto/enqueue-avatars-cleanup-response.dto.js';

@Injectable()
export class AvatarCleanupService {
  constructor(@InjectQueue('avatar-cleanup') private readonly queue: Queue) {}

  async enqueueCleanup(): Promise<EnqueueCleanupResponseDto> {
    await this.queue.add('cleanup', {});
    return { queued: true };
  }
}
