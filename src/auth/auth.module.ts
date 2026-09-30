import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../features/users/users.module.js';
import {
  ACCESS_JWT,
  ACCESS_TOKEN_EXPIRATION_TIME,
  REFRESH_JWT,
  REFRESH_TOKEN_EXPIRATION_TIME,
} from './constants.js';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import { RolesGuard } from './guards/roles-guard.js';
import { TokenModule } from './token.module.js';

@Module({
  controllers: [AuthController],
  imports: [UsersModule, TokenModule],
  providers: [
    AuthService,
    AccessTokenGuard,
    RolesGuard,
    {
      provide: ACCESS_JWT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new JwtService({
          secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
          signOptions: { expiresIn: ACCESS_TOKEN_EXPIRATION_TIME },
        }),
    },
    {
      provide: REFRESH_JWT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new JwtService({
          secret: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          signOptions: { expiresIn: REFRESH_TOKEN_EXPIRATION_TIME },
        }),
    },
  ],
  exports: [
    AuthService,
    AccessTokenGuard,
    ACCESS_JWT,
    RolesGuard,
  ],
})
export class AuthModule {}
