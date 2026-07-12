-- Hard-guarantee constraints that Prisma's schema DSL cannot express.
-- See docs/ARCHITECTURE.md §11.1 (no double-allocation) and §11.2 (no booking overlap).

-- Required for the GiST EXCLUDE constraint below (allows equality on scalar assetId).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Golden Invariant #2: an asset can have at most ONE active allocation.
CREATE UNIQUE INDEX "one_active_alloc"
  ON "Allocation" ("assetId")
  WHERE status = 'ACTIVE';

-- Golden Invariant #3: no two non-cancelled bookings for the same asset may
-- overlap in time. Half-open interval [startTime, endTime).
ALTER TABLE "Booking"
  ADD CONSTRAINT "no_overlap"
  EXCLUDE USING gist (
    "assetId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE (status <> 'CANCELLED');

-- Atomic source for asset tags (AF-0001, AF-0002, ...). tagGen uses nextval().
CREATE SEQUENCE IF NOT EXISTS "asset_tag_seq" START 1;
