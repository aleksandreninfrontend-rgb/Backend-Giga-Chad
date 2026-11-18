export { CommonLoggerModule } from './logger/common-logger.module.js';
export { resolveRequestId } from './logger/resolve-request-id.js';

export { Role } from './auth/role.enum.js';
export type { JwtPayload } from './auth/jwt-payload.js';
export {
  ACCESS_JWT,
  DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
} from './auth/constants.js';
export { JwtAuthModule } from './auth/jwt-auth.module.js';
export { AccessTokenGuard } from './auth/guards/access-token.guard.js';
export { RolesGuard } from './auth/guards/roles.guard.js';
export { Public, IS_PUBLIC_KEY } from './auth/decorators/public.decorator.js';
export { Roles, ROLES_KEY } from './auth/decorators/roles.decorator.js';
export { CurrentUser } from './auth/decorators/current-user.decorator.js';

export type { ErrorResponse } from './filters/error-response.js';
export { AllExceptionsFilter } from './filters/all-exceptions.filter.js';

export { KAFKA_CLIENT, TRANSFER_COMPLETED_EVENT } from './kafka/constants.js';
export type { TransferCompletedEvent } from './kafka/transfer-completed.event.js';

export {
  jwtConfig,
  jwtConfigSchema,
  jwtEnvSchema,
  kafkaConfig,
  kafkaConfigSchema,
  kafkaEnvSchema,
  cleanupConfig,
  cleanupConfigSchema,
  cleanupEnvSchema,
  validateEnv,
  DEFAULT_CLEANUP_CRON,
  DEFAULT_AVATAR_CLEANUP_RETENTION_MS,
  DEFAULT_OUTBOX_CLEANUP_RETENTION_MS,
} from './config/index.js';
export type { JwtConfig, KafkaConfig, CleanupConfig } from './config/index.js';
