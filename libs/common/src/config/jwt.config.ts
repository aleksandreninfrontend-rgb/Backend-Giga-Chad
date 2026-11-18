import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { DEFAULT_ACCESS_TOKEN_TTL_SECONDS } from '../auth/constants.js';

export const jwtConfigSchema = z.object({
  accessSecret: z.string().min(1),
  refreshSecret: z.string().min(1).optional(),
  accessTokenTtlSeconds: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_ACCESS_TOKEN_TTL_SECONDS),
});

export type JwtConfig = z.infer<typeof jwtConfigSchema>;

export const jwtEnvSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_ACCESS_TOKEN_TTL_SECONDS),
});

export const jwtConfig = registerAs('jwt', (): JwtConfig =>
  jwtConfigSchema.parse({
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenTtlSeconds: process.env.ACCESS_TOKEN_TTL_SECONDS,
  }),
);
