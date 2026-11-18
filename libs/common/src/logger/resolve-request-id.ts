import { randomUUID } from 'node:crypto';

export function resolveRequestId(value: unknown, fallback?: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  if (typeof fallback === 'string') {
    const trimmedFallback = fallback.trim();
    if (trimmedFallback.length > 0) {
      return trimmedFallback;
    }
  }
  return randomUUID();
}
