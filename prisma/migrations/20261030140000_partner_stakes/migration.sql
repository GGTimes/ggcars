-- People other than the company can fund a cycle.
-- Existing capital stays company money because partnerId is left null.
-- Existing car shares are not rewritten.

CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner"("userId");

ALTER TABLE "Partner" ADD CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CapitalEntry" ADD COLUMN "partnerId" TEXT;

CREATE INDEX "CapitalEntry_partnerId_idx" ON "CapitalEntry"("partnerId");

ALTER TABLE "CapitalEntry" ADD CONSTRAINT "CapitalEntry_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payout" ADD COLUMN "partnerId" TEXT;

CREATE INDEX "Payout_partnerId_idx" ON "Payout"("partnerId");

ALTER TABLE "Payout" ADD CONSTRAINT "Payout_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CarCapitalShare" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amount" DECIMAL(18,0) NOT NULL,

    CONSTRAINT "CarCapitalShare_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CarCapitalShare_partnerId_idx" ON "CarCapitalShare"("partnerId");

CREATE UNIQUE INDEX "CarCapitalShare_carId_partnerId_key" ON "CarCapitalShare"("carId", "partnerId");

ALTER TABLE "CarCapitalShare" ADD CONSTRAINT "CarCapitalShare_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CarCapitalShare" ADD CONSTRAINT "CarCapitalShare_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
