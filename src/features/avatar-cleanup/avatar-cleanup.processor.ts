import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFileService } from '../../providers/files/files.adapter.js';
import { AvatarRepository } from '../users/avatar.repository.js';

@Processor('avatar-cleanup')
export class AvatarCleanupProcessor {
  constructor(
    private readonly avatarRepository: AvatarRepository,
    @Inject(IFileService) private readonly fileService: IFileService,
    private readonly config: ConfigService,
  ) {}

  @Process('cleanup')
  async handleCleanup() {
    const retentionMs = Number(
      this.config.get('AVATAR_CLEANUP_RETENTION_MS', '604800000'),
    );
    const cutoff = new Date(Date.now() - retentionMs);

    const expiredAvatars =
      await this.avatarRepository.findExpiredSoftDeleted(cutoff);

    for (const avatar of expiredAvatars) {
      try {
        await this.fileService.removeFile({ path: avatar.path });
        await this.avatarRepository.hardDeleteById(avatar.id);
      } catch {
        // TODO: log failure (avatar.id, path) — leave DB row for next run
      }
    }
  }
}
