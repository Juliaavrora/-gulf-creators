-- CreateEnum
CREATE TYPE "WebhookProvider" AS ENUM ('stripe', 'mux', 'clerk', 'sumsub');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('fan', 'creator', 'admin');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('phone', 'google', 'apple');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('ar', 'en');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'AED', 'SAR');

-- CreateEnum
CREATE TYPE "CreatorStatus" AS ENUM ('applied', 'approved', 'suspended');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('not_started', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'canceled', 'expired');

-- CreateEnum
CREATE TYPE "AccessMode" AS ENUM ('free', 'subscribers', 'paid');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('pending', 'approved', 'flagged', 'rejected');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('photo', 'video');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('uploading', 'processing', 'ready');

-- CreateEnum
CREATE TYPE "AccessGrantSource" AS ENUM ('subscription', 'purchase', 'gift');

-- CreateEnum
CREATE TYPE "PurchaseKind" AS ENUM ('post_unlock', 'message_unlock', 'tip');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'disputed');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'in_transit', 'paid', 'failed', 'frozen');

-- CreateEnum
CREATE TYPE "ModerationTargetType" AS ENUM ('post', 'message', 'user');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('hide_post', 'warn_creator', 'freeze_payouts', 'block_account');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "auth_provider" "AuthProvider" NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'fan',
    "locale" "Locale" NOT NULL DEFAULT 'ar',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_profiles" (
    "user_id" UUID NOT NULL,
    "handle" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "status" "CreatorStatus" NOT NULL DEFAULT 'applied',
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'not_started',
    "payout_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "subscription_tiers" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price_minor" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL,
    "perks" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subscription_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "fan_id" UUID NOT NULL,
    "tier_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "provider_sub_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "text" TEXT,
    "access_mode" "AccessMode" NOT NULL,
    "min_tier_id" UUID,
    "price_minor" INTEGER,
    "currency" "Currency",
    "published_at" TIMESTAMP(3),
    "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "post_id" UUID,
    "message_id" UUID,
    "kind" "MediaKind" NOT NULL,
    "storage_key" TEXT,
    "provider_asset_id" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'uploading',
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_grants" (
    "id" UUID NOT NULL,
    "fan_id" UUID NOT NULL,
    "post_id" UUID,
    "tier_id" UUID,
    "source" "AccessGrantSource" NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" UUID NOT NULL,
    "fan_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "kind" "PurchaseKind" NOT NULL,
    "target_id" UUID,
    "amount_minor" INTEGER NOT NULL,
    "fee_minor" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL,
    "provider_payment_id" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "fan_id" UUID NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "fan_total_spent_minor" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "text" TEXT,
    "media_id" UUID,
    "price_minor" INTEGER NOT NULL DEFAULT 0,
    "currency" "Currency",
    "is_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "is_broadcast" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "provider_transfer_id" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "target_type" "ModerationTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" UUID NOT NULL,
    "report_id" UUID,
    "target_type" "ModerationTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "action" "ModerationActionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "admin_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "provider" "WebhookProvider" NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_user_id_key" ON "users"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_handle_key" ON "creator_profiles"("handle");

-- CreateIndex
CREATE INDEX "subscription_tiers_creator_id_idx" ON "subscription_tiers"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_provider_sub_id_key" ON "subscriptions"("provider_sub_id");

-- CreateIndex
CREATE INDEX "subscriptions_fan_id_idx" ON "subscriptions"("fan_id");

-- CreateIndex
CREATE INDEX "subscriptions_tier_id_idx" ON "subscriptions"("tier_id");

-- CreateIndex
CREATE INDEX "posts_creator_id_idx" ON "posts"("creator_id");

-- CreateIndex
CREATE INDEX "posts_min_tier_id_idx" ON "posts"("min_tier_id");

-- CreateIndex
CREATE INDEX "media_post_id_idx" ON "media"("post_id");

-- CreateIndex
CREATE INDEX "media_message_id_idx" ON "media"("message_id");

-- CreateIndex
CREATE INDEX "access_grants_fan_id_idx" ON "access_grants"("fan_id");

-- CreateIndex
CREATE INDEX "access_grants_post_id_idx" ON "access_grants"("post_id");

-- CreateIndex
CREATE INDEX "access_grants_tier_id_idx" ON "access_grants"("tier_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_provider_payment_id_key" ON "purchases"("provider_payment_id");

-- CreateIndex
CREATE INDEX "purchases_fan_id_idx" ON "purchases"("fan_id");

-- CreateIndex
CREATE INDEX "purchases_creator_id_idx" ON "purchases"("creator_id");

-- CreateIndex
CREATE INDEX "purchases_target_id_idx" ON "purchases"("target_id");

-- CreateIndex
CREATE INDEX "conversations_fan_id_idx" ON "conversations"("fan_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_creator_id_fan_id_key" ON "conversations"("creator_id", "fan_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_media_id_idx" ON "messages"("media_id");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_provider_transfer_id_key" ON "payouts"("provider_transfer_id");

-- CreateIndex
CREATE INDEX "payouts_creator_id_idx" ON "payouts"("creator_id");

-- CreateIndex
CREATE INDEX "reports_reporter_id_idx" ON "reports"("reporter_id");

-- CreateIndex
CREATE INDEX "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "moderation_actions_report_id_idx" ON "moderation_actions"("report_id");

-- CreateIndex
CREATE INDEX "moderation_actions_admin_id_idx" ON "moderation_actions"("admin_id");

-- CreateIndex
CREATE INDEX "moderation_actions_target_type_target_id_idx" ON "moderation_actions"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_provider_event_id_key" ON "webhook_events"("provider", "provider_event_id");

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_tiers" ADD CONSTRAINT "subscription_tiers_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "subscription_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_min_tier_id_fkey" FOREIGN KEY ("min_tier_id") REFERENCES "subscription_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "subscription_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
