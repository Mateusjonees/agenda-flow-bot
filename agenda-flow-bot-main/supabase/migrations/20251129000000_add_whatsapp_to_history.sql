-- Migration: Add WhatsApp conversations to customer history
-- Author: AI Assistant
-- Date: 2025-11-29
-- 
-- Propósito:
-- - Nenhuma alteração na estrutura do banco (campo context já existe)
-- - Esta migration apenas documenta a feature de resumos IA
-- - O campo whatsapp_conversations.context (JSONB) será usado para armazenar ai_summary
--
-- Estrutura do ai_summary em context:
-- {
--   "ai_summary": {
--     "generated_at": "2025-11-29T14:30:00Z",
--     "trigger_event": "sale" | "appointment" | "transfer" | "inactive",
--     "conversation_outcome": "venda_realizada" | "agendamento_criado" | "duvida_respondida" | "transferido_humano" | "sem_conclusao",
--     "summary": "Resumo em 1-2 frases do que aconteceu",
--     "key_actions": ["Ação 1", "Ação 2"],
--     "customer_needs": ["Necessidade 1", "Necessidade 2"],
--     "pending_actions": "O que está pendente",
--     "next_steps": "Próxima ação recomendada",
--     "message_count": 15
--   }
-- }

-- ✅ Nenhuma alteração necessária no schema
-- O campo whatsapp_conversations.context já existe como JSONB
-- A Edge Function generate-conversation-summary gerará o resumo automaticamente

-- 📋 Para referência: estrutura atual da tabela whatsapp_conversations
-- Verificar que o campo context existe:
DO $$
BEGIN
  -- Verificar se a coluna context existe
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'whatsapp_conversations'
    AND column_name = 'context'
  ) THEN
    RAISE EXCEPTION 'Column context does not exist in whatsapp_conversations table';
  END IF;

  RAISE NOTICE '✅ Migration validation passed: context column exists';
END $$;

-- 🎯 TRIGGERS AUTOMÁTICOS (Eventos que geram resumo):
-- 1. VENDA CONCLUÍDA: Executado em whatsapp-ai-assistant após finalizar_pedido
-- 2. AGENDAMENTO: Executado após agendar_visita (TAREFA 2C futura)
-- 3. TRANSFERÊNCIA HUMANO: Executado após transferir_atendente
-- 4. INATIVIDADE 24H: Cron job futuro (opcional)

COMMENT ON COLUMN whatsapp_conversations.context IS 
'JSONB field storing conversation context and AI-generated summary. Structure:
{
  "ai_summary": {
    "generated_at": timestamp,
    "trigger_event": event type,
    "conversation_outcome": outcome category,
    "summary": brief description,
    "key_actions": actions taken array,
    "customer_needs": needs identified array,
    "pending_actions": pending items,
    "next_steps": recommended follow-up,
    "message_count": number of messages analyzed
  },
  "recent_messages": [...],
  "last_function_calls": [...]
}';
