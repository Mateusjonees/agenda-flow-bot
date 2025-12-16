-- Criar subscription ATIVA para o usuário que teve pagamento aprovado mas subscription não foi criada
-- User ID: 30867504-8da8-405f-a8ab-8909152b8128

INSERT INTO public.subscriptions (
  user_id,
  customer_id,
  plan_id,
  status,
  start_date,
  next_billing_date,
  last_billing_date,
  billing_frequency,
  plan_name,
  payment_method,
  failed_payments_count
) VALUES (
  '30867504-8da8-405f-a8ab-8909152b8128',
  NULL,  -- ✅ Assinatura de plataforma
  NULL,  -- ✅ Assinatura de plataforma
  'active',
  NOW(),
  NOW() + INTERVAL '1 month' + INTERVAL '7 days',  -- 1 mês + 7 dias trial
  NOW(),
  'monthly',
  'Mensal',
  'pix',
  0
)
ON CONFLICT DO NOTHING;