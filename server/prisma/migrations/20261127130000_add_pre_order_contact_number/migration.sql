-- AlterTable: orders placed before this get an empty contact number.
ALTER TABLE "pre_orders" ADD COLUMN "contactNumber" VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE "pre_orders" ALTER COLUMN "contactNumber" DROP DEFAULT;
