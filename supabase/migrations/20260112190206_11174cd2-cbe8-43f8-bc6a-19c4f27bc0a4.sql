-- 1. Corrigir next_billing_date da assinatura principal (1 mês, não 3)
UPDATE subscriptions
SET 
  next_billing_date = '2026-02-12 17:05:40.919+00',
  updated_at = now()
WHERE id = 'ce8000ab-187a-4fbf-b0d8-be03a053cc96'
  AND user_id = 'd7e0a46d-286a-45b6-be58-efd9f29d6d7e';

-- 2. Desativar assinatura duplicada
UPDATE subscriptions
SET 
  status = 'cancelled',
  updated_at = now()
WHERE id = '526b2deb-16ff-4cb9-bd96-0980f3751e9c'
  AND user_id = 'd7e0a46d-286a-45b6-be58-efd9f29d6d7e';