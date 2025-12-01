-- Adicionar coluna para preço de custo (valor que comprei o item)
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

COMMENT ON COLUMN inventory_items.cost_price IS 'Preço de custo (quanto custou para comprar)';
COMMENT ON COLUMN inventory_items.unit_price IS 'Preço de venda (quanto vai sair por unidade)';