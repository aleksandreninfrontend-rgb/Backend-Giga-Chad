import { jwtEnvSchema, kafkaEnvSchema, validateEnv } from '@app/common';

const notificationServiceEnvSchema = jwtEnvSchema.extend(kafkaEnvSchema.shape);

export function validateNotificationServiceEnv(
  config: Record<string, unknown>,
) {
  return validateEnv(notificationServiceEnvSchema, config);
}
