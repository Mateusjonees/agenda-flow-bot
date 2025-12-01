-- Adicionar campo color na tabela tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#FF6B35';