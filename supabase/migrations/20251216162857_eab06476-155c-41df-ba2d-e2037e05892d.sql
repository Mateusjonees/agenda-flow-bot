-- Corrigir subscriptions de plataforma que estão com type errado
-- Identifica subscriptions de plataforma pelo critério: customer_id IS NULL AND plan_id IS NULL
UPDATE subscriptions 
SET 
  type = 'platform', 
  updated_at = NOW()
WHERE customer_id IS NULL 
  AND plan_id IS NULL 
  AND (type IS NULL OR type = 'customer' OR type != 'platform');

-- Log para verificar quantos foram atualizados
-- SELECT COUNT(*) as updated_count FROM subscriptions WHERE type = 'platform' AND customer_id IS NULL;