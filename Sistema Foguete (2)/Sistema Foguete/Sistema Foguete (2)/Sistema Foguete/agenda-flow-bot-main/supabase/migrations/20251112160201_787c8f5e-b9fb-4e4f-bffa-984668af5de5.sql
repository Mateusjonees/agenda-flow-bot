-- Habilitar Realtime para a tabela subscriptions
ALTER TABLE subscriptions REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;