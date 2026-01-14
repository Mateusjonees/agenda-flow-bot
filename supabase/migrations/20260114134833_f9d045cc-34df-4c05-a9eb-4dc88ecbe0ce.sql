-- 1. Criar função para buscar subscription do dono
CREATE OR REPLACE FUNCTION public.get_owner_subscription(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  status text,
  next_billing_date timestamptz,
  start_date timestamptz,
  plan_name text,
  billing_frequency text,
  days_remaining integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
BEGIN
  -- Buscar o dono do usuário (usa a função existente)
  owner_id := get_owner_user_id(p_user_id);
  
  RETURN QUERY
  SELECT 
    s.id,
    s.status,
    s.next_billing_date,
    s.start_date,
    s.plan_name,
    s.billing_frequency,
    GREATEST(0, EXTRACT(DAY FROM (s.next_billing_date - NOW()))::integer) as days_remaining
  FROM subscriptions s
  WHERE s.user_id = owner_id 
    AND s.customer_id IS NULL  -- Subscription de plataforma (não de cliente)
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- 2. Atualizar trigger para NÃO criar subscription para colaboradores
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  is_team_member BOOLEAN := false;
BEGIN
  -- Pequena espera para garantir que user_roles foi criado (caso seja colaborador)
  PERFORM pg_sleep(0.3);
  
  -- Verificar se é um membro de equipe (criado por outro usuário)
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = NEW.id AND created_by IS NOT NULL
  ) INTO is_team_member;
  
  -- Só criar subscription se NÃO for membro de equipe
  IF NOT is_team_member THEN
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
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao criar trial subscription: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 3. Limpar subscriptions de colaboradores existentes (que não deveriam ter sido criadas)
DELETE FROM subscriptions 
WHERE user_id IN (
  SELECT user_id FROM user_roles WHERE created_by IS NOT NULL
)
AND customer_id IS NULL
AND type = 'platform';