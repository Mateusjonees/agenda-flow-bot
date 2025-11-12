-- Criar tabela de movimentações de estoque se não existir
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity NUMERIC NOT NULL,
  reason TEXT,
  reference_type TEXT,
  reference_id UUID,
  previous_stock NUMERIC NOT NULL,
  new_stock NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS se ainda não estiver
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Criar função para atualizar estoque (substituir se já existir)
CREATE OR REPLACE FUNCTION public.update_inventory_stock(
  p_item_id UUID,
  p_quantity NUMERIC,
  p_type TEXT,
  p_reason TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock NUMERIC;
  v_new_stock NUMERIC;
  v_user_id UUID;
BEGIN
  -- Buscar estoque atual e user_id
  SELECT current_stock, user_id INTO v_current_stock, v_user_id
  FROM inventory_items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item não encontrado';
  END IF;

  -- Calcular novo estoque
  IF p_type = 'in' THEN
    v_new_stock := v_current_stock + p_quantity;
  ELSIF p_type = 'out' THEN
    v_new_stock := v_current_stock - p_quantity;
  ELSE -- adjustment
    v_new_stock := p_quantity;
  END IF;

  -- Atualizar estoque
  UPDATE inventory_items
  SET current_stock = v_new_stock,
      updated_at = now()
  WHERE id = p_item_id;

  -- Registrar movimentação
  INSERT INTO stock_movements (
    user_id,
    item_id,
    type,
    quantity,
    reason,
    reference_type,
    reference_id,
    previous_stock,
    new_stock
  ) VALUES (
    v_user_id,
    p_item_id,
    p_type,
    p_quantity,
    p_reason,
    p_reference_type,
    p_reference_id,
    v_current_stock,
    v_new_stock
  );
END;
$$;