import { ZodError, type ZodType } from 'zod';

export function validateEnv(
  schema: ZodType,
  config: Record<string, unknown>,
): Record<string, unknown> {
  try {
    const parsed = schema.parse(config) as Record<string, unknown>;
    return { ...config, ...parsed };
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${details}`);
    }
    throw error;
  }
}
