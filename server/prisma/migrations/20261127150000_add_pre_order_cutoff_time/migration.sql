-- AlterTable: "23:59" keeps the old "end of the day" cut-off.
ALTER TABLE "business_settings" ADD COLUMN "preOrderCutoffTime" VARCHAR(5) NOT NULL DEFAULT '23:59';
