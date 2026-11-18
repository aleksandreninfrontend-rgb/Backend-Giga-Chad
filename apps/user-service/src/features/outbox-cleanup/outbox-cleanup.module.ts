import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { OutboxCleanupService } from './outbox-cleanup.service.js';
import { OutboxCleanupScheduler } from './outbox-cleanup.scheduler.js';

@Module({
  imports: [PrismaModule],
  providers: [OutboxCleanupService, OutboxCleanupScheduler],
})
export class OutboxCleanupModule {}
