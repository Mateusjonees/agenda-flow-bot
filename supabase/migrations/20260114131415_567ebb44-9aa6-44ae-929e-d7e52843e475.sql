-- Tabela para pagamentos de licenças de usuários adicionais
CREATE TABLE public.user_seat_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  pending_email TEXT NOT NULL,
  pending_name TEXT NOT NULL,
  pending_password TEXT NOT NULL,
  pending_role TEXT NOT NULL DEFAULT 'vendedor',
  amount NUMERIC DEFAULT 19.00,
  payment_method TEXT CHECK (payment_method IN ('pix', 'card')),
  payment_id TEXT,
  mp_payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  qr_code TEXT,
  qr_code_base64 TEXT,
  ticket_url TEXT,
  checkout_url TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_seat_payments ENABLE ROW LEVEL SECURITY;

-- Policy: owners can manage their own payments
CREATE POLICY "Users can manage own user seat payments"
ON public.user_seat_payments
FOR ALL
USING (auth.uid() = owner_user_id);

-- Index for faster lookups
CREATE INDEX idx_user_seat_payments_owner ON public.user_seat_payments(owner_user_id);
CREATE INDEX idx_user_seat_payments_status ON public.user_seat_payments(status);
CREATE INDEX idx_user_seat_payments_mp_id ON public.user_seat_payments(mp_payment_id);

-- Adicionar campos de controle de pagamento na tabela user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_payment_due TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS seat_payment_id UUID REFERENCES public.user_seat_payments(id);