-- Adicionar campo de origem/fonte do cliente
ALTER TABLE public.customers 
ADD COLUMN source TEXT DEFAULT NULL;

-- Adicionar comentário descritivo
COMMENT ON COLUMN public.customers.source IS 'Origem do cliente: indicação, Facebook, Instagram, Google, etc.';