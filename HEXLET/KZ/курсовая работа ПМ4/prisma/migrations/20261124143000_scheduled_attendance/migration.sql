ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMPTZ(3);

ALTER TABLE "Lesson"
  ADD COLUMN "scheduledSessionId" UUID,
  ADD COLUMN "scheduleTeacherId" UUID,
  ADD COLUMN "scheduleAudience" VARCHAR(220),
  ADD COLUMN "scheduledStudentIds" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];

DROP INDEX "Lesson_groupId_date_startTime_key";
CREATE UNIQUE INDEX "Lesson_groupId_date_startTime_manual"
  ON "Lesson"("groupId", "date", "startTime") WHERE "scheduleTeacherId" IS NULL;
CREATE UNIQUE INDEX "Lesson_schedule_identity"
  ON "Lesson"("groupId", "date", "startTime", "title", "scheduleTeacherId", "scheduleAudience");
CREATE INDEX "Lesson_scheduledSessionId_idx" ON "Lesson"("scheduledSessionId");
CREATE INDEX "Lesson_scheduleTeacherId_groupId_idx" ON "Lesson"("scheduleTeacherId", "groupId");
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_scheduledSessionId_fkey"
  FOREIGN KEY ("scheduledSessionId") REFERENCES "ScheduledSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

WITH projected AS (
  SELECT s.*, g."id" AS "groupId", to_char(time '00:00' + s."startMinute" * interval '1 minute', 'HH24:MI') AS "startTime",
    count(*) OVER (PARTITION BY g."id", s."date", s."startMinute", s."subject") AS alternatives
  FROM "ScheduledSession" s
  JOIN "Group" g ON g."id" = ANY(s."groupIds")
)
UPDATE "Lesson" l
SET "scheduledSessionId" = p."id", "scheduleTeacherId" = p."teacherId",
    "scheduleAudience" = p."audience", "scheduledStudentIds" = p."studentIds"
FROM projected p
WHERE p.alternatives = 1 AND p."groupId" = l."groupId" AND p."date" = l."date"
  AND p."startTime" = l."startTime" AND p."subject" = l."title"
  AND NOT EXISTS (
    SELECT 1 FROM "Attendance" a JOIN "GroupMembership" m ON a."membershipId" = m."id"
    WHERE a."lessonId" = l."id" AND NOT (m."userId" = ANY(p."studentIds"))
  );

INSERT INTO "Lesson" ("id", "groupId", "title", "date", "startTime", "scheduledSessionId",
  "scheduleTeacherId", "scheduleAudience", "scheduledStudentIds")
SELECT gen_random_uuid(), g."id", s."subject", s."date",
  to_char(time '00:00' + s."startMinute" * interval '1 minute', 'HH24:MI'),
  s."id", s."teacherId", s."audience", s."studentIds"
FROM "ScheduledSession" s
JOIN "Group" g ON g."id" = ANY(s."groupIds")
ON CONFLICT ("groupId", "date", "startTime", "title", "scheduleTeacherId", "scheduleAudience") DO NOTHING;
