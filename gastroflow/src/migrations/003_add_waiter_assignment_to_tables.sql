-- TABLE ASSIGNMENTS: one active waiter per table

ALTER TABLE "RESTAURANTS_TABLES"
ADD COLUMN IF NOT EXISTS assigned_waiter_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_restaurants_tables_assigned_waiter'
    ) THEN
        ALTER TABLE "RESTAURANTS_TABLES"
        ADD CONSTRAINT fk_restaurants_tables_assigned_waiter
        FOREIGN KEY (assigned_waiter_id)
        REFERENCES "USERS" (id)
        ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_restaurants_tables_assigned_waiter_id
ON "RESTAURANTS_TABLES" (assigned_waiter_id);
