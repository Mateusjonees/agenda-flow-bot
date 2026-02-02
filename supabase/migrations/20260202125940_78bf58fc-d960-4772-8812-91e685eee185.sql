-- Criar tabela para rastrear histórico de emails enviados
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL, -- 'password_reset', 'welcome', 'proposal', 'daily_report', 'reminder', etc
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'failed'
  resend_email_id TEXT, -- ID retornado pelo Resend
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios logs
CREATE POLICY "Users can view their own email logs"
ON public.email_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Política para inserir (via edge functions com service role)
CREATE POLICY "Service role can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX idx_email_logs_email_type ON public.email_logs(email_type);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);

-- Comentários
COMMENT ON TABLE public.email_logs IS 'Histórico de emails enviados via Resend';
COMMENT ON COLUMN public.email_logs.email_type IS 'Tipo: password_reset, welcome, proposal, daily_report, reminder, subscription, post_service';
COMMENT ON COLUMN public.email_logs.resend_email_id IS 'ID do email retornado pela API do Resend para tracking';