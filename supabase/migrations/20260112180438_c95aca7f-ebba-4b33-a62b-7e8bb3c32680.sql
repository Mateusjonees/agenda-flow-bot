
-- Corrigir a assinatura do usuário d71f0f96-b966-4fbb-bf65-de3ff4f94092
-- Adicionar os 6 dias que não foram somados (deveria ser 18/jul em vez de 12/jul)
UPDATE subscriptions
SET 
  next_billing_date = '2026-07-18 17:11:57.561+00',
  updated_at = now()
WHERE id = '8910538a-62df-407f-9bcd-127e7cc450fa'
  AND user_id = 'd71f0f96-b966-4fbb-bf65-de3ff4f94092';
