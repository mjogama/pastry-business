-- CreateEnum
CREATE TYPE "PreOrderStatus" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "business_settings" ADD COLUMN "preOrdersOpen" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "pre_orders" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(8) NOT NULL,
    "customerName" VARCHAR(60) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "handoff" VARCHAR(80) NOT NULL,
    "pickupDate" DATE NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" "PreOrderStatus" NOT NULL DEFAULT 'pending',
    "cancelReason" TEXT,
    "salesEntryId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pre_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_order_items" (
    "id" TEXT NOT NULL,
    "preOrderId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "pre_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pre_orders_code_key" ON "pre_orders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "pre_orders_salesEntryId_key" ON "pre_orders"("salesEntryId");

-- CreateIndex
CREATE INDEX "pre_orders_pickupDate_idx" ON "pre_orders"("pickupDate");

-- CreateIndex
CREATE INDEX "pre_order_items_productId_idx" ON "pre_order_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "pre_order_items_preOrderId_position_key" ON "pre_order_items"("preOrderId", "position");

-- AddForeignKey
ALTER TABLE "pre_orders" ADD CONSTRAINT "pre_orders_salesEntryId_fkey" FOREIGN KEY ("salesEntryId") REFERENCES "sales_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_order_items" ADD CONSTRAINT "pre_order_items_preOrderId_fkey" FOREIGN KEY ("preOrderId") REFERENCES "pre_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_order_items" ADD CONSTRAINT "pre_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
