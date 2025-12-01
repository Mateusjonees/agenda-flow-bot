-- Script para atualizar URL do CRON job para produção
-- Execute SOMENTE se você quiser trocar a URL do ambiente de desenvolvimento para produção

-- 1. REMOVER o job antigo
SELECT cron.unschedule('send-post-service-messages');

-- 2. RECRIAR com URL de PRODUÇÃO
SELECT cron.schedule(
  'send-post-service-messages',
  '0 11 * * *',  -- Todo dia às 11:00 AM
  $$
  SELECT net.http_post(
    url:='https://SEU_PROJETO_PRODUCAO.supabase.co/functions/v1/send-post-service-message',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer SUA_ANON_KEY_PRODUCAO"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- IMPORTANTE:
-- Substitua:
-- - SEU_PROJETO_PRODUCAO pela URL real do seu projeto Supabase
-- - SUA_ANON_KEY_PRODUCAO pela chave anon do projeto de produção
-- Encontre em: Dashboard → Settings → API → Project URL e anon/public key
