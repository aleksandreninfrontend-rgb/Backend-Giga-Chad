import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../features/users/users.module.js';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_JWT, REFRESH_JWT } from './constants.js';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [AuthController],
  imports: [UsersModule],
  providers: [
    AuthService,
    {
      provide: ACCESS_JWT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new JwtService({
          secret: configService.get('JWT_ACCESS_SECRET'),
          signOptions: { expiresIn: '60s' },
        }),
    },
    {
      provide: REFRESH_JWT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new JwtService({
          secret: configService.get('JWT_REFRESH_SECRET'),
          signOptions: { expiresIn: '604800s' },
        }),
    },
  ],
})
export class AuthModule {}
