import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { UserRepository } from './users.repository.js';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UsersModule {}
