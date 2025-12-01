-- Adicionar campo CPF/CNPJ na tabela business_settings
ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;