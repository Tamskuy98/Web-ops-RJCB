-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'warehouse',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price_cost" DOUBLE PRECISION NOT NULL,
    "price_sell" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "hsale_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_sell" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "headersale" (
    "id" SERIAL NOT NULL,
    "allquantity" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "typePayment" TEXT NOT NULL,
    "cash_report" DOUBLE PRECISION NOT NULL,
    "cash" DOUBLE PRECISION NOT NULL,
    "qris" DOUBLE PRECISION NOT NULL,
    "is_deposit" TEXT NOT NULL,

    CONSTRAINT "headersale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restocks" (
    "id" SERIAL NOT NULL,
    "all_qty" INTEGER NOT NULL,
    "total_payment" DOUBLE PRECISION NOT NULL,
    "type_payment" TEXT NOT NULL,
    "cash_on_hand" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cash_hold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qris" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplier" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachment" TEXT,
    "attachment_type" TEXT,
    "note" TEXT,
    "category" TEXT NOT NULL DEFAULT 'RESTOCK',
    "outstanding_pay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'HUTANG',

    CONSTRAINT "restocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restock_details" (
    "id" SERIAL NOT NULL,
    "restock_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "restock_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qris" (
    "id" SERIAL NOT NULL,
    "total_payment" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational" (
    "id" SERIAL NOT NULL,
    "allQty" INTEGER NOT NULL,
    "type_payment" TEXT NOT NULL,
    "total_payment" DOUBLE PRECISION NOT NULL,
    "cash_on_hand" DOUBLE PRECISION NOT NULL,
    "cash_hold" DOUBLE PRECISION NOT NULL,
    "qris" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachment" TEXT,
    "attachment_type" TEXT,
    "note" TEXT,
    "category" TEXT NOT NULL,
    "outstanding_pay" DOUBLE PRECISION,

    CONSTRAINT "operational_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opsdetail" (
    "id" SERIAL NOT NULL,
    "operational_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "opsdetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paydebt" (
    "id" SERIAL NOT NULL,
    "total_payment" DOUBLE PRECISION NOT NULL,
    "type_payment" TEXT NOT NULL,
    "cash_hand" DOUBLE PRECISION NOT NULL,
    "cash_hold" DOUBLE PRECISION NOT NULL,
    "qris" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paydebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt" (
    "id" SERIAL NOT NULL,
    "total_debt" DOUBLE PRECISION NOT NULL,
    "name_debt" TEXT NOT NULL,
    "operational_id" INTEGER,
    "restock_id" INTEGER,
    "type" TEXT NOT NULL,
    "outstanding_pay" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit" (
    "id" SERIAL NOT NULL,
    "hsale_id" TEXT NOT NULL,
    "total_deposit" DOUBLE PRECISION NOT NULL,
    "received_by" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_hsale_id_fkey" FOREIGN KEY ("hsale_id") REFERENCES "headersale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restock_details" ADD CONSTRAINT "restock_details_restock_id_fkey" FOREIGN KEY ("restock_id") REFERENCES "restocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restock_details" ADD CONSTRAINT "restock_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opsdetail" ADD CONSTRAINT "opsdetail_operational_id_fkey" FOREIGN KEY ("operational_id") REFERENCES "operational"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt" ADD CONSTRAINT "debt_operational_id_fkey" FOREIGN KEY ("operational_id") REFERENCES "operational"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt" ADD CONSTRAINT "debt_restock_id_fkey" FOREIGN KEY ("restock_id") REFERENCES "restocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
