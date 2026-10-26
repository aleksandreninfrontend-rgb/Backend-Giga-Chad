import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import type { Avatar } from '@prisma/client';
import { AvatarRepository } from './avatar.repository.js';
import { IFileService } from '../../providers/files/files.adapter.js';
import type { IUploadedMulterFile } from '../../providers/files/s3/interfaces/upload-file.interface.js';
import { AvatarResponseDto } from './dto/avatar-response.dto.js';
import { RedisService } from '../../providers/cache/redis.service.js';
import {
  AVATAR_MIME_TO_EXT,
  MAX_AVATARS_PER_USER,
} from './avatar.constants.js';

const AVATAR_LOCK_TTL_SECONDS = 60;

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);
  constructor(
    private readonly avatarRepository: AvatarRepository,
    @Inject(IFileService) private readonly fileService: IFileService,
    private readonly redisService: RedisService,
  ) {}

  async upload(
    userId: string,
    file: IUploadedMulterFile,
  ): Promise<AvatarResponseDto> {
    const lockKey = `avatar:upload:${userId}`;
    const locked = await this.redisService.acquireLock(
      lockKey,
      AVATAR_LOCK_TTL_SECONDS,
    );
    if (!locked) {
      throw new ConflictException('Avatar upload is already in progress');
    }

    try {
      const count = await this.avatarRepository.countActiveByUserId(userId);

      if (count >= MAX_AVATARS_PER_USER) {
        throw new BadRequestException(
          `User already has ${MAX_AVATARS_PER_USER} avatars`,
        );
      }

      const ext = AVATAR_MIME_TO_EXT[file.mimetype ?? ''];
      if (!ext) {
        throw new BadRequestException('Invalid file type. Allowed: jpeg, png');
      }

      const name = `${randomUUID()}${ext}`;
      const { path } = await this.fileService.uploadFile({
        file,
        folder: `users/${userId}/avatars`,
        name,
      });

      const avatar = await this.avatarRepository.create({
        path,
        user: { connect: { id: userId } },
      });
      this.logger.log({
        msg: 'Avatar uploaded',
        userId,
        avatarId: avatar.id,
        path: avatar.path,
      });

      return this.toResponse(avatar);
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  async findAllByUserId(userId: string): Promise<AvatarResponseDto[]> {
    const avatars = await this.avatarRepository.findAllByUserId(userId);
    return avatars.map((avatar) => this.toResponse(avatar));
  }

  async softDelete(userId: string, avatarId: string): Promise<void> {
    const avatar = await this.avatarRepository.findById(avatarId);
    if (!avatar) {
      throw new NotFoundException('Avatar not found');
    }
    if (avatar.userId !== userId) {
      throw new ForbiddenException();
    }
    await this.avatarRepository.softDeleteById(avatarId);
    this.logger.log({
      msg: 'Avatar soft-deleted',
      userId,
      avatarId,
    });
  }

  private toResponse(avatar: Avatar): AvatarResponseDto {
    return {
      id: avatar.id,
      userId: avatar.userId,
      path: avatar.path,
      createdAt: avatar.createdAt,
    };
  }
}
