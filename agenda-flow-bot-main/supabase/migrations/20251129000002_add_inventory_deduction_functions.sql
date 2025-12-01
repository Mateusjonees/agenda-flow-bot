-- Migration: Add inventory deduction RPC functions
-- Date: 2025-11-29
-- Author: AI Assistant
--
-- Propósito:
-- - Criar funções para deduzir estoque de produtos e variantes
-- - Necessário para TAREFA 2B (registrar vendas WhatsApp no financeiro)
--
-- Funções criadas:
-- 1. decrement_product_stock(product_id, quantity) - Deduz estoque do produto
-- 2. decrement_variant_stock(variant_id, quantity) - Deduz estoque da variante

-- =====================================================
-- FUNÇÃO: decrement_product_stock
-- =====================================================
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  product_id uuid,
  quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar estoque do produto
  UPDATE public.products
  SET 
    stock_quantity = GREATEST(0, stock_quantity - quantity),
    updated_at = now()
  WHERE id = product_id;

  -- Se não encontrou o produto, lançar erro
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', product_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.decrement_product_stock IS 
'Decrement product stock quantity by the specified amount. Ensures stock never goes below 0.';

-- =====================================================
-- FUNÇÃO: decrement_variant_stock
-- =====================================================
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
  variant_id uuid,
  quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar estoque da variante
  UPDATE public.product_variants
  SET 
    stock_quantity = GREATEST(0, stock_quantity - quantity),
    updated_at = now()
  WHERE id = variant_id;

  -- Se não encontrou a variante, lançar erro
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product variant not found: %', variant_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.decrement_variant_stock IS 
'Decrement product variant stock quantity by the specified amount. Ensures stock never goes below 0.';
