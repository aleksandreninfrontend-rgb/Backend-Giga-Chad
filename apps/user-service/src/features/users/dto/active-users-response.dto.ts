import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto.js';
import { AvatarResponseDto } from './avatar-response.dto.js';
import { PaginationMetaDto } from './paginated-user-response.dto.js';

export class ActiveUserResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: AvatarResponseDto })
  latestAvatar: AvatarResponseDto;
}

export class PaginatedActiveUsersResponseDto {
  @ApiProperty({ type: [ActiveUserResponseDto] })
  users: ActiveUserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
