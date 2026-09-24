import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { signInDto } from './dto/signin-dto.js';
import { CreateUserDto } from '../features/users/dto/create-user.dto.js';
import { AuthResponseDto } from './dto/auth-response-dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    return this.authService.register(createUserDto);
  }

  //   @Post('login')
  //   signIn(@Body() signInDto: signInDto) {
  //     return this.authService.signIn(signInDto.login, signInDto.password);
  //   }
}
