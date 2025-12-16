-- 1. Corrigir o tipo da assinatura para 'platform'
UPDATE subscriptions 
SET type = 'platform'
WHERE id = 'acd3212e-1187-4c19-942a-a66155a8db6c';

-- 2. Excluir os PIX pendentes obsoletos
DELETE FROM pix_charges 
WHERE user_id = 'ac87abd7-4a7b-439e-ba0c-18263603edd1'
AND status = 'pending'
AND metadata->>'type' = 'platform_subscription';