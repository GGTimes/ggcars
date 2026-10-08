-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MANAGER');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CapitalKind" AS ENUM ('INITIAL', 'EXTRA');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('IN_STOCK', 'SOLD');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('REPAIR', 'PARTS', 'TRANSPORT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCycle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'OPEN',
    "initialAmount" DECIMAL(18,0) NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openedById" TEXT NOT NULL,

    CONSTRAINT "BudgetCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitalEntry" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "kind" "CapitalKind" NOT NULL,
    "amount" DECIMAL(18,0) NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapitalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "color" TEXT,
    "plate" TEXT,
    "status" "CarStatus" NOT NULL DEFAULT 'IN_STOCK',
    "purchasePrice" DECIMAL(18,0) NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL,
    "salePrice" DECIMAL(18,0),
    "soldAt" TIMESTAMP(3),
    "totalCost" DECIMAL(18,0),
    "profit" DECIMAL(18,0),
    "companyShare" DECIMAL(18,0),
    "managerShare" DECIMAL(18,0),
    "note" TEXT,
    "boughtById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cost" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "amount" DECIMAL(18,0) NOT NULL,
    "description" TEXT NOT NULL,
    "spentAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "amount" DECIMAL(18,0) NOT NULL,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "BudgetCycle_status_idx" ON "BudgetCycle"("status");

-- CreateIndex
CREATE INDEX "CapitalEntry_cycleId_idx" ON "CapitalEntry"("cycleId");

-- CreateIndex
CREATE INDEX "Car_cycleId_idx" ON "Car"("cycleId");

-- CreateIndex
CREATE INDEX "Car_status_idx" ON "Car"("status");

-- CreateIndex
CREATE INDEX "Cost_carId_idx" ON "Cost"("carId");

-- CreateIndex
CREATE INDEX "Payout_cycleId_idx" ON "Payout"("cycleId");

-- AddForeignKey
ALTER TABLE "BudgetCycle" ADD CONSTRAINT "BudgetCycle_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalEntry" ADD CONSTRAINT "CapitalEntry_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "BudgetCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalEntry" ADD CONSTRAINT "CapitalEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "BudgetCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_boughtById_fkey" FOREIGN KEY ("boughtById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cost" ADD CONSTRAINT "Cost_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cost" ADD CONSTRAINT "Cost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "BudgetCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- One open budget cycle at a time
CREATE UNIQUE INDEX "BudgetCycle_one_open" ON "BudgetCycle" ("status") WHERE "status" = 'OPEN';
