-- Remover registros duplicados primeiro (mantendo apenas o mais recente)
DELETE FROM notification_views a
USING notification_views b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.notification_type = b.notification_type
  AND a.notification_id = b.notification_id;

-- Adicionar constraint única para evitar duplicatas
ALTER TABLE notification_views
ADD CONSTRAINT notification_views_user_notification_unique
UNIQUE (user_id, notification_type, notification_id);