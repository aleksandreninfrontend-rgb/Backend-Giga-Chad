import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.OutboxUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.outbox.create({ data });
  }

  deleteOlderThanBatch(cutoff: Date, limit: number) {
    return this.prisma.$executeRaw`
      DELETE FROM outbox
      WHERE id IN (
        SELECT id FROM outbox
        WHERE created_at < ${cutoff}
        ORDER BY created_at
        LIMIT ${limit}
      )
    `;
  }

  async tryClaimCronJob(job: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ job: string }[]>`
      UPDATE cron_runs
      SET started_at = now()
      WHERE job = ${job}
        AND (started_at AT TIME ZONE 'UTC')::date < (now() AT TIME ZONE 'UTC')::date
      RETURNING job
    `;
    return rows.length > 0;
  }
}
