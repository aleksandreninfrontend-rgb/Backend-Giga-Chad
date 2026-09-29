import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { signInDto } from './dto/signin-dto.js';
import { CreateUserDto } from '../features/users/dto/create-user.dto.js';
import { AuthResponseDto } from './dto/auth-response-dto.js';
import { RefreshTokenDto } from './dto/refresh-token-dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  register(@Body() createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with login and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  signIn(@Body() signInDto: signInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(signInDto.login, signInDto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate access and refresh tokens' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or revoked refresh token' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(refreshTokenDto.refresh_token);
  }
}
