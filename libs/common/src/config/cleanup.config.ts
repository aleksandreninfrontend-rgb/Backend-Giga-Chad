import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const DEFAULT_CLEANUP_CRON = '0 3 * * *';
export const DEFAULT_AVATAR_CLEANUP_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const DEFAULT_OUTBOX_CLEANUP_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

export const cleanupConfigSchema = z.object({
  avatarCron: z.string().min(1).default(DEFAULT_CLEANUP_CRON),
  avatarRetentionMs: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_AVATAR_CLEANUP_RETENTION_MS),
  outboxCron: z.string().min(1).default(DEFAULT_CLEANUP_CRON),
  outboxRetentionMs: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_OUTBOX_CLEANUP_RETENTION_MS),
});

export type CleanupConfig = z.infer<typeof cleanupConfigSchema>;

export const cleanupEnvSchema = z.object({
  AVATAR_CLEANUP_CRON: z.string().min(1).default(DEFAULT_CLEANUP_CRON),
  AVATAR_CLEANUP_RETENTION_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_AVATAR_CLEANUP_RETENTION_MS),
  OUTBOX_CLEANUP_CRON: z.string().min(1).default(DEFAULT_CLEANUP_CRON),
  OUTBOX_CLEANUP_RETENTION_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_OUTBOX_CLEANUP_RETENTION_MS),
});

export const cleanupConfig = registerAs('cleanup', (): CleanupConfig =>
  cleanupConfigSchema.parse({
    avatarCron: process.env.AVATAR_CLEANUP_CRON,
    avatarRetentionMs: process.env.AVATAR_CLEANUP_RETENTION_MS,
    outboxCron: process.env.OUTBOX_CLEANUP_CRON,
    outboxRetentionMs: process.env.OUTBOX_CLEANUP_RETENTION_MS,
  }),
);
