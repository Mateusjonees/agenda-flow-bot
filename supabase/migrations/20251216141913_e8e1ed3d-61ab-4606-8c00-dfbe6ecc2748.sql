-- Atualizar subscription do usuário afetado com billing_frequency e plan_name corretos
UPDATE public.subscriptions 
SET 
  billing_frequency = 'monthly',
  plan_name = 'Mensal',
  updated_at = NOW()
WHERE user_id = 'ac87abd7-4a7b-439e-ba0c-18263603edd1'
  AND customer_id IS NULL
  AND plan_id IS NULL
  AND status = 'active';