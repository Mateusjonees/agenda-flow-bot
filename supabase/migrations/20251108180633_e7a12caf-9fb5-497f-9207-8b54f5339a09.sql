-- Criar tabela para histórico de documentos
CREATE TABLE IF NOT EXISTS public.document_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'proposal_pdf', 'proposal_email', 'contract', 'receipt'
  related_type TEXT NOT NULL, -- 'proposal' ou 'subscription'
  related_id UUID NOT NULL,
  recipient_email TEXT,
  recipient_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;

-- Criar política para que usuários vejam apenas seus próprios documentos
CREATE POLICY "Users can view own document history"
ON public.document_history
FOR SELECT
USING (auth.uid() = user_id);

-- Criar política para que usuários insiram apenas seus próprios documentos
CREATE POLICY "Users can insert own document history"
ON public.document_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX idx_document_history_user_id ON public.document_history(user_id);
CREATE INDEX idx_document_history_created_at ON public.document_history(created_at DESC);
CREATE INDEX idx_document_history_related ON public.document_history(related_type, related_id);