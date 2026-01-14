-- Permitir que admins vejam profiles de usuários com roles
-- Esta política permite:
-- 1. Usuários verem seu próprio perfil
-- 2. Admins verem todos os profiles de usuários que têm role

CREATE POLICY "Admins can view team member profiles" 
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = profiles.id
    )
  )
);