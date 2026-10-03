-- Additive migration. Run against the intended database during deployment only.
BEGIN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "checkoutKey" VARCHAR(64);
CREATE INDEX IF NOT EXISTS orders_user_checkout_idx ON orders ("userId", "checkoutKey");
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "eventDate" DATE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "eventCity" VARCHAR(100);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "eventVenue" VARCHAR(200);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "eventUrl" VARCHAR(500);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "eventPrice" INTEGER;
ALTER TABLE posts ALTER COLUMN "isPublished" SET DEFAULT false;
COMMIT;
