-- Adicionar configurações de fidelidade ao business_settings
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS loyalty_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS loyalty_stamps_required integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS loyalty_points_per_visit integer DEFAULT 1;

-- Comentários para documentação
COMMENT ON COLUMN business_settings.loyalty_enabled IS 'Se o programa de fidelidade está ativo';
COMMENT ON COLUMN business_settings.loyalty_stamps_required IS 'Número de carimbos/visitas necessários para ganhar recompensa';
COMMENT ON COLUMN business_settings.loyalty_points_per_visit IS 'Pontos ganhos por visita';