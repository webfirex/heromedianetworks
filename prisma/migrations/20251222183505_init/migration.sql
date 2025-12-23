-- CreateEnum
CREATE TYPE "admin_role" AS ENUM ('admin', 'super_admin', 'editor');

-- CreateEnum
CREATE TYPE "admin_status" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "publisher_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "offer_status" AS ENUM ('active', 'inactive', 'pending', 'terminated');

-- CreateEnum
CREATE TYPE "smartlink_status" AS ENUM ('pending', 'active', 'terminated');

-- CreateEnum
CREATE TYPE "coupon_status" AS ENUM ('active', 'inactive', 'expired');

-- CreateEnum
CREATE TYPE "discount_type" AS ENUM ('percentage', 'fixed');

-- CreateEnum
CREATE TYPE "conversion_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "admin_role" NOT NULL DEFAULT 'admin',
    "status" "admin_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "status" "publisher_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publishers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "offer_url" TEXT NOT NULL,
    "description" TEXT,
    "geo" TEXT,
    "payout" DECIMAL(10,2) NOT NULL,
    "currency" TEXT DEFAULT 'USD',
    "status" "offer_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" UUID NOT NULL,
    "offer_id" INTEGER NOT NULL,
    "publisher_id" UUID NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clicks" (
    "id" SERIAL NOT NULL,
    "click_id" UUID NOT NULL,
    "pub_id" UUID NOT NULL,
    "offer_id" INTEGER NOT NULL,
    "link_id" UUID,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "geo" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversions" (
    "id" SERIAL NOT NULL,
    "click_id" UUID,
    "offer_id" INTEGER NOT NULL,
    "link_id" UUID,
    "pub_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "status" "conversion_status",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smartlinks" (
    "id" UUID NOT NULL,
    "offer_id" INTEGER NOT NULL,
    "publisher_id" UUID NOT NULL,
    "status" "smartlink_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smartlinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount" DECIMAL(10,2) NOT NULL,
    "discount_type" "discount_type" NOT NULL,
    "offer_id" INTEGER NOT NULL,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3) NOT NULL,
    "status" "coupon_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_publishers" (
    "offer_id" INTEGER NOT NULL,
    "publisher_id" UUID NOT NULL,
    "commission_percent" DECIMAL(5,2),
    "commission_cut" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_publishers_pkey" PRIMARY KEY ("offer_id","publisher_id")
);

-- CreateTable
CREATE TABLE "coupon_publishers" (
    "coupon_id" INTEGER NOT NULL,
    "publisher_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_publishers_pkey" PRIMARY KEY ("coupon_id","publisher_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_email_idx" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_status_idx" ON "admins"("status");

-- CreateIndex
CREATE UNIQUE INDEX "publishers_email_key" ON "publishers"("email");

-- CreateIndex
CREATE INDEX "publishers_email_idx" ON "publishers"("email");

-- CreateIndex
CREATE INDEX "publishers_status_idx" ON "publishers"("status");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "offers"("status");

-- CreateIndex
CREATE INDEX "offers_created_at_idx" ON "offers"("created_at");

-- CreateIndex
CREATE INDEX "links_offer_id_idx" ON "links"("offer_id");

-- CreateIndex
CREATE INDEX "links_publisher_id_idx" ON "links"("publisher_id");

-- CreateIndex
CREATE UNIQUE INDEX "links_offer_id_publisher_id_name_key" ON "links"("offer_id", "publisher_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "clicks_click_id_key" ON "clicks"("click_id");

-- CreateIndex
CREATE INDEX "clicks_click_id_idx" ON "clicks"("click_id");

-- CreateIndex
CREATE INDEX "clicks_pub_id_idx" ON "clicks"("pub_id");

-- CreateIndex
CREATE INDEX "clicks_offer_id_idx" ON "clicks"("offer_id");

-- CreateIndex
CREATE INDEX "clicks_link_id_idx" ON "clicks"("link_id");

-- CreateIndex
CREATE INDEX "clicks_timestamp_idx" ON "clicks"("timestamp");

-- CreateIndex
CREATE INDEX "clicks_pub_id_timestamp_idx" ON "clicks"("pub_id", "timestamp");

-- CreateIndex
CREATE INDEX "clicks_pub_id_offer_id_idx" ON "clicks"("pub_id", "offer_id");

-- CreateIndex
CREATE INDEX "conversions_click_id_idx" ON "conversions"("click_id");

-- CreateIndex
CREATE INDEX "conversions_offer_id_idx" ON "conversions"("offer_id");

-- CreateIndex
CREATE INDEX "conversions_link_id_idx" ON "conversions"("link_id");

-- CreateIndex
CREATE INDEX "conversions_pub_id_idx" ON "conversions"("pub_id");

-- CreateIndex
CREATE INDEX "conversions_status_idx" ON "conversions"("status");

-- CreateIndex
CREATE INDEX "conversions_created_at_idx" ON "conversions"("created_at");

-- CreateIndex
CREATE INDEX "conversions_pub_id_created_at_idx" ON "conversions"("pub_id", "created_at");

-- CreateIndex
CREATE INDEX "conversions_pub_id_offer_id_idx" ON "conversions"("pub_id", "offer_id");

-- CreateIndex
CREATE INDEX "smartlinks_status_idx" ON "smartlinks"("status");

-- CreateIndex
CREATE INDEX "smartlinks_publisher_id_idx" ON "smartlinks"("publisher_id");

-- CreateIndex
CREATE UNIQUE INDEX "smartlinks_offer_id_publisher_id_key" ON "smartlinks"("offer_id", "publisher_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_offer_id_idx" ON "coupons"("offer_id");

-- CreateIndex
CREATE INDEX "coupons_status_idx" ON "coupons"("status");

-- CreateIndex
CREATE INDEX "coupons_valid_to_idx" ON "coupons"("valid_to");

-- CreateIndex
CREATE INDEX "offer_publishers_publisher_id_idx" ON "offer_publishers"("publisher_id");

-- CreateIndex
CREATE INDEX "offer_publishers_offer_id_idx" ON "offer_publishers"("offer_id");

-- CreateIndex
CREATE INDEX "coupon_publishers_publisher_id_idx" ON "coupon_publishers"("publisher_id");

-- CreateIndex
CREATE INDEX "coupon_publishers_coupon_id_idx" ON "coupon_publishers"("coupon_id");

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_click_id_fkey" FOREIGN KEY ("click_id") REFERENCES "clicks"("click_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smartlinks" ADD CONSTRAINT "smartlinks_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smartlinks" ADD CONSTRAINT "smartlinks_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_publishers" ADD CONSTRAINT "offer_publishers_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_publishers" ADD CONSTRAINT "offer_publishers_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_publishers" ADD CONSTRAINT "coupon_publishers_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_publishers" ADD CONSTRAINT "coupon_publishers_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
