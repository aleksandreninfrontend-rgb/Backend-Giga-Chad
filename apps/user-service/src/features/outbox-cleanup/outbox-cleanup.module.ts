import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { OutboxCleanupService } from './outbox-cleanup.service.js';
import { OutboxCleanupScheduler } from './outbox-cleanup.scheduler.js';
import { OutboxRepository } from './outbox.repository.js';

@Module({
  imports: [PrismaModule],
  providers: [OutboxRepository, OutboxCleanupService, OutboxCleanupScheduler],
  exports: [OutboxRepository],
})
export class OutboxCleanupModule {}
