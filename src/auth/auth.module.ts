import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../features/users/users.module.js';
import { REFRESH_JWT, REFRESH_TOKEN_EXPIRATION_TIME } from './constants.js';
import { JwtAuthModule } from './jwt-auth.module.js';
import { SessionsModule } from './sessions.module.js';

@Module({
  controllers: [AuthController],
  imports: [UsersModule, JwtAuthModule, SessionsModule],
  providers: [
    AuthService,
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
  exports: [AuthService, JwtAuthModule],
})
export class AuthModule {}
