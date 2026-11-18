import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TestNotificationDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  requestId?: string;

  @IsString()
  @IsNotEmpty()
  fromUserId: string;

  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  occurredAt: string;
}
