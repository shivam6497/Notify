/*
  Warnings:

  - You are about to drop the column `wehhookUrl` on the `Subscriber` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Subscriber" DROP COLUMN "wehhookUrl",
ADD COLUMN     "webhookUrl" TEXT;
