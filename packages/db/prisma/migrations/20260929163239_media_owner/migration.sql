-- Владелец медиа. Существующие строки получают владельца по автору поста (или сообщения), затем колонка становится обязательной.
ALTER TABLE "media" ADD COLUMN "owner_id" UUID;

UPDATE "media" m SET "owner_id" = p."creator_id" FROM "posts" p WHERE m."post_id" = p."id" AND m."owner_id" IS NULL;
UPDATE "media" m SET "owner_id" = msg."sender_id" FROM "messages" msg WHERE m."message_id" = msg."id" AND m."owner_id" IS NULL;

ALTER TABLE "media" ALTER COLUMN "owner_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "media_owner_id_idx" ON "media"("owner_id");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
