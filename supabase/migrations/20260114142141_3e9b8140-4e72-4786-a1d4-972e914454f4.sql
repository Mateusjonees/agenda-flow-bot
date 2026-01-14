-- Corrigir o profile do usuário já criado (buscar dados do user_seat_payments)
UPDATE profiles p
SET 
  email = usp.pending_email,
  full_name = usp.pending_name
FROM user_seat_payments usp
WHERE usp.created_user_id = p.id
  AND (p.email IS NULL OR p.full_name IS NULL);