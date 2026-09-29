import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class signInDto {
  @ApiProperty({ example: 'newuser01' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  login: string;

  @ApiProperty({ example: 'Password1!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  password: string;
}
