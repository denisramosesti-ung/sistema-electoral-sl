-- Add confirmado column to subcoordinadores table
-- This enables coordinadores to independently confirm/unconfirm their subcoordinadores
ALTER TABLE subcoordinadores ADD COLUMN IF NOT EXISTS confirmado BOOLEAN DEFAULT FALSE;
