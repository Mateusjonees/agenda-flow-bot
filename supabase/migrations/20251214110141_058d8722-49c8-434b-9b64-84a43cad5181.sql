-- 1. Atualizar PIX charge para pago
UPDATE pix_charges 
SET 
  status = 'paid',
  paid_at = '2025-12-12T12:00:00Z',
  updated_at = now()
WHERE id = '731c785b-93a9-438c-86e5-47c1a2c4ca1d';

-- 2. Criar assinatura de plataforma para Mateus Jones
INSERT INTO subscriptions (
  user_id,
  status,
  start_date,
  next_billing_date,
  last_billing_date,
  failed_payments_count,
  created_at,
  updated_at
) VALUES (
  'd7e0a46d-286a-45b6-be58-efd9f29d6d7e',
  'active',
  '2025-12-12T00:00:00Z',
  '2026-01-19T00:00:00Z', -- 1 mês + 7 dias trial
  '2025-12-12T00:00:00Z',
  0,
  now(),
  now()
);

-- 3. Criar transação financeira
INSERT INTO financial_transactions (
  user_id,
  type,
  amount,
  description,
  payment_method,
  status,
  transaction_date,
  created_at
) VALUES (
  'd7e0a46d-286a-45b6-be58-efd9f29d6d7e',
  'income',
  97.00,
  'Assinatura monthly - PIX - Plano Foguetinho',
  'pix',
  'completed',
  '2025-12-12T00:00:00Z',
  now()
);