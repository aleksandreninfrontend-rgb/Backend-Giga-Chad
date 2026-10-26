import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { AvatarController } from './avatar.controller.js';
import { UserService } from './user.service.js';
import { UsersRepository } from './users.repository.js';
import { AvatarRepository } from './avatar.repository.js';
import { AvatarService } from './avatar.service.js';
import { JwtAuthModule } from '../../auth/jwt-auth.module.js';
import { SessionsModule } from '../../auth/sessions.module.js';
import { FilesModule } from '../../providers/files/files.module.js';

@Module({
  imports: [JwtAuthModule, SessionsModule, FilesModule],
  controllers: [UserController, AvatarController],
  providers: [UserService, UsersRepository, AvatarService, AvatarRepository],
  exports: [UserService, AvatarService],
})
export class UsersModule {}
