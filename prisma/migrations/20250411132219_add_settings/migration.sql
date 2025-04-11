-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "enhancedOrderTracking" BOOLEAN NOT NULL DEFAULT false,
    "ga4SessionTracking" BOOLEAN NOT NULL DEFAULT false,
    "emailSmsTracking" BOOLEAN NOT NULL DEFAULT false,
    "ga4MeasurementId" TEXT,
    "checkoutThankYouMessage" TEXT DEFAULT 'Thank you for your purchase!'
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_shop_key" ON "Settings"("shop");
