-- CreateEnum
CREATE TYPE "TemperatureUnit" AS ENUM ('C', 'F');

-- CreateEnum
CREATE TYPE "IngredientUnit" AS ENUM ('mg', 'g', 'tsp', 'tbsp', 'c', 'pc');

-- CreateEnum
CREATE TYPE "StepTagKind" AS ENUM ('timer', 'temp');

-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_recipeId_fkey";

-- DropIndex
DROP INDEX "recipe_ingredients_recipeId_position_key";

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "steps",
DROP COLUMN "temperature",
ADD COLUMN     "temperatureUnit" "TemperatureUnit",
ADD COLUMN     "temperatureValue" DOUBLE PRECISION,
DROP COLUMN "quantity",
ADD COLUMN     "quantity" INTEGER;

-- AlterTable
ALTER TABLE "recipe_ingredients" DROP COLUMN "grams",
DROP COLUMN "recipeId",
ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "sectionId" TEXT NOT NULL,
ADD COLUMN     "unit" "IngredientUnit" NOT NULL DEFAULT 'g';

-- CreateTable
CREATE TABLE "recipe_sections" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT,

    CONSTRAINT "recipe_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_step_tags" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" "StepTagKind" NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "recipe_step_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipe_sections_recipeId_position_key" ON "recipe_sections"("recipeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_steps_recipeId_position_key" ON "recipe_steps"("recipeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_step_tags_stepId_position_key" ON "recipe_step_tags"("stepId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredients_sectionId_position_key" ON "recipe_ingredients"("sectionId", "position");

-- AddForeignKey
ALTER TABLE "recipe_sections" ADD CONSTRAINT "recipe_sections_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "recipe_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_step_tags" ADD CONSTRAINT "recipe_step_tags_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "recipe_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

