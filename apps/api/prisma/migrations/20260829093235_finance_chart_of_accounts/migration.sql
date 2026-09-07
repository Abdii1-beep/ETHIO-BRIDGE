-- CreateEnum
CREATE TYPE "ChartAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- AlterTable
ALTER TABLE "FinanceTransaction" ADD COLUMN     "accountId" TEXT;

-- CreateTable
CREATE TABLE "ChartAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChartAccountType" NOT NULL,
    "parentId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChartAccount_organizationId_type_idx" ON "ChartAccount"("organizationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ChartAccount_organizationId_code_key" ON "ChartAccount"("organizationId", "code");

-- CreateIndex
CREATE INDEX "FinanceTransaction_organizationId_accountId_idx" ON "FinanceTransaction"("organizationId", "accountId");

-- AddForeignKey
ALTER TABLE "ChartAccount" ADD CONSTRAINT "ChartAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartAccount" ADD CONSTRAINT "ChartAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
