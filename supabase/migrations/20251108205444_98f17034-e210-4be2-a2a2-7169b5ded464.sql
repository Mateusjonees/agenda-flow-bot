-- Verificar e adicionar colunas necessárias na tabela subscriptions caso não existam
DO $$ 
BEGIN
  -- Adicionar coluna start_date se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Atualizar a função de criação de trial subscription
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
$function$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trial_subscription();

-- Atualizar subscriptions existentes sem start_date
UPDATE public.subscriptions
SET start_date = created_at
WHERE start_date IS NULL;