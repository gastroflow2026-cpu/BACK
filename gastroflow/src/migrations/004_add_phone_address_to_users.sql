-- Migration: 004_add_phone_address_to_users
-- Agrega los campos phone y address a la tabla USERS

ALTER TABLE "USERS"
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS address VARCHAR(150);
