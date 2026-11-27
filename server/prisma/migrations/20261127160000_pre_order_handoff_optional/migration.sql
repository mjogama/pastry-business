-- AlterTable: checkout no longer asks for a grade & section; older orders keep theirs.
ALTER TABLE "pre_orders" ALTER COLUMN "handoff" SET DEFAULT '';
