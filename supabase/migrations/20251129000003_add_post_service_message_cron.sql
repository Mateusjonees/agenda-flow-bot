-- Migration: Add cron job for post-service messages
-- Date: 2025-11-29
-- Author: AI Assistant
--
-- Propósito:
-- - Criar job automático para enviar mensagens pós-venda 24h após atendimento
-- - Envia via WhatsApp e Email
-- - Gera cupom de retorno (10% desconto)
-- - Mostra status do cartão fidelidade
-- - Pede avaliação no Google e Instagram
--
-- Execução: Todo dia às 11:00 AM (horário ideal para engajamento)

-- Garantir que pg_cron está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover job existente se houver
SELECT cron.unschedule('send-post-service-messages') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-post-service-messages'
);

-- Criar job para enviar mensagens pós-venda (todo dia às 11h)
SELECT cron.schedule(
  'send-post-service-messages',
  '0 11 * * *',  -- Todo dia às 11:00 AM
  $$
  SELECT net.http_post(
    url:='https://pnwelorcrncqltqiyxwx.supabase.co/functions/v1/send-post-service-message',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBud2Vsb3Jjcm5jcWx0cWl5eHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTIyNjAsImV4cCI6MjA3NzkyODI2MH0.Y6xkoKV4V8tAXqceJfnZ8pfWOTn30jUw9paGoPUcVog"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- Comentário explicativo
COMMENT ON EXTENSION pg_cron IS 'Automated post-service messages sent 24h after appointment completion. Includes: review request, Google/Instagram links, return coupon (10% off), loyalty card status.';
