-- AlterTable
ALTER TABLE "Order" ADD COLUMN "couponCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "promotionId" INTEGER;
ALTER TABLE "Order" ADD COLUMN "discountAmount" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "Order_promotionId_idx" ON "Order"("promotionId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_promotionId_fkey" 
  FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;
