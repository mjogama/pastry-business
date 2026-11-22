-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" TEXT,
    "time" TEXT,
    "temperature" TEXT,
    "description" TEXT,
    "steps" TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "grams" DOUBLE PRECISION,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_entries" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(0) NOT NULL,
    "title" VARCHAR(60) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sales_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_items" (
    "id" TEXT NOT NULL,
    "salesEntryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "sales_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipes_category_idx" ON "recipes"("category");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredients_recipeId_position_key" ON "recipe_ingredients"("recipeId", "position");

-- CreateIndex
CREATE INDEX "sales_entries_date_idx" ON "sales_entries"("date");

-- CreateIndex
CREATE INDEX "sales_items_productName_idx" ON "sales_items"("productName");

-- CreateIndex
CREATE UNIQUE INDEX "sales_items_salesEntryId_position_key" ON "sales_items"("salesEntryId", "position");

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_salesEntryId_fkey" FOREIGN KEY ("salesEntryId") REFERENCES "sales_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
