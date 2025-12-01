-- Migration: Add coupon_enabled to business_settings
-- Date: 2025-11-29
-- Author: AI Assistant
--
-- Propósito:
-- - Adicionar campo coupon_enabled para controlar geração automática de cupons pós-atendimento
-- - Padrão: false (desativado) - usuário precisa ativar manualmente nas configurações
--
-- Comportamento:
-- - coupon_enabled = false → NÃO gera cupom, NÃO mostra na mensagem
-- - coupon_enabled = true → Gera cupom 10% desconto, mostra na mensagem pós-venda

-- Adicionar coluna coupon_enabled
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS coupon_enabled BOOLEAN DEFAULT false;

-- Comentário descrevendo o campo
COMMENT ON COLUMN business_settings.coupon_enabled IS 
'Controls automatic coupon generation for post-service messages. When true, generates 10% discount coupons 24h after appointment completion. Default: false (disabled).';
