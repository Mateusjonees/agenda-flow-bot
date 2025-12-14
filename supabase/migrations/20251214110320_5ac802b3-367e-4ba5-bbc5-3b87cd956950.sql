-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar cron job para verificar pagamentos PIX pendentes a cada hora
SELECT cron.schedule(
  'check-pending-pix-hourly',
  '0 * * * *', -- A cada hora, no minuto 0
  $$
  SELECT
    net.http_post(
        url:='https://pnwelorcrncqltqiyxwx.supabase.co/functions/v1/check-pending-pix',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBud2Vsb3Jjcm5jcWx0cWl5eHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTIyNjAsImV4cCI6MjA3NzkyODI2MH0.Y6xkoKV4V8tAXqceJfnZ8pfWOTn30jUw9paGoPUcVog"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);