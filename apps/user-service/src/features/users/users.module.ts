import { Module } from '@nestjs/common';
import { JwtAuthModule } from '@app/common';
import { UserController } from './user.controller.js';
import { AvatarController } from './avatar.controller.js';
import { UserService } from './user.service.js';
import { UsersRepository } from './users.repository.js';
import { AvatarRepository } from './avatar.repository.js';
import { AvatarService } from './avatar.service.js';
import { SessionsModule } from '../../auth/sessions.module.js';
import { FilesModule } from '../../providers/files/files.module.js';
import { OutboxCleanupModule } from '../outbox-cleanup/outbox-cleanup.module.js';

@Module({
  imports: [JwtAuthModule, SessionsModule, FilesModule, OutboxCleanupModule],
  controllers: [UserController, AvatarController],
  providers: [UserService, UsersRepository, AvatarService, AvatarRepository],
  exports: [UserService, AvatarService],
})
export class UsersModule {}
