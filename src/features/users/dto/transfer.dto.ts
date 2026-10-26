import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';

export class TransferDto {
  @ApiProperty({
    example: '100.55',
    type: String,
    description: 'Amount to transfer in USD',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive USD amount with up to 2 decimals',
  })
  amount: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  recipientId: string;
}
