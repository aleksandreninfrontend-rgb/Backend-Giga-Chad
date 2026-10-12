import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Avatar } from '@prisma/client';
import { AvatarRepository } from './avatar.repository.js';
import { IFileService } from '../../providers/files/files.adapter.js';
import type { IUploadedMulterFile } from '../../providers/files/s3/interfaces/upload-file.interface.js';
import { AvatarResponseDto } from './dto/avatar-response.dto.js';

const MAX_AVATARS_PER_USER = 5;
const ALLOWED_EXTENSIONS = new Set(['.jpeg', '.png']);
const MAX_AVATAR_SIZE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class AvatarService {
  constructor(
    private readonly avatarRepository: AvatarRepository,
    @Inject(IFileService) private readonly fileService: IFileService,
  ) {}

  async upload(
    userId: string,
    file: IUploadedMulterFile,
  ): Promise<AvatarResponseDto> {
    const count = await this.avatarRepository.countActiveByUserId(userId);
    if (count >= MAX_AVATARS_PER_USER) {
      throw new BadRequestException('User already has 5 avatars');
    }
    if (!file?.size || file.size > MAX_AVATAR_SIZE_BYTES) {
      throw new BadRequestException('Avatar must be at most 10MB');
    }

    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
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

    return this.toResponse(avatar);
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
