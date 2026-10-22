import { Module } from '@nestjs/common';
import { FilesModule } from '../../providers/files/files.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { BullModule } from '@nestjs/bull';
import { AvatarCleanupService } from './avatar-cleanup.service.js';
import { AvatarCleanupController } from './avatar-cleanup.controller.js';
import { AvatarCleanupProcessor } from './avatar-cleanup.processor.js';
import { AvatarRepository } from '../users/avatar.repository.js';
import { AvatarCleanupScheduler } from './avatar-cleanup.scheduler.js';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    FilesModule,
    PrismaModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get('REDIS_URL', 'redis://localhost:6379'),
      }),
    }),
    BullModule.registerQueue({
      name: 'avatar-cleanup',
    }),
  ],
  controllers: [AvatarCleanupController],
  providers: [
    AvatarCleanupService,
    AvatarCleanupProcessor,
    AvatarRepository,
    AvatarCleanupScheduler,
  ],
})
export class AvatarCleanupModule {}
