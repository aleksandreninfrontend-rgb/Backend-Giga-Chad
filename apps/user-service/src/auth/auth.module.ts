import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthModule, type JwtConfig } from '@app/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../features/users/users.module.js';
import { REFRESH_JWT, REFRESH_TOKEN_EXPIRATION_TIME } from './constants.js';
import { SessionsModule } from './sessions.module.js';

@Module({
  controllers: [AuthController],
  imports: [UsersModule, JwtAuthModule, SessionsModule],
  providers: [
    AuthService,
    {
      provide: REFRESH_JWT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwt = configService.getOrThrow<JwtConfig>('jwt');
        if (!jwt.refreshSecret) {
          throw new Error('JWT_REFRESH_SECRET is required');
        }
        return new JwtService({
          secret: jwt.refreshSecret,
          signOptions: { expiresIn: REFRESH_TOKEN_EXPIRATION_TIME },
        });
      },
    },
  ],
  exports: [AuthService, JwtAuthModule],
})
export class AuthModule {}
