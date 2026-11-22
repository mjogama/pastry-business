/*
  Warnings:

  - You are about to drop the column `amount` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `item` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `kind` on the `recipe_step_tags` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `recipe_step_tags` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `recipe_step_tags` table. All the data in the column will be lost.
  - Added the required column `ingredient_name` to the `recipe_ingredients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `recipe_ingredients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "recipe_ingredients" DROP COLUMN "amount",
DROP COLUMN "item",
ADD COLUMN     "ingredient_name" TEXT NOT NULL,
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "recipe_step_tags" DROP COLUMN "kind",
DROP COLUMN "label",
DROP COLUMN "value",
ADD COLUMN     "description" TEXT;

-- DropEnum
DROP TYPE "StepTagKind";
