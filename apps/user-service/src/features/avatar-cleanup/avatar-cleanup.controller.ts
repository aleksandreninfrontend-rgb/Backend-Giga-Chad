import { Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AvatarCleanupService } from './avatar-cleanup.service.js';
import { Role, Roles } from '@app/common';
import { EnqueueCleanupResponseDto } from './dto/enqueue-avatars-cleanup-response.dto.js';

@ApiTags('avatar-cleanup')
@ApiBearerAuth()
@Controller('avatar-cleanup')
export class AvatarCleanupController {
  constructor(private readonly avatarCleanupService: AvatarCleanupService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Enqueue avatar cleanup' })
  @ApiCreatedResponse({ type: EnqueueCleanupResponseDto })
  enqueueCleanup(): Promise<EnqueueCleanupResponseDto> {
    return this.avatarCleanupService.enqueueCleanup();
  }
}
