-- ============================================
-- Trigger para sincronizar licenças de colaboradores
-- quando a subscription do dono é renovada
-- ============================================

-- Função para sincronizar licenças de colaboradores
CREATE OR REPLACE FUNCTION public.sync_team_licenses_on_renewal()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Quando subscription do dono é atualizada para ativa
  -- e tem next_billing_date definido
  IF NEW.status = 'active' 
     AND NEW.customer_id IS NULL  -- É subscription da plataforma
     AND NEW.next_billing_date IS NOT NULL
     AND (OLD.next_billing_date IS NULL OR NEW.next_billing_date > OLD.next_billing_date) THEN
    
    -- Atualizar next_payment_due de todos os colaboradores pagos do dono
    UPDATE user_roles
    SET next_payment_due = NEW.next_billing_date,
        is_paid = true
    WHERE created_by = NEW.user_id
      AND is_paid = true;
    
    RAISE NOTICE 'Sincronizadas licenças de colaboradores para data: %', NEW.next_billing_date;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela subscriptions
DROP TRIGGER IF EXISTS trigger_sync_team_licenses_on_renewal ON public.subscriptions;

CREATE TRIGGER trigger_sync_team_licenses_on_renewal
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_team_licenses_on_renewal();

-- ============================================
-- Função para marcar licenças expiradas
-- ============================================

CREATE OR REPLACE FUNCTION public.expire_overdue_team_licenses()
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE user_roles
  SET is_paid = false
  WHERE next_payment_due < NOW()
    AND is_paid = true
    AND created_by IS NOT NULL;  -- Apenas colaboradores (não donos)
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;

-- ============================================
-- Função para obter dias restantes da licença
-- de um colaborador
-- ============================================

CREATE OR REPLACE FUNCTION public.get_team_member_days_remaining(p_user_id uuid)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_payment_due timestamptz;
  v_days_remaining integer;
BEGIN
  SELECT next_payment_due INTO v_next_payment_due
  FROM user_roles
  WHERE user_id = p_user_id
    AND created_by IS NOT NULL;  -- É um colaborador
  
  IF v_next_payment_due IS NULL THEN
    RETURN NULL;
  END IF;
  
  v_days_remaining := GREATEST(0, EXTRACT(DAY FROM (v_next_payment_due - NOW()))::integer);
  
  RETURN v_days_remaining;
END;
$$;