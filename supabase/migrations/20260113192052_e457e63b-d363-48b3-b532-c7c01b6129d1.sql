-- Adicionar coluna is_hidden para controle de visibilidade
ALTER TABLE public.testimonials 
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- Aprovar todos os depoimentos pendentes (novos que estavam aguardando)
UPDATE public.testimonials 
SET is_approved = true 
WHERE is_approved = false;

-- Ocultar o depoimento "Maria Oliveira" (fallback estático que você quer remover)
UPDATE public.testimonials 
SET is_hidden = true 
WHERE name = 'Maria Oliveira';

-- Atualizar política de INSERT para impedir aprovação direta via cliente
DROP POLICY IF EXISTS "Anyone can create testimonials" ON public.testimonials;

CREATE POLICY "Anyone can create testimonials" ON public.testimonials
FOR INSERT WITH CHECK (is_approved = false AND is_hidden = false);

-- Criar índice para consultas filtradas
CREATE INDEX IF NOT EXISTS idx_testimonials_visible 
ON public.testimonials (is_approved, is_hidden, is_featured DESC, created_at DESC);