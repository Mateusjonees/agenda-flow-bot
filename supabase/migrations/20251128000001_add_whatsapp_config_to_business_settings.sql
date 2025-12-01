-- Add whatsapp_config column to business_settings
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS whatsapp_config JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN business_settings.whatsapp_config IS 'WhatsApp Cloud API and OpenAI configuration (whatsapp_phone_number_id, whatsapp_access_token, whatsapp_webhook_secret, whatsapp_verify_token, openai_api_key, default_message)';
