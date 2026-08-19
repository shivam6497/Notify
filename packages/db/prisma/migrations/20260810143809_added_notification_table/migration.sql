-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('EMAIL', 'WEBHOOK', 'IN_APP');

-- AlterTable
ALTER TABLE "EventType" ADD COLUMN     "channels" "Channel"[];

-- CreateTable
CREATE TABLE "NotificationPrefrences" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "eventSlug" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPrefrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "eventSlug" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPrefrences_subscriberId_eventSlug_channel_key" ON "NotificationPrefrences"("subscriberId", "eventSlug", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "NotificationPrefrences" ADD CONSTRAINT "NotificationPrefrences_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
