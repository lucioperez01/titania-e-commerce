-- AlterTable
ALTER TABLE "Product" ADD COLUMN "length" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "size" TEXT;
ALTER TABLE "Product" ADD COLUMN "width" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Product_size_idx" ON "Product"("size");
