-- Query para verificar todos os CRON jobs ativos
-- Execute esta query no SQL Editor do Supabase Dashboard

SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobname;
