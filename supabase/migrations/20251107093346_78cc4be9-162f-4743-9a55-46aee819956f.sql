-- Criar bucket para documentos de clientes
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-documents', 'customer-documents', false);

-- Criar tabela de documentos de clientes
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para documentos
CREATE POLICY "Users can manage own customer documents"
ON public.customer_documents
FOR ALL
USING (auth.uid() = user_id);

-- Políticas de storage para documentos
CREATE POLICY "Users can view own customer documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'customer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own customer documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'customer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own customer documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'customer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own customer documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'customer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_customer_documents_updated_at
  BEFORE UPDATE ON public.customer_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_customer_documents_user_id ON public.customer_documents(user_id);
CREATE INDEX idx_customer_documents_customer_id ON public.customer_documents(customer_id);

-- Comentários
COMMENT ON TABLE public.customer_documents IS 'Documentos anexados aos clientes (contratos, etc)';
COMMENT ON COLUMN public.customer_documents.file_path IS 'Caminho do arquivo no storage';