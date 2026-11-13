import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFileService } from '../../providers/files/files.adapter.js';
import { AvatarRepository } from '../users/avatar.repository.js';
import {
  AVATAR_CLEANUP_JOB,
  AVATAR_CLEANUP_QUEUE,
} from './avatar-cleanup.constants.js';

@Processor(AVATAR_CLEANUP_QUEUE)
export class AvatarCleanupProcessor {
  private readonly logger = new Logger(AvatarCleanupProcessor.name);
  constructor(
    private readonly avatarRepository: AvatarRepository,
    @Inject(IFileService) private readonly fileService: IFileService,
    private readonly config: ConfigService,
  ) {}

  @Process(AVATAR_CLEANUP_JOB)
  async handleCleanup() {
    const retentionMs = Number(
      this.config.get('AVATAR_CLEANUP_RETENTION_MS', '604800000'),
    );
    const cutoff = new Date(Date.now() - retentionMs);

    const expiredAvatars =
      await this.avatarRepository.findExpiredSoftDeleted(cutoff);
    this.logger.log({
      msg: 'Avatar cleanup started',
      cutoff: cutoff.toISOString(),
      count: expiredAvatars.length,
    });

    let deleted = 0;
    let failed = 0;

    for (const avatar of expiredAvatars) {
      try {
        await this.fileService.removeFile({ path: avatar.path });
        await this.avatarRepository.hardDeleteById(avatar.id);
        deleted += 1;
      } catch (err) {
        failed += 1;
        this.logger.error({
          msg: 'Avatar cleanup item failed',
          avatarId: avatar.id,
          path: avatar.path,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    this.logger.log({
      msg: 'Avatar cleanup finished',
      deleted,
      failed,
    });
  }
}
