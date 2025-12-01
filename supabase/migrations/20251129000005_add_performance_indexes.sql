-- Migration: Add Performance Indexes
-- Date: 2025-11-29
-- Author: AI Assistant
--
-- Propósito:
-- - Adicionar índices para otimizar queries mais frequentes
-- - Melhorar performance em conversas WhatsApp, mensagens, pedidos
-- - Reduzir tempo de resposta em até 10x

-- =====================================================
-- ÍNDICES PARA WHATSAPP
-- =====================================================

-- Conversas WhatsApp por telefone e status (busca rápida de conversa ativa)
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone_status 
ON whatsapp_conversations(user_id, whatsapp_phone, status);

-- Conversas por customer_id (histórico do cliente)
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_customer 
ON whatsapp_conversations(customer_id, last_message_at DESC);

-- Mensagens por conversa ordenadas por data (carregar chat)
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_sent 
ON whatsapp_messages(conversation_id, sent_at DESC);

-- Mensagens por whatsapp_message_id (webhook deduplication)
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_whatsapp_id 
ON whatsapp_messages(whatsapp_message_id);

-- =====================================================
-- ÍNDICES PARA E-COMMERCE
-- =====================================================

-- Produtos por user_id e status (listagem de produtos ativos)
CREATE INDEX IF NOT EXISTS idx_products_user_active 
ON products(user_id, is_active, created_at DESC);

-- Produtos por categoria (filtro por categoria)
CREATE INDEX IF NOT EXISTS idx_products_category 
ON products(category_id, is_active);

-- Carrinho ativo por usuário e cliente
CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_customer_status 
ON shopping_carts(user_id, customer_id, status);

-- Itens do carrinho por cart_id
CREATE INDEX IF NOT EXISTS idx_cart_items_cart 
ON cart_items(cart_id);

-- Pedidos por status e usuário (dashboard, filtros)
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created 
ON orders(user_id, status, created_at DESC);

-- Pedidos por número (busca rápida)
CREATE INDEX IF NOT EXISTS idx_orders_order_number 
ON orders(order_number);

-- Pedidos por conversation_id (link WhatsApp)
CREATE INDEX IF NOT EXISTS idx_orders_conversation 
ON orders(conversation_id);

-- Itens do pedido por order_id
CREATE INDEX IF NOT EXISTS idx_order_items_order 
ON order_items(order_id);

-- =====================================================
-- ÍNDICES PARA AGENDAMENTOS E CLIENTES
-- =====================================================

-- Agendamentos por data e status (calendário)
CREATE INDEX IF NOT EXISTS idx_appointments_user_date_status 
ON appointments(user_id, start_time DESC, status);

-- Agendamentos por cliente (histórico)
CREATE INDEX IF NOT EXISTS idx_appointments_customer 
ON appointments(customer_id, start_time DESC);

-- Clientes por whatsapp_phone (auto-creation lookup)
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_phone 
ON customers(user_id, whatsapp_phone);

-- =====================================================
-- ÍNDICES PARA FINANCEIRO
-- =====================================================

-- Transações financeiras por data (relatórios)
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date 
ON financial_transactions(user_id, transaction_date DESC);

-- Transações por categoria
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category 
ON financial_transactions(category_id, transaction_date DESC);

-- PIX charges por txid (webhook lookup)
CREATE INDEX IF NOT EXISTS idx_pix_charges_txid 
ON pix_charges(txid);

-- =====================================================
-- ÍNDICES PARA SISTEMA
-- =====================================================

-- Subscriptions por user_id e tipo (plataforma vs cliente)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_type_status 
ON subscriptions(user_id, type, status, created_at DESC);

-- Reviews por appointment_id (deduplication)
CREATE INDEX IF NOT EXISTS idx_reviews_appointment 
ON reviews(appointment_id);

-- Coupons por código (validação rápida)
CREATE INDEX IF NOT EXISTS idx_coupons_code 
ON coupons(code, is_active);

-- Loyalty cards por customer (busca do cartão)
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer 
ON loyalty_cards(user_id, customer_id);

-- =====================================================
-- ANÁLISE E VERIFICAÇÃO
-- =====================================================

-- Comentário com estatísticas esperadas
COMMENT ON INDEX idx_whatsapp_conversations_phone_status IS 
'Optimizes conversation lookup by phone number. Expected improvement: 5-10x faster on active conversations.';

COMMENT ON INDEX idx_whatsapp_messages_conversation_sent IS 
'Optimizes message loading for chat interface. Expected improvement: 3-5x faster with large message history.';

COMMENT ON INDEX idx_orders_user_status_created IS 
'Optimizes order dashboard and filters. Expected improvement: 5-10x faster on order listings.';

-- Query de verificação (execute após migration)
-- SELECT schemaname, tablename, indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
