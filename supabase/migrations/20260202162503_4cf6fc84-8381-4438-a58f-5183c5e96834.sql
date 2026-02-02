-- Plano de Contas Contábil
CREATE TABLE public.accounting_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa', 'custo')),
  parent_id UUID REFERENCES public.accounting_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own accounting accounts"
  ON public.accounting_accounts FOR SELECT
  USING (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can insert own accounting accounts"
  ON public.accounting_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update own accounting accounts"
  ON public.accounting_accounts FOR UPDATE
  USING (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete own accounting accounts"
  ON public.accounting_accounts FOR DELETE
  USING (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

-- Centros de Custo
CREATE TABLE public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own cost centers"
  ON public.cost_centers FOR SELECT
  USING (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can insert own cost centers"
  ON public.cost_centers FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update own cost centers"
  ON public.cost_centers FOR UPDATE
  USING (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete own cost centers"
  ON public.cost_centers FOR DELETE
  USING (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

-- Fornecedores
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  document VARCHAR(20),
  document_type VARCHAR(10) CHECK (document_type IN ('cpf', 'cnpj')),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  postal_code VARCHAR(10),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own suppliers"
  ON public.suppliers FOR SELECT
  USING (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can insert own suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update own suppliers"
  ON public.suppliers FOR UPDATE
  USING (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete own suppliers"
  ON public.suppliers FOR DELETE
  USING (user_id = auth.uid() OR user_id = get_owner_user_id(auth.uid()));

-- Adicionar novos campos à tabela financial_transactions
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) CHECK (recurrence IN ('once', 'weekly', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS document_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounting_accounts(id) ON DELETE SET NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_due_date ON public.financial_transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_supplier_id ON public.financial_transactions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_cost_center_id ON public.financial_transactions(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_account_id ON public.financial_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_user_id ON public.accounting_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_user_id ON public.cost_centers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);

-- Inserir plano de contas padrão (será inserido quando o usuário acessar a primeira vez)
-- Função para criar plano de contas padrão
CREATE OR REPLACE FUNCTION public.create_default_accounting_accounts(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  receita_id UUID;
  despesa_id UUID;
  custo_id UUID;
BEGIN
  -- Verificar se já existe plano de contas para o usuário
  IF EXISTS (SELECT 1 FROM accounting_accounts WHERE user_id = p_user_id) THEN
    RETURN;
  END IF;

  -- RECEITAS
  INSERT INTO accounting_accounts (user_id, code, name, type) 
  VALUES (p_user_id, '1', 'RECEITAS', 'receita') RETURNING id INTO receita_id;
  
  INSERT INTO accounting_accounts (user_id, code, name, type, parent_id) VALUES
  (p_user_id, '1.1', 'Receita Operacional', 'receita', receita_id),
  (p_user_id, '1.2', 'Receita Financeira', 'receita', receita_id),
  (p_user_id, '1.3', 'Outras Receitas', 'receita', receita_id);

  -- DESPESAS
  INSERT INTO accounting_accounts (user_id, code, name, type) 
  VALUES (p_user_id, '2', 'DESPESAS', 'despesa') RETURNING id INTO despesa_id;
  
  INSERT INTO accounting_accounts (user_id, code, name, type, parent_id) VALUES
  (p_user_id, '2.1', 'Despesas Operacionais', 'despesa', despesa_id),
  (p_user_id, '2.2', 'Despesas Administrativas', 'despesa', despesa_id),
  (p_user_id, '2.3', 'Despesas Financeiras', 'despesa', despesa_id),
  (p_user_id, '2.4', 'Impostos e Taxas', 'despesa', despesa_id);

  -- CUSTOS
  INSERT INTO accounting_accounts (user_id, code, name, type) 
  VALUES (p_user_id, '3', 'CUSTOS', 'custo') RETURNING id INTO custo_id;
  
  INSERT INTO accounting_accounts (user_id, code, name, type, parent_id) VALUES
  (p_user_id, '3.1', 'Custo dos Produtos', 'custo', custo_id),
  (p_user_id, '3.2', 'Custo dos Serviços', 'custo', custo_id);
END;
$$;