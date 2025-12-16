-- 1. Recriar função create_trial_subscription com campos corretos
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO subscriptions (
    user_id,
    status,
    type,
    customer_id,
    plan_id,
    start_date,
    next_billing_date,
    last_billing_date,
    failed_payments_count
  ) VALUES (
    NEW.id,
    'trial',
    'platform',
    NULL,
    NULL,
    NOW(),
    NOW() + INTERVAL '7 days',
    NOW(),
    0
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao criar trial subscription: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 2. Recriar trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trial_subscription();

-- 3. Criar subscriptions de trial/expired para usuários existentes que não têm subscription de plataforma
INSERT INTO subscriptions (user_id, status, type, customer_id, plan_id, start_date, next_billing_date, last_billing_date, failed_payments_count)
SELECT 
  u.id,
  CASE 
    WHEN u.created_at + INTERVAL '7 days' > NOW() THEN 'trial'
    ELSE 'expired'
  END,
  'platform',
  NULL,
  NULL,
  u.created_at,
  u.created_at + INTERVAL '7 days',
  u.created_at,
  0
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s 
  WHERE s.user_id = u.id 
  AND s.customer_id IS NULL 
  AND s.plan_id IS NULL
);