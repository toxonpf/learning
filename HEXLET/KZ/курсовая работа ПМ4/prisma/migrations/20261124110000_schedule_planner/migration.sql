-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstName" VARCHAR(80),
ADD COLUMN     "lastName" VARCHAR(80),
ADD COLUMN     "patronymic" VARCHAR(80);

-- CreateTable
CREATE TABLE "SchedulePlan" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "config" JSONB NOT NULL,
    "draft" JSONB,
    "publishedRevision" INTEGER,
    "publishedDraftId" UUID,
    "publishedStartsOn" DATE,
    "publishedEndsOn" DATE,
    "publishedAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SchedulePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledSession" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "studentIds" UUID[],
    "groupIds" UUID[],
    "date" DATE NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "subject" VARCHAR(120) NOT NULL,
    "kind" VARCHAR(48) NOT NULL,
    "audience" VARCHAR(220) NOT NULL,
    "teacherName" VARCHAR(254) NOT NULL,
    "room" VARCHAR(120) NOT NULL,

    CONSTRAINT "ScheduledSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledSession_date_idx" ON "ScheduledSession"("date");

-- CreateIndex
CREATE INDEX "ScheduledSession_teacherId_date_idx" ON "ScheduledSession"("teacherId", "date");

-- CreateIndex
CREATE INDEX "ScheduledSession_studentIds_idx" ON "ScheduledSession" USING GIN ("studentIds");

-- CreateIndex
CREATE INDEX "ScheduledSession_planId_idx" ON "ScheduledSession"("planId");

-- AddForeignKey
ALTER TABLE "ScheduledSession" ADD CONSTRAINT "ScheduledSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SchedulePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledSession" ADD CONSTRAINT "ScheduledSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SchedulePlan"
ADD CONSTRAINT "SchedulePlan_valid_dates" CHECK ("startsOn" <= "endsOn"),
ADD CONSTRAINT "SchedulePlan_valid_publication" CHECK (
    ("publishedAt" IS NULL AND "publishedDraftId" IS NULL AND "publishedRevision" IS NULL
       AND "publishedStartsOn" IS NULL AND "publishedEndsOn" IS NULL)
    OR ("publishedAt" IS NOT NULL AND "publishedDraftId" IS NOT NULL AND "publishedRevision" IS NOT NULL
       AND "publishedStartsOn" IS NOT NULL AND "publishedEndsOn" IS NOT NULL AND "publishedStartsOn" <= "publishedEndsOn")
);

ALTER TABLE "ScheduledSession"
ADD CONSTRAINT "ScheduledSession_valid_time" CHECK ("startMinute" >= 0 AND "startMinute" < "endMinute" AND "endMinute" <= 1440),
ADD CONSTRAINT "ScheduledSession_nonempty_audience" CHECK (
    "studentIds" IS NOT NULL AND cardinality("studentIds") > 0 AND "groupIds" IS NOT NULL AND cardinality("groupIds") > 0
);
