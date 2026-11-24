CREATE TABLE "GoogleCalendarConnection" (
    "userId" UUID NOT NULL,
    "calendarId" TEXT NOT NULL,
    "credential" TEXT NOT NULL,
    "sourceHash" TEXT,
    "lastChecked" TIMESTAMPTZ(3),
    "lastSynced" TIMESTAMPTZ(3),
    "failed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "GoogleCalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
