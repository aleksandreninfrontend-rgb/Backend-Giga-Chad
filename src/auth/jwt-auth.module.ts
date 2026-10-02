import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import { RolesGuard } from './guards/roles-guard.js';
import { ACCESS_JWT, ACCESS_TOKEN_EXPIRATION_TIME } from './constants.js';

@Module({
  providers: [
    {
      provide: ACCESS_JWT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new JwtService({
          secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
          signOptions: { expiresIn: ACCESS_TOKEN_EXPIRATION_TIME },
        }),
    },
    AccessTokenGuard,
    RolesGuard,
  ],
  exports: [ACCESS_JWT, AccessTokenGuard, RolesGuard],
})
export class JwtAuthModule {}
