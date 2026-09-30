import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { UsersRepository } from './users.repository.js';
import { TokenModule } from '../../auth/token.module.js';

@Module({
  imports: [TokenModule],
  controllers: [UserController],
  providers: [UserService, UsersRepository],
  exports: [UserService],
})
export class UsersModule {}
