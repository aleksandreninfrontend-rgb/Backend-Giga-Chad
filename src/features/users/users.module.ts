import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { UsersRepository } from './users.repository.js';
import { JwtAuthModule } from '../../auth/jwt-auth.module.js';
import { SessionsModule } from '../../auth/sessions.module.js';

@Module({
  imports: [JwtAuthModule, SessionsModule],
  controllers: [UserController],
  providers: [UserService, UsersRepository],
  exports: [UserService],
})
export class UsersModule {}
