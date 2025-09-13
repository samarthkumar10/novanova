/*
  Warnings:

  - You are about to drop the `tags` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."CustomerState" AS ENUM ('ENABLED', 'DISABLED', 'DECLINED', 'INVITED');

-- CreateEnum
CREATE TYPE "public"."MarketingConsentState" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED', 'NOT_SUBSCRIBED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."MarketingOptInLevel" AS ENUM ('SINGLE_OPT_IN', 'CONFIRMED_OPT_IN', 'UNKNOWN');

-- DropForeignKey
ALTER TABLE "public"."product_tags" DROP CONSTRAINT "product_tags_tagId_fkey";

-- DropTable
DROP TABLE "public"."tags";

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" BIGINT NOT NULL,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "ordersCount" INTEGER NOT NULL,
    "state" "public"."CustomerState" NOT NULL,
    "totalSpent" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "verifiedEmail" BOOLEAN NOT NULL,
    "taxExempt" BOOLEAN NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailMarketingState" "public"."MarketingConsentState" NOT NULL,
    "emailMarketingOptInLevel" "public"."MarketingOptInLevel",
    "emailMarketingConsentUpdatedAt" TIMESTAMP(3),
    "smsMarketingState" "public"."MarketingConsentState" NOT NULL,
    "smsMarketingConsentUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_addresses" (
    "id" BIGINT NOT NULL,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "zip" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "countryCode" TEXT,
    "isDefault" BOOLEAN NOT NULL,
    "customerId" BIGINT NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_tags" (
    "customerId" BIGINT NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "customer_tags_pkey" PRIMARY KEY ("customerId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "public"."customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");

-- AddForeignKey
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "product_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_addresses" ADD CONSTRAINT "customer_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_tags" ADD CONSTRAINT "customer_tags_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_tags" ADD CONSTRAINT "customer_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
