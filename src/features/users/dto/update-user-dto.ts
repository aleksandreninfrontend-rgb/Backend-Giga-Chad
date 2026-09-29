import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({ example: 'newuser01', minLength: 8, maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  @IsOptional()
  login: string;

  @ApiPropertyOptional({ example: 28, minimum: 1, maximum: 120 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(120)
  @IsOptional()
  age: number;

  @ApiPropertyOptional({
    example: 'Updated description',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  @IsOptional()
  description: string;
}
