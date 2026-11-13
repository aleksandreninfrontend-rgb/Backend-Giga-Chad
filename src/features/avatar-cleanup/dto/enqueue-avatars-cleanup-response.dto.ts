import { ApiProperty } from '@nestjs/swagger';

export class EnqueueCleanupResponseDto {
  @ApiProperty({ example: true })
  queued: boolean;
}
