import { ApiProperty } from '@nestjs/swagger';

export class AvatarResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({
    example: 'users/11111111-1111-1111-1111-111111111111/avatars/uuid.jpeg',
  })
  path: string;

  @ApiProperty()
  createdAt: Date;
}
