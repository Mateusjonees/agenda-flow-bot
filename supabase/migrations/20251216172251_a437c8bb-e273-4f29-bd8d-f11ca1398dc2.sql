-- Corrigir next_billing_date para subscriptions ativas que têm billing_frequency
-- Remove os 7 dias extras que foram adicionados incorretamente

-- 1. Corrigir subscriptions mensais (deveria ser start_date + 1 mês, não + 1 mês + 7 dias)
UPDATE subscriptions 
SET next_billing_date = start_date + INTERVAL '1 month',
    updated_at = NOW()
WHERE customer_id IS NULL 
  AND plan_id IS NULL
  AND billing_frequency = 'monthly'
  AND status = 'active'
  AND next_billing_date > start_date + INTERVAL '1 month'; -- só corrige se tiver dias extras

-- 2. Corrigir subscriptions semestrais
UPDATE subscriptions 
SET next_billing_date = start_date + INTERVAL '6 months',
    updated_at = NOW()
WHERE customer_id IS NULL 
  AND plan_id IS NULL
  AND billing_frequency = 'semestral'
  AND status = 'active'
  AND next_billing_date > start_date + INTERVAL '6 months';

-- 3. Corrigir subscriptions anuais
UPDATE subscriptions 
SET next_billing_date = start_date + INTERVAL '12 months',
    updated_at = NOW()
WHERE customer_id IS NULL 
  AND plan_id IS NULL
  AND billing_frequency = 'anual'
  AND status = 'active'
  AND next_billing_date > start_date + INTERVAL '12 months';