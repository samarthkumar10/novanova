/*
  Warnings:

  - The values [deny,continue] on the enum `InventoryPolicy` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,draft,archived] on the enum `ProductStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."FinancialStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PARTIALLY_PAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'VOIDED');

-- CreateEnum
CREATE TYPE "public"."FulfillmentStatus" AS ENUM ('FULFILLED', 'UNFULFILLED', 'PARTIALLY_FULFILLED', 'SCHEDULED', 'ON_HOLD');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."InventoryPolicy_new" AS ENUM ('DENY', 'CONTINUE');
ALTER TABLE "public"."product_variants" ALTER COLUMN "inventoryPolicy" TYPE "public"."InventoryPolicy_new" USING ("inventoryPolicy"::text::"public"."InventoryPolicy_new");
ALTER TYPE "public"."InventoryPolicy" RENAME TO "InventoryPolicy_old";
ALTER TYPE "public"."InventoryPolicy_new" RENAME TO "InventoryPolicy";
DROP TYPE "public"."InventoryPolicy_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ProductStatus_new" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');
ALTER TABLE "public"."products" ALTER COLUMN "status" TYPE "public"."ProductStatus_new" USING ("status"::text::"public"."ProductStatus_new");
ALTER TYPE "public"."ProductStatus" RENAME TO "ProductStatus_old";
ALTER TYPE "public"."ProductStatus_new" RENAME TO "ProductStatus";
DROP TYPE "public"."ProductStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."customer_tags" DROP CONSTRAINT "customer_tags_tagId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_tags" DROP CONSTRAINT "product_tags_tagId_fkey";

-- DropTable
DROP TABLE "public"."Tag";

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "financialStatus" "public"."FinancialStatus",
    "fulfillmentStatus" "public"."FulfillmentStatus",
    "currency" TEXT NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "subtotalPrice" DECIMAL(65,30) NOT NULL,
    "totalTax" DECIMAL(65,30) NOT NULL,
    "totalDiscounts" DECIMAL(65,30) NOT NULL,
    "totalLineItemsPrice" DECIMAL(65,30) NOT NULL,
    "totalShippingPrice" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "note" TEXT,
    "token" TEXT NOT NULL,
    "orderStatusUrl" TEXT,
    "customerId" BIGINT,
    "shippingAddressId" INTEGER,
    "billingAddressId" INTEGER,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."line_items" (
    "id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "variantTitle" TEXT,
    "sku" TEXT,
    "vendor" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "totalDiscount" DECIMAL(65,30) NOT NULL,
    "taxable" BOOLEAN NOT NULL,
    "orderId" BIGINT NOT NULL,
    "productId" BIGINT,
    "variantId" BIGINT,

    CONSTRAINT "line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_addresses" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "zip" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "countryCode" TEXT,

    CONSTRAINT "order_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_tags" (
    "orderId" BIGINT NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "order_tags_pkey" PRIMARY KEY ("orderId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "public"."orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orders_token_key" ON "public"."orders"("token");

-- CreateIndex
CREATE UNIQUE INDEX "orders_shippingAddressId_key" ON "public"."orders"("shippingAddressId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_billingAddressId_key" ON "public"."orders"("billingAddressId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "public"."tags"("name");

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "public"."order_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "public"."order_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."line_items" ADD CONSTRAINT "line_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."line_items" ADD CONSTRAINT "line_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."line_items" ADD CONSTRAINT "line_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "product_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_tags" ADD CONSTRAINT "customer_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_tags" ADD CONSTRAINT "order_tags_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_tags" ADD CONSTRAINT "order_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
