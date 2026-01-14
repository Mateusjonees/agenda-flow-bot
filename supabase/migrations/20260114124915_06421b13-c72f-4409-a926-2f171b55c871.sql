-- Adicionar campo email na tabela profiles para poder exibir emails dos usuários
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Criar índice para busca por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);