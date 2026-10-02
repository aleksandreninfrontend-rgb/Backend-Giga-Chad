import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'newuser01', minLength: 8, maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  login: string;

  @ApiProperty({
    example: 'Password1!',
    minLength: 8,
    maxLength: 20,
    description: 'At least one uppercase letter and one symbol',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'password must contain at least one uppercase letter and one symbol',
  })
  password: string;

  @ApiProperty({ example: 28, minimum: 1, maximum: 120 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(120)
  age: number;

  @ApiProperty({ example: 'Testing auth register', minLength: 10, maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  description: string;
}
