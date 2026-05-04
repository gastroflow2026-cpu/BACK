-- CASH REGISTER SESSIONS

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'cash_register_session_status'
    ) THEN
        CREATE TYPE cash_register_session_status AS ENUM ('OPEN', 'CLOSED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CASH_REGISTER_SESSIONS" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    cashier_user_id UUID NOT NULL,
    status cash_register_session_status NOT NULL DEFAULT 'OPEN',
    opening_amount NUMERIC(12, 2) NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    cash_sales_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    card_sales_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    transfer_sales_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    qr_sales_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    orders_paid_count INTEGER NOT NULL DEFAULT 0,
    expected_closing_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    declared_closing_amount NUMERIC(12, 2),
    difference_amount NUMERIC(12, 2),
    closing_notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_cash_register_restaurant FOREIGN KEY (restaurant_id) REFERENCES "RESTAURANTS" (id) ON DELETE CASCADE,
    CONSTRAINT fk_cash_register_cashier FOREIGN KEY (cashier_user_id) REFERENCES "USERS" (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_cash_register_restaurant_id
ON "CASH_REGISTER_SESSIONS" (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_cash_register_cashier_user_id
ON "CASH_REGISTER_SESSIONS" (cashier_user_id);

CREATE INDEX IF NOT EXISTS idx_cash_register_status
ON "CASH_REGISTER_SESSIONS" (status);

CREATE INDEX IF NOT EXISTS idx_cash_register_opened_at
ON "CASH_REGISTER_SESSIONS" (opened_at);

-- Asegura que un cajero no tenga más de una caja abierta por restaurante.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_register_open_session
ON "CASH_REGISTER_SESSIONS" (restaurant_id, cashier_user_id)
WHERE status = 'OPEN' AND deleted_at IS NULL;
