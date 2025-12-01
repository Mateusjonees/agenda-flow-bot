-- Adicionar campos de configuração de agendamento
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS default_slot_duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS buffer_time INTEGER DEFAULT 0;

-- Criar índice para consultas de business_hours
CREATE INDEX IF NOT EXISTS idx_business_hours_user_day 
ON business_hours(user_id, day_of_week);