-- Migration: Add ai_training column to business_settings
-- Date: 2025-11-29
-- Author: AI Assistant
--
-- Propósito:
-- - Adicionar campo ai_training (JSONB) para armazenar configurações de treinamento da IA
-- - Necessário para TAREFA 2C (agendamento), TAREFA 2E (prompts dinâmicos) e TAREFA 3 (interface)
--
-- Estrutura do ai_training:
-- {
--   "assistant_name": "Assistente Virtual",
--   "personality": "cordial, eficiente e prestativo",
--   "tone": "profissional",
--   "greeting": "Olá! Sou o assistente virtual. Como posso ajudar?",
--   "farewell": "Obrigado pelo contato! Até breve!",
--   "guidelines": "- Priorizar resposta rápida\n- Confirmar dados importantes",
--   "allow_appointment_overlap": false,
--   "default_appointment_duration": 60
-- }

-- Adicionar coluna ai_training
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS ai_training JSONB DEFAULT '{
  "assistant_name": "Assistente Virtual",
  "personality": "cordial, eficiente e prestativo",
  "tone": "profissional",
  "greeting": "Olá! Como posso ajudar?",
  "farewell": "Obrigado pelo contato!",
  "guidelines": "- Seja breve e objetivo\n- Use emojis com moderação\n- Confirme ações importantes",
  "allow_appointment_overlap": false,
  "default_appointment_duration": 60
}'::jsonb;

-- Comentário descrevendo a estrutura
COMMENT ON COLUMN business_settings.ai_training IS 
'AI assistant training configuration. Structure:
{
  "assistant_name": string (nome do assistente),
  "personality": string (personalidade da IA),
  "tone": string (tom de voz: profissional, amigável, casual),
  "greeting": string (mensagem de boas-vindas),
  "farewell": string (mensagem de despedida),
  "guidelines": string (instruções adicionais),
  "allow_appointment_overlap": boolean (permitir agendamentos sobrepostos),
  "default_appointment_duration": integer (duração padrão em minutos)
}';
