import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { ACCESS_JWT, DEFAULT_ACCESS_TOKEN_TTL_SECONDS } from './constants.js';

@Module({
  providers: [
    {
      provide: ACCESS_JWT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const ttlSeconds = Number(
          configService.get(
            'ACCESS_TOKEN_TTL_SECONDS',
            String(DEFAULT_ACCESS_TOKEN_TTL_SECONDS),
          ),
        );

        return new JwtService({
          secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
          signOptions: { expiresIn: `${ttlSeconds}s` },
        });
      },
    },
    AccessTokenGuard,
    RolesGuard,
  ],
  exports: [ACCESS_JWT, AccessTokenGuard, RolesGuard],
})
export class JwtAuthModule {}
