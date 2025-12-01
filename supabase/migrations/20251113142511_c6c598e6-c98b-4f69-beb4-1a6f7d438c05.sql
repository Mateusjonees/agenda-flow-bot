-- Adicionar colunas para armazenar informações completas da assinatura
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'semiannual', 'annual')),
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('pix', 'card')),
  ADD COLUMN IF NOT EXISTS plan_name TEXT;