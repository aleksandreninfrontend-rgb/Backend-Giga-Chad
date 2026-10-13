-- Active avatars per user + latest avatar lookup
CREATE INDEX "Avatar_active_userId_createdAt_id_idx"
ON "Avatar" ("userId", "createdAt" DESC, "id" DESC)
WHERE "deletedAt" IS NULL;
-- Non-deleted users filtered by age, ordered by createdAt
CREATE INDEX "User_active_age_createdAt_idx"
ON "User" ("age", "createdAt" DESC)
WHERE "deletedAt" IS NULL;