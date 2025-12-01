
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Limpar jobs existentes (caso já existam)
SELECT cron.unschedule('check-pending-platform-payments') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-pending-platform-payments');
SELECT cron.unschedule('check-expired-subscriptions') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-expired-subscriptions');
SELECT cron.unschedule('check-subscription-reminders') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-subscription-reminders');

-- Cron job: Verificar pagamentos PIX pendentes a cada hora
SELECT cron.schedule(
  'check-pending-platform-payments',
  '0 * * * *', -- A cada hora no minuto 0
  $$
  SELECT net.http_post(
    url:='https://pnwelorcrncqltqiyxwx.supabase.co/functions/v1/check-pending-platform-payments',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBud2Vsb3Jjcm5jcWx0cWl5eHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTIyNjAsImV4cCI6MjA3NzkyODI2MH0.Y6xkoKV4V8tAXqceJfnZ8pfWOTn30jUw9paGoPUcVog"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Cron job: Expirar assinaturas diariamente às 3h da manhã
SELECT cron.schedule(
  'check-expired-subscriptions',
  '0 3 * * *', -- Todo dia às 3h
  $$
  SELECT net.http_post(
    url:='https://pnwelorcrncqltqiyxwx.supabase.co/functions/v1/check-expired-subscriptions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBud2Vsb3Jjcm5jcWx0cWl5eHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTIyNjAsImV4cCI6MjA3NzkyODI2MH0.Y6xkoKV4V8tAXqceJfnZ8pfWOTn30jUw9paGoPUcVog"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Cron job: Enviar lembretes de renovação diariamente às 10h
SELECT cron.schedule(
  'check-subscription-reminders',
  '0 10 * * *', -- Todo dia às 10h
  $$
  SELECT net.http_post(
    url:='https://pnwelorcrncqltqiyxwx.supabase.co/functions/v1/check-subscription-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBud2Vsb3Jjcm5jcWx0cWl5eHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTIyNjAsImV4cCI6MjA3NzkyODI2MH0.Y6xkoKV4V8tAXqceJfnZ8pfWOTn30jUw9paGoPUcVog"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
