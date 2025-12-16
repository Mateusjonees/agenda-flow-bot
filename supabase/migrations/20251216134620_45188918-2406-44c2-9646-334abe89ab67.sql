-- Habilitar REPLICA IDENTITY FULL para capturar todos os dados nas mudanças
ALTER TABLE public.pix_charges REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_charges;