-- Adicionar colunas de controle de modo manutenção na tabela business_settings
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS is_maintenance_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS maintenance_message TEXT,
ADD COLUMN IF NOT EXISTS maintenance_estimated_return TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN business_settings.is_maintenance_mode IS 'Ativa/desativa o modo de manutenção do sistema';
COMMENT ON COLUMN business_settings.maintenance_message IS 'Mensagem personalizada exibida na página de manutenção';
COMMENT ON COLUMN business_settings.maintenance_estimated_return IS 'Data/hora estimada de retorno do sistema';