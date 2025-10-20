-- CreateEnum
CREATE TYPE "BuildingType" AS ENUM ('MAIN', 'SHIPYARD');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "vk_id" BIGINT NOT NULL,
    "name" TEXT,
    "password" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeBase" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "HomeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" SERIAL NOT NULL,
    "type" "BuildingType" NOT NULL,
    "slot_number" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "is_upgraded" BOOLEAN NOT NULL,
    "will_upgrade_at" TIMESTAMP(3),
    "base_id" INTEGER NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_vk_id_key" ON "users"("vk_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeBase" ADD CONSTRAINT "HomeBase_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "HomeBase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
