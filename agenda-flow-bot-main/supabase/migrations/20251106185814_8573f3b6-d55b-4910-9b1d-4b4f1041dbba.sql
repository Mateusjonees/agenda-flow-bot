-- Adicionar colunas faltantes na tabela customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Adicionar colunas faltantes na tabela inventory_items
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'un';
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;

-- Copiar dados de quantity para current_stock se quantity existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'quantity') THEN
    UPDATE public.inventory_items SET current_stock = quantity WHERE current_stock = 0;
  END IF;
END $$;

-- Adicionar colunas faltantes na tabela loyalty_cards
ALTER TABLE public.loyalty_cards
  ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_stamps INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stamps_required INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS rewards_redeemed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ;

-- Adicionar colunas faltantes na tabela coupons
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Migrar dados de discount_value
UPDATE public.coupons 
SET discount_percentage = discount_value 
WHERE discount_type = 'percentage' AND discount_percentage IS NULL;

UPDATE public.coupons 
SET discount_amount = discount_value 
WHERE discount_type = 'fixed' AND discount_amount IS NULL;

-- Adicionar colunas faltantes na tabela proposals
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Adicionar colunas faltantes na tabela tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS related_entity_type TEXT,
  ADD COLUMN IF NOT EXISTS related_entity_id UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Criar tabela business_settings
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT,
  profile_image_url TEXT,
  whatsapp_number TEXT,
  email TEXT,
  address TEXT,
  theme_color TEXT DEFAULT '#FF6B35',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" ON public.business_settings
  FOR ALL USING (auth.uid() = user_id);

-- Criar tabela notification_views
CREATE TABLE IF NOT EXISTS public.notification_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL,
  notification_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notification_type, notification_id)
);

ALTER TABLE public.notification_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own views" ON public.notification_views
  FOR ALL USING (auth.uid() = user_id);

-- Criar tabela reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON public.tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_views_user_type_id ON public.notification_views(user_id, notification_type, notification_id);

-- Trigger para business_settings
CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();