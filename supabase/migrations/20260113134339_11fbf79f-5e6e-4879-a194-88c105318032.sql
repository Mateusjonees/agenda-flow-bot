-- Remover política antiga que exige autenticação
DROP POLICY IF EXISTS "Usuarios autenticados podem enviar depoimentos" ON public.testimonials;

-- Nova política: Qualquer pessoa pode enviar depoimento (ficará pendente aprovação)
CREATE POLICY "Qualquer pessoa pode enviar depoimento"
ON public.testimonials
FOR INSERT
WITH CHECK (true);

-- Política para upload de fotos de depoimentos no bucket avatars (anônimo)
CREATE POLICY "Qualquer pessoa pode fazer upload de foto de depoimento"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'testimonials');