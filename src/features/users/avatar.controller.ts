import {
  Controller,
  Delete,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AvatarService } from './avatar.service.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/types/jwt-payload.js';
import type { IUploadedMulterFile } from '../../providers/files/s3/interfaces/upload-file.interface.js';
import { AvatarResponseDto } from './dto/avatar-response.dto.js';
import { MAX_AVATAR_SIZE_BYTES } from './avatar.constants.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Post('me/avatars')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_SIZE_BYTES },
    }),
  )
  @ApiOperation({ summary: 'Upload an avatar for the current user (max 5)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ type: AvatarResponseDto })
  @ApiUnauthorizedResponse()
  upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_AVATAR_SIZE_BYTES }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png)$/,
            overrideMimeType: true,
          }),
        ],
      }),
    )
    file: IUploadedMulterFile,
  ): Promise<AvatarResponseDto> {
    return this.avatarService.upload(user.sub, file);
  }

  @Delete('me/avatars/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an avatar of the current user' })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  softDelete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.avatarService.softDelete(user.sub, id);
  }
}
