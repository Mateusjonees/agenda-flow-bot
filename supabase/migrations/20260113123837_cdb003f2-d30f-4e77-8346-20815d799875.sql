-- Adicionar campos para controle de processamento idempotente
ALTER TABLE public.pix_charges 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS processed_for TEXT DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.pix_charges.processed_at IS 'Data em que este pagamento foi processado para assinatura. NULL = ainda não processado.';
COMMENT ON COLUMN public.pix_charges.processed_for IS 'Tipo de processamento realizado: platform, customer, order';

-- Criar índice para consultas de pagamentos pendentes de processamento
CREATE INDEX IF NOT EXISTS idx_pix_charges_pending_processing 
ON public.pix_charges (status, processed_at) 
WHERE status = 'paid' AND processed_at IS NULL;