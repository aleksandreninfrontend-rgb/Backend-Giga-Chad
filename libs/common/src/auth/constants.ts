export const ACCESS_JWT = 'ACCESS_JWT';

// TODO: revert to 60 for production-like TTL — lengthened for local socket/HTTP testing
export const ACCESS_TOKEN_TTL_SECONDS = 3600;
export const ACCESS_TOKEN_EXPIRATION_TIME = `${ACCESS_TOKEN_TTL_SECONDS}s`;
