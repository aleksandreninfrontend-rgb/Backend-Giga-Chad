import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { ACCESS_JWT } from './constants.js';
import type { JwtConfig } from '../config/jwt.config.js';

@Module({
  providers: [
    {
      provide: ACCESS_JWT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwt = configService.getOrThrow<JwtConfig>('jwt');

        return new JwtService({
          secret: jwt.accessSecret,
          signOptions: { expiresIn: `${jwt.accessTokenTtlSeconds}s` },
        });
      },
    },
    AccessTokenGuard,
    RolesGuard,
  ],
  exports: [ACCESS_JWT, AccessTokenGuard, RolesGuard],
})
export class JwtAuthModule {}
