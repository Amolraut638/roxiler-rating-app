-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'STORE_OWNER');

-- CreateTable: users
CREATE TABLE "users" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "email"     TEXT         NOT NULL,
    "password"  TEXT         NOT NULL,
    "address"   TEXT         NOT NULL,
    "role"      "Role"       NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: stores
CREATE TABLE "stores" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "email"     TEXT         NOT NULL,
    "address"   TEXT         NOT NULL,
    "ownerId"   TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ratings
CREATE TABLE "ratings" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "storeId"   TEXT         NOT NULL,
    "rating"    INTEGER      NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- users.email must be globally unique (login identifier)
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Enforces the core business rule at the database level.
CREATE UNIQUE INDEX "ratings_userId_storeId_key" ON "ratings"("userId", "storeId");

-- Filter users by name (admin dashboard)
CREATE INDEX "users_name_idx"    ON "users"("name");

-- Filter users by address (admin dashboard)
CREATE INDEX "users_address_idx" ON "users"("address");

-- Filter users by role (e.g. find all STORE_OWNERs)
CREATE INDEX "users_role_idx"    ON "users"("role");

-- Search stores by name
CREATE INDEX "stores_name_idx"    ON "stores"("name");

-- Search stores by address
CREATE INDEX "stores_address_idx" ON "stores"("address");

-- Find all stores owned by a given user (owner dashboard / admin)
CREATE INDEX "stores_ownerId_idx" ON "stores"("ownerId");

CREATE INDEX "ratings_storeId_idx" ON "ratings"("storeId");

ALTER TABLE "stores"
    ADD CONSTRAINT "stores_ownerId_fkey"
    FOREIGN KEY ("ownerId")
    REFERENCES "users"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE "ratings"
    ADD CONSTRAINT "ratings_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "users"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE "ratings"
    ADD CONSTRAINT "ratings_storeId_fkey"
    FOREIGN KEY ("storeId")
    REFERENCES "stores"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE "ratings"
    ADD CONSTRAINT "ratings_rating_range_check"
    CHECK ("rating" >= 1 AND "rating" <= 5);
