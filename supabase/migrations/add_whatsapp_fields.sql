-- Adicionar colunas WhatsApp nas tabelas existentes
-- Executar no Supabase SQL Editor

-- 1. Adicionar campos WhatsApp na tabela customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_whatsapp_message TIMESTAMP WITH TIME ZONE;

-- 2. Criar índice para busca rápida por número WhatsApp
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp_number) WHERE whatsapp_number IS NOT NULL;

-- 3. Adicionar trigger automático para atualizar whatsapp_number quando phone for alterado
CREATE OR REPLACE FUNCTION sync_whatsapp_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o telefone mudou e tem formato brasileiro, atualizar whatsapp_number
  IF NEW.phone IS NOT NULL AND NEW.phone != OLD.phone THEN
    NEW.whatsapp_number := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_whatsapp ON customers;
CREATE TRIGGER trigger_sync_whatsapp
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION sync_whatsapp_number();

-- 4. Adicionar campos WhatsApp na tabela appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS whatsapp_reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_confirmation_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;

-- 5. Popular whatsapp_number para clientes existentes
UPDATE customers 
SET whatsapp_number = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL AND whatsapp_number IS NULL;

-- 6. Comentários nas colunas
COMMENT ON COLUMN customers.whatsapp_number IS 'Número WhatsApp apenas dígitos (ex: 5511999999999)';
COMMENT ON COLUMN customers.whatsapp_verified IS 'Se o número foi verificado no WhatsApp';
COMMENT ON COLUMN customers.whatsapp_active IS 'Se o cliente aceita mensagens WhatsApp';
COMMENT ON COLUMN customers.last_whatsapp_message IS 'Data/hora da última mensagem enviada';

COMMENT ON COLUMN appointments.whatsapp_reminder_sent IS 'Se lembrete foi enviado via WhatsApp';
COMMENT ON COLUMN appointments.whatsapp_reminder_sent_at IS 'Quando o lembrete foi enviado';
COMMENT ON COLUMN appointments.whatsapp_confirmation_received IS 'Se cliente confirmou via WhatsApp';
COMMENT ON COLUMN appointments.whatsapp_message_id IS 'ID da mensagem na Evolution API';
