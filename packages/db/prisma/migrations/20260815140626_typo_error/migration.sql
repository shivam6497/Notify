/*
  Warnings:

  - You are about to drop the `NotificationPrefrences` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NotificationPrefrences" DROP CONSTRAINT "NotificationPrefrences_subscriberId_fkey";

-- DropTable
DROP TABLE "NotificationPrefrences";

-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "eventSlug" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_subscriberId_eventSlug_channel_key" ON "NotificationPreferences"("subscriberId", "eventSlug", "channel");

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
