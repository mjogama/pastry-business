-- AlterTable
ALTER TABLE "recipes" ADD COLUMN "temperature" JSONB;

-- Move existing values into the new column: C / F become "°C" / "°F".
UPDATE "recipes"
SET "temperature" = jsonb_build_object(
  'unit', CASE "temperatureUnit" WHEN 'C' THEN '°C' ELSE '°F' END,
  'value', "temperatureValue"
)
WHERE "temperatureValue" IS NOT NULL AND "temperatureUnit" IS NOT NULL;

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "temperatureUnit",
DROP COLUMN "temperatureValue";

-- DropEnum
DROP TYPE "TemperatureUnit";
