-- Função para criar trial subscription automaticamente
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO subscriptions (
    user_id,
    status,
    start_date,
    next_billing_date,
    last_billing_date,
    failed_payments_count
  ) VALUES (
    NEW.id,
    'trial',
    NOW(),
    NOW() + INTERVAL '7 days',
    NOW(),
    0
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log mas não bloqueia criação do usuário
  RAISE WARNING 'Erro ao criar trial subscription: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger para executar após criação de usuário
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trial_subscription();

-- Política RLS para permitir INSERT via trigger
DROP POLICY IF EXISTS "Allow trial subscription creation via trigger" ON subscriptions;
CREATE POLICY "Allow trial subscription creation via trigger"
ON subscriptions FOR INSERT
WITH CHECK (true);