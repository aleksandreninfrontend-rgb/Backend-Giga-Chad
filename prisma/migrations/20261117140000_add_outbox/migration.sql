CREATE TABLE "outbox" (
    "id" TEXT NOT NULL,
    "aggregatetype" TEXT NOT NULL,
    "aggregateid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "outbox_created_at_idx" ON "outbox"("created_at");
