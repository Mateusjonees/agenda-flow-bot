-- 1. Ativar subscriptions com next_billing_date válido (futuro) mas status incorreto
UPDATE subscriptions 
SET status = 'active', updated_at = NOW()
WHERE customer_id IS NULL 
  AND plan_id IS NULL
  AND status IN ('cancelled', 'expired')
  AND next_billing_date > NOW();

-- 2. Expirar subscriptions com next_billing_date no passado que não estão expired
UPDATE subscriptions 
SET status = 'expired', updated_at = NOW()
WHERE customer_id IS NULL 
  AND plan_id IS NULL
  AND status NOT IN ('expired')
  AND next_billing_date <= NOW();