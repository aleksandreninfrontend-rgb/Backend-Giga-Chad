
CREATE TABLE "cron_runs" (
    "job" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cron_runs_pkey" PRIMARY KEY ("job")
);

INSERT INTO "cron_runs" ("job", "started_at")
VALUES ('outbox-cleanup', TIMESTAMPTZ '1970-01-01 00:00:00+00');
