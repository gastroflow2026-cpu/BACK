-- Migration: Create ORDERS and ORDER_ITEMS tables
-- Date: 2026-04-29
-- Branch: feature/orders-realtime-flow

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM (
        'PENDIENTE',
        'PREPARACION',
        'SERVIDO',
        'LISTA_PARA_PAGAR',
        'PAGADO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

--  enum con valores nuevos
ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'PENDIENTE';
ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'PREPARACION';
ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'SERVIDO';
ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'LISTA_PARA_PAGAR';
ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'PAGADO';

DO $$ BEGIN
    CREATE TYPE order_item_status_enum AS ENUM (
        'PENDIENTE',
        'EN_COCINA',
        'LISTO',
        'ENTREGADO',
        'CANCELADO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─── ORDERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ORDERS" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    display_id INTEGER,
    restaurant_id UUID NOT NULL,
    reservation_id UUID,
    waiter_id UUID NOT NULL,
    table_id UUID NOT NULL,
    status order_status_enum DEFAULT 'PENDIENTE',
    total DECIMAL(10, 2) DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_by UUID,
    payment_method VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES "RESTAURANTS" (id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_reservation FOREIGN KEY (reservation_id) REFERENCES "RESERVATIONS" (id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_waiter FOREIGN KEY (waiter_id) REFERENCES "USERS" (id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_table FOREIGN KEY (table_id) REFERENCES "RESTAURANTS_TABLES" (id) ON DELETE RESTRICT
);

-- Agregar columnas si ya existe la tabla
ALTER TABLE "ORDERS" ADD COLUMN IF NOT EXISTS display_id INTEGER;
ALTER TABLE "ORDERS" ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ORDERS" ADD COLUMN IF NOT EXISTS served_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ORDERS" ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ORDERS" ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ORDERS" ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ORDERS" ADD COLUMN IF NOT EXISTS paid_by UUID;
ALTER TABLE "ORDERS" ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON "ORDERS" (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_waiter_id ON "ORDERS" (waiter_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON "ORDERS" (table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON "ORDERS" (status);
CREATE INDEX IF NOT EXISTS idx_orders_isActive ON "ORDERS" ("isActive");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON "ORDERS" (created_at);

-- ─── ORDER_ITEMS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ORDER_ITEMS" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    menu_item_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    status order_item_status_enum DEFAULT 'PENDIENTE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES "ORDERS" (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES "MENU_ITEMS" (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON "ORDER_ITEMS" (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON "ORDER_ITEMS" (menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON "ORDER_ITEMS" (status);


-- Create ORDER_STATUS enum type
DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM (
        'ABIERTA',
        'EN_PROGRESO',
        'LISTA_PARA_PAGAR',
        'PAGADO',
        'CANCELADO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ORDER_ITEM_STATUS enum type
DO $$ BEGIN
    CREATE TYPE order_item_status_enum AS ENUM (
        'PENDIENTE',
        'EN_COCINA',
        'LISTO',
        'ENTREGADO',
        'CANCELADO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ORDERS table
CREATE TABLE IF NOT EXISTS "ORDERS" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    reservation_id UUID,
    waiter_id UUID NOT NULL,
    table_id UUID NOT NULL,
    status order_status_enum DEFAULT 'ABIERTA',
    total DECIMAL(10, 2) DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES "RESTAURANTS" (id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_reservation FOREIGN KEY (reservation_id) REFERENCES "RESERVATIONS" (id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_waiter FOREIGN KEY (waiter_id) REFERENCES "USERS" (id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_table FOREIGN KEY (table_id) REFERENCES "RESTAURANT_TABLES" (id) ON DELETE RESTRICT
);

-- Create indexes for ORDERS table
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON "ORDERS" (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_waiter_id ON "ORDERS" (waiter_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON "ORDERS" (table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON "ORDERS" (status);
CREATE INDEX IF NOT EXISTS idx_orders_isActive ON "ORDERS" ("isActive");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON "ORDERS" (created_at);

-- Create ORDER_ITEMS table
CREATE TABLE IF NOT EXISTS "ORDER_ITEMS" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    menu_item_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    status order_item_status_enum DEFAULT 'PENDIENTE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES "ORDERS" (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES "MENU_ITEMS" (id) ON DELETE RESTRICT
);

-- Create indexes for ORDER_ITEMS table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON "ORDER_ITEMS" (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON "ORDER_ITEMS" (menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON "ORDER_ITEMS" (status);
