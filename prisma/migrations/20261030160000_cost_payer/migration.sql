-- Who paid a cost, when it was not the company card.
-- Existing costs stay null, so they remain company-card costs.

ALTER TABLE "Cost" ADD COLUMN "partnerId" TEXT;

CREATE INDEX "Cost_partnerId_idx" ON "Cost"("partnerId");

ALTER TABLE "Cost" ADD CONSTRAINT "Cost_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
