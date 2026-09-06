-- CreateTable
CREATE TABLE "order_counters" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "value" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "order_counters_pkey" PRIMARY KEY ("id")
);
