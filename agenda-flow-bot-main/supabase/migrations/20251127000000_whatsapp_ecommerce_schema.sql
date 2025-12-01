-- =====================================================
-- MIGRATION: WhatsApp E-commerce Schema
-- Data: 2025-11-27
-- Descrição: Schema completo para vendedor WhatsApp 24/7
-- Autor: Sistema Foguete
-- =====================================================

-- =====================================================
-- PARTE 1: EXTENSÕES NECESSÁRIAS
-- =====================================================

-- Habilitar extensão pgvector para embeddings (RAG - Fase 2)
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- PARTE 2: TIPOS ENUMERADOS (ENUMS)
-- =====================================================

-- Status de conversas WhatsApp
CREATE TYPE whatsapp_conversation_status AS ENUM (
  'active',           -- Conversa ativa
  'waiting_response', -- Aguardando resposta do cliente
  'waiting_human',    -- Transferido para atendimento humano
  'resolved',         -- Resolvida
  'abandoned'         -- Abandonada pelo cliente
);

-- Tipos de mensagem WhatsApp
CREATE TYPE whatsapp_message_type AS ENUM (
  'text',
  'image',
  'video',
  'document',
  'audio',
  'location',
  'contacts',
  'interactive_button',
  'interactive_list',
  'template'
);

-- Direção da mensagem
CREATE TYPE message_direction AS ENUM (
  'inbound',  -- Cliente → Sistema
  'outbound'  -- Sistema → Cliente
);

-- Status do pedido
CREATE TYPE order_status AS ENUM (
  'draft',              -- Rascunho (carrinho não finalizado)
  'pending_payment',    -- Aguardando pagamento
  'payment_confirmed',  -- Pagamento confirmado
  'processing',         -- Em separação
  'shipped',            -- Enviado
  'delivered',          -- Entregue
  'cancelled',          -- Cancelado
  'refunded'            -- Reembolsado
);

-- Status do carrinho
CREATE TYPE cart_status AS ENUM (
  'active',    -- Carrinho ativo
  'abandoned', -- Abandonado
  'converted'  -- Convertido em pedido
);

-- =====================================================
-- PARTE 3: EXTENSÃO DA TABELA CUSTOMERS
-- =====================================================

-- Adicionar campos WhatsApp na tabela customers existente
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_name text,
  ADD COLUMN IF NOT EXISTS last_whatsapp_interaction timestamptz;

-- Índice para otimizar buscas por WhatsApp
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_phone ON public.customers(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_opt_in ON public.customers(whatsapp_opt_in) WHERE whatsapp_opt_in = true;

-- =====================================================
-- PARTE 4: CATEGORIAS DE PRODUTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT product_categories_name_user_unique UNIQUE(user_id, name)
);

-- Índices
CREATE INDEX idx_product_categories_user ON public.product_categories(user_id);
CREATE INDEX idx_product_categories_parent ON public.product_categories(parent_id);
CREATE INDEX idx_product_categories_active ON public.product_categories(is_active) WHERE is_active = true;

-- =====================================================
-- PARTE 5: PRODUTOS (CATÁLOGO E-COMMERCE)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  
  -- Informações básicas
  name text NOT NULL,
  description text,
  short_description text,
  sku text, -- Código único do produto
  
  -- Preços
  price numeric(10,2) NOT NULL DEFAULT 0,
  compare_at_price numeric(10,2), -- Preço "De:" para mostrar desconto
  cost_price numeric(10,2), -- Custo (interno)
  
  -- Estoque
  track_inventory boolean DEFAULT true,
  stock_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  allow_backorder boolean DEFAULT false,
  
  -- Dimensões (para cálculo de frete)
  weight_grams integer, -- Peso em gramas
  length_cm numeric(6,2), -- Comprimento em cm
  width_cm numeric(6,2), -- Largura em cm
  height_cm numeric(6,2), -- Altura em cm
  
  -- SEO & Marketing
  meta_title text,
  meta_description text,
  tags text[], -- Array de tags para busca
  
  -- Envio
  requires_shipping boolean DEFAULT true, -- Produto digital = false
  
  -- Limites
  max_quantity_per_order integer, -- Limite por pedido (produtos escassos)
  
  -- Status
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false, -- Produto em destaque
  
  -- Controle
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT products_sku_user_unique UNIQUE(user_id, sku)
);

-- Índices
CREATE INDEX idx_products_user ON public.products(user_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_tags ON public.products USING gin(tags); -- GIN index para arrays

-- =====================================================
-- PARTE 6: VARIANTES DE PRODUTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Identificação
  sku text NOT NULL, -- SKU único da variante
  name text NOT NULL, -- Ex: "Tamanho M - Cor Azul"
  
  -- Atributos (JSON flexível)
  attributes jsonb DEFAULT '{}', -- Ex: {"size": "M", "color": "blue"}
  
  -- Preço específico (opcional - se diferente do produto pai)
  price numeric(10,2),
  compare_at_price numeric(10,2),
  
  -- Estoque específico
  stock_quantity integer DEFAULT 0,
  
  -- Status
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT product_variants_sku_unique UNIQUE(sku)
);

-- Índices
CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_active ON public.product_variants(is_active) WHERE is_active = true;
CREATE INDEX idx_product_variants_attributes ON public.product_variants USING gin(attributes);

-- =====================================================
-- PARTE 7: IMAGENS DE PRODUTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  
  url text NOT NULL, -- URL da imagem (Supabase Storage)
  alt_text text, -- Texto alternativo (acessibilidade)
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false, -- Imagem principal
  
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_product_images_product ON public.product_images(product_id);
CREATE INDEX idx_product_images_variant ON public.product_images(variant_id);
CREATE INDEX idx_product_images_primary ON public.product_images(is_primary) WHERE is_primary = true;

-- =====================================================
-- PARTE 8: VÍNCULO PRODUTO ↔ ESTOQUE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_inventory_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  
  quantity_needed numeric(10,3) DEFAULT 1, -- Quantos itens de estoque são necessários
  
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT product_inventory_unique UNIQUE(product_id, variant_id, inventory_item_id)
);

-- Índices
CREATE INDEX idx_product_inventory_product ON public.product_inventory_items(product_id);
CREATE INDEX idx_product_inventory_variant ON public.product_inventory_items(variant_id);
CREATE INDEX idx_product_inventory_item ON public.product_inventory_items(inventory_item_id);

-- =====================================================
-- PARTE 9: CONVERSAS WHATSAPP
-- =====================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Identificação WhatsApp
  whatsapp_phone text NOT NULL, -- Telefone do cliente
  whatsapp_name text, -- Nome do perfil WhatsApp
  
  -- Status da conversa
  status whatsapp_conversation_status DEFAULT 'active',
  
  -- Contexto da IA
  context jsonb DEFAULT '{}', -- Histórico resumido, intenções detectadas
  last_intent text, -- Última intenção detectada (compra, dúvida, suporte)
  
  -- Categorização
  tags text[], -- Tags para filtros/relatórios
  
  -- Controle de atendimento
  assigned_to_human boolean DEFAULT false,
  assigned_to_user_id uuid REFERENCES auth.users(id),
  
  -- Métricas
  message_count integer DEFAULT 0,
  response_time_avg_seconds integer, -- Tempo médio de resposta
  
  -- Timestamps
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_whatsapp_conversations_user ON public.whatsapp_conversations(user_id);
CREATE INDEX idx_whatsapp_conversations_customer ON public.whatsapp_conversations(customer_id);
CREATE INDEX idx_whatsapp_conversations_phone ON public.whatsapp_conversations(whatsapp_phone);
CREATE INDEX idx_whatsapp_conversations_status ON public.whatsapp_conversations(status);
CREATE INDEX idx_whatsapp_conversations_last_message ON public.whatsapp_conversations(last_message_at DESC);

-- =====================================================
-- PARTE 10: MENSAGENS WHATSAPP
-- =====================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  
  -- Identificação WhatsApp
  whatsapp_message_id text UNIQUE, -- ID da mensagem no WhatsApp
  
  -- Direção e tipo
  direction message_direction NOT NULL,
  message_type whatsapp_message_type NOT NULL,
  
  -- Conteúdo
  content text, -- Texto da mensagem
  media_url text, -- URL de mídia (imagem, vídeo, etc)
  media_mime_type text,
  metadata jsonb DEFAULT '{}', -- Dados adicionais (botões clicados, etc)
  
  -- Status de entrega (para mensagens enviadas)
  status text, -- sent, delivered, read, failed
  error_message text,
  
  -- Processamento IA
  ai_processed boolean DEFAULT false,
  ai_response jsonb, -- Resposta da IA (intent, entities, confidence)
  
  -- Timestamps
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_whatsapp_id ON public.whatsapp_messages(whatsapp_message_id);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_messages_direction ON public.whatsapp_messages(direction);

-- =====================================================
-- PARTE 11: TEMPLATES WHATSAPP
-- =====================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificação Meta
  template_name text NOT NULL, -- Nome no Meta Business
  template_language text DEFAULT 'pt_BR',
  template_category text, -- MARKETING, UTILITY, AUTHENTICATION
  
  -- Status de aprovação
  status text DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason text,
  
  -- Conteúdo
  header_text text,
  body_text text NOT NULL,
  footer_text text,
  buttons jsonb DEFAULT '[]', -- Botões configurados
  
  -- Variáveis
  variables jsonb DEFAULT '[]', -- Lista de variáveis {{1}}, {{2}}
  
  -- Uso
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT whatsapp_templates_name_user_unique UNIQUE(user_id, template_name)
);

-- Índices
CREATE INDEX idx_whatsapp_templates_user ON public.whatsapp_templates(user_id);
CREATE INDEX idx_whatsapp_templates_status ON public.whatsapp_templates(status);

-- =====================================================
-- PARTE 12: CARRINHOS DE COMPRAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shopping_carts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
  
  -- Status
  status cart_status DEFAULT 'active',
  
  -- Valores
  subtotal numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  shipping_cost numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  
  -- Cupom aplicado
  coupon_id uuid REFERENCES public.coupons(id),
  coupon_discount numeric(10,2) DEFAULT 0,
  
  -- Controle
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  converted_to_order_id uuid, -- FK será criada após tabela orders
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_shopping_carts_user ON public.shopping_carts(user_id);
CREATE INDEX idx_shopping_carts_customer ON public.shopping_carts(customer_id);
CREATE INDEX idx_shopping_carts_conversation ON public.shopping_carts(conversation_id);
CREATE INDEX idx_shopping_carts_status ON public.shopping_carts(status);
CREATE INDEX idx_shopping_carts_expires ON public.shopping_carts(expires_at) WHERE status = 'active';

-- =====================================================
-- PARTE 13: ITENS DO CARRINHO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id uuid NOT NULL REFERENCES public.shopping_carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL, -- Preço no momento da adição
  subtotal numeric(10,2) NOT NULL, -- quantity * unit_price
  
  -- Snapshot do produto (caso seja deletado depois)
  product_snapshot jsonb, -- Nome, descrição, etc
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0)
);

-- Índices
CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON public.cart_items(product_id);
CREATE INDEX idx_cart_items_variant ON public.cart_items(variant_id);

-- =====================================================
-- PARTE 14: ENDEREÇOS DE ENTREGA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shipping_addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Identificação
  label text, -- Ex: "Casa", "Trabalho"
  recipient_name text NOT NULL,
  recipient_phone text,
  
  -- Endereço
  street text NOT NULL,
  number text NOT NULL,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL, -- UF
  postal_code text NOT NULL, -- CEP
  country text DEFAULT 'Brasil',
  
  -- Referência
  reference text, -- Ponto de referência
  
  -- Geolocalização (opcional)
  latitude numeric(10,8),
  longitude numeric(11,8),
  
  -- Controle
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_shipping_addresses_user ON public.shipping_addresses(user_id);
CREATE INDEX idx_shipping_addresses_customer ON public.shipping_addresses(customer_id);
CREATE INDEX idx_shipping_addresses_default ON public.shipping_addresses(is_default) WHERE is_default = true;

-- =====================================================
-- PARTE 15: PEDIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  cart_id uuid REFERENCES public.shopping_carts(id),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id),
  
  -- Número do pedido (legível)
  order_number text UNIQUE NOT NULL,
  
  -- Status
  status order_status DEFAULT 'pending_payment',
  
  -- Valores
  subtotal numeric(10,2) NOT NULL,
  discount numeric(10,2) DEFAULT 0,
  shipping_cost numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  
  -- Cupom
  coupon_id uuid REFERENCES public.coupons(id),
  coupon_code text,
  coupon_discount numeric(10,2) DEFAULT 0,
  
  -- Endereço de entrega (snapshot)
  shipping_address jsonb NOT NULL, -- Dados do endereço no momento do pedido
  
  -- Entrega
  shipping_method text, -- PAC, SEDEX, Motoboy, etc
  tracking_code text,
  estimated_delivery_date date,
  delivered_at timestamptz,
  
  -- Pagamento
  payment_method text, -- pix, credit_card, boleto
  pix_charge_id uuid REFERENCES public.pix_charges(id),
  payment_confirmed_at timestamptz,
  
  -- Notas
  customer_notes text,
  internal_notes text,
  
  -- Nota fiscal
  invoice_url text, -- Link para NF-e
  
  -- Reembolso
  refund_amount numeric(10,2), -- Valor reembolsado (pode ser parcial)
  refunded_at timestamptz, -- Data do reembolso
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  cancellation_reason text
);

-- Índices
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_orders_pix_charge ON public.orders(pix_charge_id);

-- =====================================================
-- PARTE 16: ITENS DO PEDIDO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  
  -- Snapshot do produto (imutável)
  product_name text NOT NULL,
  product_sku text,
  variant_name text,
  variant_attributes jsonb,
  
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  
  -- Baixa de estoque
  inventory_deducted boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0)
);

-- Índices
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- =====================================================
-- PARTE 17: FK CRUZADA (SHOPPING_CARTS → ORDERS)
-- =====================================================

ALTER TABLE public.shopping_carts 
  ADD CONSTRAINT shopping_carts_order_fkey 
  FOREIGN KEY (converted_to_order_id) 
  REFERENCES public.orders(id);

-- =====================================================
-- PARTE 17B: HISTÓRICO DE STATUS DOS PEDIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  changed_by_user_id uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_order_status_history_order ON public.order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON public.order_status_history(created_at DESC);

-- RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order status history" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_status_history.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert order status history" ON public.order_status_history
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_status_history.order_id 
    AND orders.user_id = auth.uid()
  ));

-- =====================================================
-- PARTE 18: TRIGGERS DE ATUALIZAÇÃO
-- =====================================================

-- Função genérica para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as novas tabelas
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_carts_updated_at BEFORE UPDATE ON public.shopping_carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_addresses_updated_at BEFORE UPDATE ON public.shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PARTE 18B: TRIGGER AUTOMÁTICO DE HISTÓRICO DE STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Só insere se status realmente mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by_user_id,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(), -- Usuário atual
      CASE 
        WHEN NEW.cancellation_reason IS NOT NULL THEN NEW.cancellation_reason
        ELSE NULL
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER track_order_status_changes AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION track_order_status_change();

-- =====================================================
-- PARTE 19: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Policies padrão (usuário vê apenas seus próprios dados)
-- PRODUCT_CATEGORIES
CREATE POLICY "Users can view own product categories" ON public.product_categories
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own product categories" ON public.product_categories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own product categories" ON public.product_categories
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own product categories" ON public.product_categories
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- PRODUCTS
CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- PRODUCT_VARIANTS
CREATE POLICY "Users can view product variants" ON public.product_variants
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_variants.product_id 
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert product variants" ON public.product_variants
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_variants.product_id 
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can update product variants" ON public.product_variants
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_variants.product_id 
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete product variants" ON public.product_variants
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_variants.product_id 
    AND products.user_id = auth.uid()
  ));

-- PRODUCT_IMAGES (mesma lógica de variants)
CREATE POLICY "Users can view product images" ON public.product_images
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_images.product_id 
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert product images" ON public.product_images
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_images.product_id 
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete product images" ON public.product_images
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_images.product_id 
    AND products.user_id = auth.uid()
  ));

-- PRODUCT_INVENTORY_ITEMS
CREATE POLICY "Users can view product inventory links" ON public.product_inventory_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_inventory_items.product_id 
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage product inventory links" ON public.product_inventory_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_inventory_items.product_id 
    AND products.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_inventory_items.product_id 
    AND products.user_id = auth.uid()
  ));

-- WHATSAPP_CONVERSATIONS
CREATE POLICY "Users can view own conversations" ON public.whatsapp_conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations" ON public.whatsapp_conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations" ON public.whatsapp_conversations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- WHATSAPP_MESSAGES
CREATE POLICY "Users can view conversation messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.whatsapp_conversations 
    WHERE whatsapp_conversations.id = whatsapp_messages.conversation_id 
    AND whatsapp_conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert conversation messages" ON public.whatsapp_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.whatsapp_conversations 
    WHERE whatsapp_conversations.id = whatsapp_messages.conversation_id 
    AND whatsapp_conversations.user_id = auth.uid()
  ));

-- WHATSAPP_TEMPLATES
CREATE POLICY "Users can manage own templates" ON public.whatsapp_templates
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- SHOPPING_CARTS
CREATE POLICY "Users can view own carts" ON public.shopping_carts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own carts" ON public.shopping_carts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- CART_ITEMS
CREATE POLICY "Users can view cart items" ON public.cart_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shopping_carts 
    WHERE shopping_carts.id = cart_items.cart_id 
    AND shopping_carts.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage cart items" ON public.cart_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shopping_carts 
    WHERE shopping_carts.id = cart_items.cart_id 
    AND shopping_carts.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shopping_carts 
    WHERE shopping_carts.id = cart_items.cart_id 
    AND shopping_carts.user_id = auth.uid()
  ));

-- SHIPPING_ADDRESSES
CREATE POLICY "Users can manage own shipping addresses" ON public.shipping_addresses
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ORDERS
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ORDER_ITEMS
CREATE POLICY "Users can view order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

-- =====================================================
-- PARTE 20: FUNÇÕES AUXILIARES
-- =====================================================

-- Gerar número único de pedido
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  new_number text;
  exists_number boolean;
BEGIN
  LOOP
    -- Formato: ORD-YYYYMMDD-XXXX (ex: ORD-20251127-0001)
    new_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || 
                  lpad(floor(random() * 10000)::text, 4, '0');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = new_number) INTO exists_number;
    
    EXIT WHEN NOT exists_number;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 21: COMENTÁRIOS (DOCUMENTAÇÃO)
-- =====================================================

COMMENT ON TABLE public.product_categories IS 'Categorias de produtos para e-commerce';
COMMENT ON TABLE public.products IS 'Catálogo de produtos vendáveis via WhatsApp';
COMMENT ON TABLE public.product_variants IS 'Variantes de produtos (tamanho, cor, etc)';
COMMENT ON TABLE public.product_images IS 'Imagens dos produtos e variantes';
COMMENT ON TABLE public.product_inventory_items IS 'Vínculo entre produtos vendáveis e itens de estoque';
COMMENT ON TABLE public.whatsapp_conversations IS 'Sessões de conversas WhatsApp com clientes';
COMMENT ON TABLE public.whatsapp_messages IS 'Mensagens individuais das conversas';
COMMENT ON TABLE public.whatsapp_templates IS 'Templates aprovados pela Meta para envio em massa';
COMMENT ON TABLE public.shopping_carts IS 'Carrinhos de compras ativos';
COMMENT ON TABLE public.cart_items IS 'Itens dentro dos carrinhos';
COMMENT ON TABLE public.shipping_addresses IS 'Endereços de entrega dos clientes';
COMMENT ON TABLE public.orders IS 'Pedidos finalizados';
COMMENT ON TABLE public.order_items IS 'Itens dos pedidos';
COMMENT ON TABLE public.order_status_history IS 'Histórico de mudanças de status dos pedidos';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
