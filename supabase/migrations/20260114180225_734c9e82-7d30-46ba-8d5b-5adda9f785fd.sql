-- Corrigir a data da subscription da conta dev
-- A subscription acumulou 399 dias devido a reprocessamento de pagamentos antigos
-- Vamos resetar para 31 dias a partir de agora (valor correto do pagamento de R$20)

UPDATE subscriptions 
SET 
  next_billing_date = CURRENT_TIMESTAMP + INTERVAL '31 days',
  start_date = CURRENT_TIMESTAMP,
  last_billing_date = CURRENT_TIMESTAMP,
  status = 'active',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'c8bc130c-60e5-497d-aab9-5416e3fffbe5' 
  AND type = 'platform'
  AND customer_id IS NULL;