import { z } from 'zod';
import { cleanupEnvSchema, jwtEnvSchema, validateEnv } from '@app/common';

const userServiceEnvSchema = jwtEnvSchema.extend({
  JWT_REFRESH_SECRET: z.string().min(1),
  ...cleanupEnvSchema.shape,
});

export function validateUserServiceEnv(config: Record<string, unknown>) {
  return validateEnv(userServiceEnvSchema, config);
}
