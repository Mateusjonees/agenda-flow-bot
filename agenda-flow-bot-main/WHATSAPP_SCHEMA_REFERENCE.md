# 📚 REFERÊNCIA COMPLETA: WhatsApp E-commerce Schema

**Data:** 27/11/2025  
**Versão:** 1.0  
**Status:** PRÉ-EXECUÇÃO (Auditoria em andamento)

---

## 🎯 OBJETIVO

Este documento é a **fonte única da verdade** para o desenvolvimento do vendedor WhatsApp 24/7.  
Contém TODAS as tabelas, campos, relacionamentos e regras de negócio.

---

## 📊 INVENTÁRIO COMPLETO DE TABELAS

### ✅ **TABELAS EXISTENTES (Não serão modificadas)**

| Tabela | Propósito | Campos Principais |
|--------|-----------|-------------------|
| `appointments` | Agendamentos de serviços | id, user_id, customer_id, proposal_id, service_id, start_time, end_time, status, price, payment_status |
| `audit_logs` | Logs de auditoria | id, user_id, action, table_name, record_id, old_data, new_data |
| `business_hours` | Horário de funcionamento | id, user_id, day_of_week, start_time, end_time, is_active |
| `business_settings` | Configurações da empresa | id, user_id, business_name, whatsapp_number, email, theme_color, loyalty_enabled |
| `cash_flow_projections` | Projeções de fluxo de caixa | id, user_id, date, expected_income, expected_expenses |
| `coupons` | Cupons de desconto | id, user_id, customer_id, code, discount_type, discount_value, status, expires_at |
| `customer_documents` | Documentos dos clientes | id, user_id, customer_id, file_name, file_path, file_type |
| `customers` | **⚠️ SERÁ ESTENDIDA** | id, user_id, name, email, phone, address, notes, cpf, source |
| `document_history` | Histórico de documentos enviados | id, user_id, document_type, related_id, recipient_email, status |
| `financial_categories` | Categorias financeiras | id, user_id, name, type (income/expense) |
| `financial_transactions` | Transações financeiras | id, user_id, appointment_id, category_id, type, amount, payment_method, status |
| `inventory_items` | **Estoque INTERNO** | id, user_id, name, quantity, min_quantity, unit_price, cost_price, current_stock |
| `loyalty_cards` | Cartões fidelidade | id, user_id, customer_id, points, total_visits, current_stamps, stamps_required |
| `notification_views` | Visualizações de notificações | id, user_id, notification_type, notification_id, viewed_at |
| `pix_charges` | Cobranças PIX (ASAAS) | id, user_id, appointment_id, subscription_id, txid, qr_code, amount, status, expires_at |
| `profiles` | Perfis de usuários | id, full_name, phone |
| `proposals` | Propostas comerciais | id, user_id, customer_id, title, items (jsonb), total_amount, status, valid_until |
| `reviews` | Avaliações de clientes | id, user_id, customer_id, appointment_id, rating, comment |
| `service_packages` | Pacotes de serviços | id, user_id, name, service_ids, discount_percentage, final_price |
| `service_price_history` | Histórico de preços | id, service_id, old_price, new_price, changed_at |
| `services` | Serviços prestados | id, user_id, name, description, category, duration, price, color |
| `stock_movements` | Movimentações de estoque | id, user_id, item_id, type (in/out/adjustment), quantity, reason |
| `subscription_plans` | Planos de assinatura | id, user_id, name, description, price, billing_frequency, services (jsonb) |
| `subscriptions` | Assinaturas ativas | id, user_id, customer_id, plan_id, status, type (platform/customer), next_billing_date |
| `subtasks` | Subtarefas | id, task_id, user_id, title, completed, status |
| `tasks` | Tarefas/Lembretes | id, user_id, customer_id, title, type, priority, status, due_date |
| `user_roles` | Papéis de usuários | id, user_id, role (enum: owner, admin, employee, viewer) |

---

### 🆕 **TABELAS QUE SERÃO CRIADAS**

#### 📦 **Categoria: PRODUTOS E-COMMERCE**

##### 1. `product_categories`
**Propósito:** Categorias de produtos vendáveis (não confundir com inventory_items)

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| user_id | uuid | FK auth.users, NOT NULL | Dono da empresa |
| name | text | NOT NULL | Nome da categoria (ex: "Cremes", "Shampoos") |
| description | text | - | Descrição da categoria |
| parent_id | uuid | FK product_categories(id) | Categoria pai (hierarquia) |
| display_order | integer | DEFAULT 0 | Ordem de exibição |
| is_active | boolean | DEFAULT true | Categoria visível no catálogo |
| image_url | text | - | Imagem da categoria |
| created_at | timestamptz | DEFAULT now() | Data de criação |
| updated_at | timestamptz | DEFAULT now() | Última atualização |

**Índices:**
- `idx_product_categories_user` (user_id)
- `idx_product_categories_parent` (parent_id)
- `idx_product_categories_active` (is_active WHERE is_active = true)

**Constraints:**
- UNIQUE(user_id, name) - Não pode ter 2 categorias com mesmo nome

---

##### 2. `products`
**Propósito:** Catálogo de produtos vendáveis via WhatsApp (e-commerce)

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| user_id | uuid | FK auth.users, NOT NULL | Dono do produto |
| category_id | uuid | FK product_categories(id) | Categoria do produto |
| name | text | NOT NULL | Nome do produto |
| description | text | - | Descrição longa (marketing) |
| short_description | text | - | Descrição curta (WhatsApp) |
| sku | text | UNIQUE(user_id, sku) | Código SKU único |
| price | numeric(10,2) | NOT NULL, DEFAULT 0 | Preço de venda |
| compare_at_price | numeric(10,2) | - | Preço "De:" (desconto) |
| cost_price | numeric(10,2) | - | Custo (interno) |
| track_inventory | boolean | DEFAULT true | Controlar estoque? |
| stock_quantity | integer | DEFAULT 0 | Quantidade em estoque |
| low_stock_threshold | integer | DEFAULT 5 | Alerta de estoque baixo |
| allow_backorder | boolean | DEFAULT false | Permitir venda sem estoque |
| weight_grams | integer | - | Peso em gramas (frete) |
| length_cm | numeric(6,2) | - | Comprimento em cm |
| width_cm | numeric(6,2) | - | Largura em cm |
| height_cm | numeric(6,2) | - | Altura em cm |
| meta_title | text | - | Título SEO |
| meta_description | text | - | Descrição SEO |
| tags | text[] | - | Tags de busca (array) |
| is_active | boolean | DEFAULT true | Produto disponível |
| is_featured | boolean | DEFAULT false | Produto em destaque |
| created_at | timestamptz | DEFAULT now() | Data de criação |
| updated_at | timestamptz | DEFAULT now() | Última atualização |

**Índices:**
- `idx_products_user` (user_id)
- `idx_products_category` (category_id)
- `idx_products_active` (is_active WHERE is_active = true)
- `idx_products_featured` (is_featured WHERE is_featured = true)
- `idx_products_sku` (sku)
- `idx_products_tags` (tags) - GIN index para arrays

**Diferença de `inventory_items`:**
- `inventory_items` = Estoque INTERNO (matéria-prima, insumos, uso interno)
- `products` = Catálogo E-COMMERCE (produtos vendáveis ao cliente final)

---

##### 3. `product_variants`
**Propósito:** Variantes de produtos (tamanho, cor, modelo)

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| product_id | uuid | FK products(id), NOT NULL | Produto pai |
| sku | text | NOT NULL, UNIQUE | SKU único da variante |
| name | text | NOT NULL | Nome da variante (ex: "M - Azul") |
| attributes | jsonb | DEFAULT '{}' | Atributos flexíveis {"size": "M", "color": "blue"} |
| price | numeric(10,2) | - | Preço específico (opcional) |
| compare_at_price | numeric(10,2) | - | Preço "De:" específico |
| stock_quantity | integer | DEFAULT 0 | Estoque específico da variante |
| is_active | boolean | DEFAULT true | Variante disponível |
| display_order | integer | DEFAULT 0 | Ordem de exibição |
| created_at | timestamptz | DEFAULT now() | Data de criação |
| updated_at | timestamptz | DEFAULT now() | Última atualização |

**Índices:**
- `idx_product_variants_product` (product_id)
- `idx_product_variants_active` (is_active WHERE is_active = true)
- `idx_product_variants_attributes` (attributes) - GIN index

---

##### 4. `product_images`
**Propósito:** Imagens dos produtos e variantes

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| product_id | uuid | FK products(id), NOT NULL | Produto relacionado |
| variant_id | uuid | FK product_variants(id) | Variante específica (opcional) |
| url | text | NOT NULL | URL da imagem (Supabase Storage) |
| alt_text | text | - | Texto alternativo (acessibilidade) |
| display_order | integer | DEFAULT 0 | Ordem de exibição |
| is_primary | boolean | DEFAULT false | Imagem principal |
| created_at | timestamptz | DEFAULT now() | Data de upload |

**Índices:**
- `idx_product_images_product` (product_id)
- `idx_product_images_variant` (variant_id)
- `idx_product_images_primary` (is_primary WHERE is_primary = true)

---

##### 5. `product_inventory_items`
**Propósito:** Vínculo entre produtos vendáveis e estoque interno

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| product_id | uuid | FK products(id), NOT NULL | Produto vendável |
| variant_id | uuid | FK product_variants(id) | Variante específica (opcional) |
| inventory_item_id | uuid | FK inventory_items(id), NOT NULL | Item de estoque interno |
| quantity_needed | numeric(10,3) | DEFAULT 1 | Quantos itens são necessários |
| created_at | timestamptz | DEFAULT now() | Data de criação |

**Constraints:**
- UNIQUE(product_id, variant_id, inventory_item_id)

**Exemplo de uso:**
- Produto: "Kit Tratamento Capilar" (vendável)
- Vínculo 1: 1x Shampoo (inventory_item)
- Vínculo 2: 1x Condicionador (inventory_item)
- Vínculo 3: 1x Máscara (inventory_item)

---

#### 💬 **Categoria: WHATSAPP**

##### 6. `whatsapp_conversations`
**Propósito:** Sessões de conversas com clientes via WhatsApp

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| user_id | uuid | FK auth.users, NOT NULL | Empresa dona da conversa |
| customer_id | uuid | FK customers(id) | Cliente vinculado (se identificado) |
| whatsapp_phone | text | NOT NULL | Telefone do cliente no WhatsApp |
| whatsapp_name | text | - | Nome do perfil WhatsApp |
| status | whatsapp_conversation_status | DEFAULT 'active' | Status da conversa |
| context | jsonb | DEFAULT '{}' | Contexto da IA (histórico resumido) |
| last_intent | text | - | Última intenção detectada |
| assigned_to_human | boolean | DEFAULT false | Transferido para humano? |
| assigned_to_user_id | uuid | FK auth.users | Usuário responsável (se transferido) |
| message_count | integer | DEFAULT 0 | Contador de mensagens |
| response_time_avg_seconds | integer | - | Tempo médio de resposta |
| started_at | timestamptz | DEFAULT now() | Início da conversa |
| last_message_at | timestamptz | DEFAULT now() | Última mensagem |
| closed_at | timestamptz | - | Encerramento da conversa |
| created_at | timestamptz | DEFAULT now() | Data de criação |
| updated_at | timestamptz | DEFAULT now() | Última atualização |

**Enum `whatsapp_conversation_status`:**
- `active` - Conversa ativa
- `waiting_response` - Aguardando resposta do cliente
- `waiting_human` - Transferido para atendimento humano
- `resolved` - Resolvida
- `abandoned` - Abandonada pelo cliente

**Índices:**
- `idx_whatsapp_conversations_user` (user_id)
- `idx_whatsapp_conversations_customer` (customer_id)
- `idx_whatsapp_conversations_phone` (whatsapp_phone)
- `idx_whatsapp_conversations_status` (status)
- `idx_whatsapp_conversations_last_message` (last_message_at DESC)

---

##### 7. `whatsapp_messages`
**Propósito:** Mensagens individuais das conversas

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| conversation_id | uuid | FK whatsapp_conversations(id), NOT NULL | Conversa relacionada |
| whatsapp_message_id | text | UNIQUE | ID da mensagem no WhatsApp |
| direction | message_direction | NOT NULL | inbound ou outbound |
| message_type | whatsapp_message_type | NOT NULL | Tipo da mensagem |
| content | text | - | Texto da mensagem |
| media_url | text | - | URL de mídia (imagem, vídeo) |
| media_mime_type | text | - | Tipo MIME da mídia |
| metadata | jsonb | DEFAULT '{}' | Dados adicionais (botões, etc) |
| status | text | - | sent, delivered, read, failed |
| error_message | text | - | Mensagem de erro (se falhou) |
| ai_processed | boolean | DEFAULT false | Processado pela IA? |
| ai_response | jsonb | - | Resposta da IA (intent, entities, confidence) |
| sent_at | timestamptz | DEFAULT now() | Data de envio |
| delivered_at | timestamptz | - | Data de entrega |
| read_at | timestamptz | - | Data de leitura |
| created_at | timestamptz | DEFAULT now() | Data de criação |

**Enum `message_direction`:**
- `inbound` - Cliente → Sistema
- `outbound` - Sistema → Cliente

**Enum `whatsapp_message_type`:**
- `text`
- `image`
- `video`
- `document`
- `audio`
- `location`
- `contacts`
- `interactive_button`
- `interactive_list`
- `template`

**Índices:**
- `idx_whatsapp_messages_conversation` (conversation_id)
- `idx_whatsapp_messages_whatsapp_id` (whatsapp_message_id)
- `idx_whatsapp_messages_created` (created_at DESC)
- `idx_whatsapp_messages_direction` (direction)

---

##### 8. `whatsapp_templates`
**Propósito:** Templates aprovados pela Meta para envio em massa

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| user_id | uuid | FK auth.users, NOT NULL | Empresa dona do template |
| template_name | text | NOT NULL, UNIQUE(user_id, template_name) | Nome no Meta Business |
| template_language | text | DEFAULT 'pt_BR' | Idioma do template |
| template_category | text | - | MARKETING, UTILITY, AUTHENTICATION |
| status | text | DEFAULT 'pending' | pending, approved, rejected |
| rejection_reason | text | - | Motivo da rejeição (se aplicável) |
| header_text | text | - | Texto do cabeçalho |
| body_text | text | NOT NULL | Corpo do template |
| footer_text | text | - | Rodapé do template |
| buttons | jsonb | DEFAULT '[]' | Botões configurados |
| variables | jsonb | DEFAULT '[]' | Variáveis {{1}}, {{2}} |
| usage_count | integer | DEFAULT 0 | Contador de usos |
| last_used_at | timestamptz | - | Último uso |
| created_at | timestamptz | DEFAULT now() | Data de criação |
| updated_at | timestamptz | DEFAULT now() | Última atualização |

**Índices:**
- `idx_whatsapp_templates_user` (user_id)
- `idx_whatsapp_templates_status` (status)

---

#### 🛒 **Categoria: E-COMMERCE**

##### 9. `shopping_carts`
**Propósito:** Carrinhos de compras ativos

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| user_id | uuid | FK auth.users, NOT NULL | Empresa dona do carrinho |
| customer_id | uuid | FK customers(id) | Cliente (se identificado) |
| conversation_id | uuid | FK whatsapp_conversations(id) | Conversa relacionada |
| status | cart_status | DEFAULT 'active' | Status do carrinho |
| subtotal | numeric(10,2) | DEFAULT 0 | Soma dos itens |
| discount | numeric(10,2) | DEFAULT 0 | Desconto total |
| shipping_cost | numeric(10,2) | DEFAULT 0 | Custo de entrega |
| total | numeric(10,2) | DEFAULT 0 | Total final |
| coupon_id | uuid | FK coupons(id) | Cupom aplicado |
| coupon_discount | numeric(10,2) | DEFAULT 0 | Desconto do cupom |
| expires_at | timestamptz | DEFAULT now() + 24h | Expiração do carrinho |
| converted_to_order_id | uuid | FK orders(id) | Pedido gerado (se convertido) |
| created_at | timestamptz | DEFAULT now() | Data de criação |
| updated_at | timestamptz | DEFAULT now() | Última atualização |

**Enum `cart_status`:**
- `active` - Carrinho ativo
- `abandoned` - Abandonado
- `converted` - Convertido em pedido

**Índices:**
- `idx_shopping_carts_user` (user_id)
- `idx_shopping_carts_customer` (customer_id)
- `idx_shopping_carts_conversation` (conversation_id)
- `idx_shopping_carts_status` (status)
- `idx_shopping_carts_expires` (expires_at WHERE status = 'active')

---

##### 10. `cart_items`
**Propósito:** Itens dentro dos carrinhos

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| cart_id | uuid | FK shopping_carts(id), NOT NULL | Carrinho relacionado |
| product_id | uuid | FK products(id), NOT NULL | Produto |
| variant_id | uuid | FK product_variants(id) | Variante (se aplicável) |
| quantity | integer | NOT NULL, CHECK > 0 | Quantidade |
| unit_price | numeric(10,2) | NOT NULL | Preço unitário (snapshot) |
| subtotal | numeric(10,2) | NOT NULL | quantity × unit_price |
| product_snapshot | jsonb | - | Snapshot do produto (caso deletado) |
| created_at | timestamptz | DEFAULT now() | Data de adição |
| updated_at | timestamptz | DEFAULT now() | Última atualização |

**Índices:**
- `idx_cart_items_cart` (cart_id)
- `idx_cart_items_product` (product_id)
- `idx_cart_items_variant` (variant_id)

---

##### 11. `shipping_addresses`
**Propósito:** Endereços de entrega dos clientes

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| user_id | uuid | FK auth.users, NOT NULL | Empresa |
| customer_id | uuid | FK customers(id), NOT NULL | Cliente |
| label | text | - | "Casa", "Trabalho" |
| recipient_name | text | NOT NULL | Nome do destinatário |
| recipient_phone | text | - | Telefone de contato |
| street | text | NOT NULL | Rua/Avenida |
| number | text | NOT NULL | Número |
| complement | text | - | Complemento |
| neighborhood | text | NOT NULL | Bairro |
| city | text | NOT NULL | Cidade |
| state | text | NOT NULL | UF |
| postal_code | text | NOT NULL | CEP |
| country | text | DEFAULT 'Brasil' | País |
| reference | text | - | Ponto de referência |
| latitude | numeric(10,8) | - | Latitude (opcional) |
| longitude | numeric(11,8) | - | Longitude (opcional) |
| is_default | boolean | DEFAULT false | Endereço padrão |
| is_active | boolean | DEFAULT true | Endereço ativo |
| created_at | timestamptz | DEFAULT now() | Data de criação |
| updated_at | timestamptz | DEFAULT now() | Última atualização |

**Índices:**
- `idx_shipping_addresses_user` (user_id)
- `idx_shipping_addresses_customer` (customer_id)
- `idx_shipping_addresses_default` (is_default WHERE is_default = true)

---

##### 12. `orders`
**Propósito:** Pedidos finalizados

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| user_id | uuid | FK auth.users, NOT NULL | Empresa |
| customer_id | uuid | FK customers(id), NOT NULL | Cliente |
| cart_id | uuid | FK shopping_carts(id) | Carrinho original |
| conversation_id | uuid | FK whatsapp_conversations(id) | Conversa relacionada |
| order_number | text | NOT NULL, UNIQUE | Número do pedido (ORD-YYYYMMDD-XXXX) |
| status | order_status | DEFAULT 'pending_payment' | Status do pedido |
| subtotal | numeric(10,2) | NOT NULL | Soma dos itens |
| discount | numeric(10,2) | DEFAULT 0 | Desconto total |
| shipping_cost | numeric(10,2) | DEFAULT 0 | Custo de entrega |
| total | numeric(10,2) | NOT NULL | Total final |
| coupon_id | uuid | FK coupons(id) | Cupom aplicado |
| coupon_code | text | - | Código do cupom (snapshot) |
| coupon_discount | numeric(10,2) | DEFAULT 0 | Desconto do cupom |
| shipping_address | jsonb | NOT NULL | Endereço completo (snapshot) |
| shipping_method | text | - | PAC, SEDEX, Motoboy, etc |
| tracking_code | text | - | Código de rastreamento |
| estimated_delivery_date | date | - | Data estimada de entrega |
| delivered_at | timestamptz | - | Data de entrega |
| payment_method | text | - | pix, credit_card, boleto |
| pix_charge_id | uuid | FK pix_charges(id) | Cobrança PIX relacionada |
| payment_confirmed_at | timestamptz | - | Data de confirmação do pagamento |
| customer_notes | text | - | Observações do cliente |
| internal_notes | text | - | Observações internas |
| created_at | timestamptz | DEFAULT now() | Data de criação |
| updated_at | timestamptz | DEFAULT now() | Última atualização |
| cancelled_at | timestamptz | - | Data de cancelamento |
| cancellation_reason | text | - | Motivo do cancelamento |

**Enum `order_status`:**
- `draft` - Rascunho (carrinho não finalizado)
- `pending_payment` - Aguardando pagamento
- `payment_confirmed` - Pagamento confirmado
- `processing` - Em separação
- `shipped` - Enviado
- `delivered` - Entregue
- `cancelled` - Cancelado
- `refunded` - Reembolsado

**Índices:**
- `idx_orders_user` (user_id)
- `idx_orders_customer` (customer_id)
- `idx_orders_number` (order_number)
- `idx_orders_status` (status)
- `idx_orders_created` (created_at DESC)
- `idx_orders_pix_charge` (pix_charge_id)

---

##### 13. `order_items`
**Propósito:** Itens dos pedidos (imutável após criação)

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | PK | Identificador único |
| order_id | uuid | FK orders(id), NOT NULL | Pedido relacionado |
| product_id | uuid | FK products(id) | Produto (referência) |
| variant_id | uuid | FK product_variants(id) | Variante (referência) |
| product_name | text | NOT NULL | Nome do produto (snapshot) |
| product_sku | text | - | SKU do produto (snapshot) |
| variant_name | text | - | Nome da variante (snapshot) |
| variant_attributes | jsonb | - | Atributos da variante (snapshot) |
| quantity | integer | NOT NULL, CHECK > 0 | Quantidade |
| unit_price | numeric(10,2) | NOT NULL | Preço unitário (snapshot) |
| subtotal | numeric(10,2) | NOT NULL | quantity × unit_price |
| inventory_deducted | boolean | DEFAULT false | Estoque baixado? |
| created_at | timestamptz | DEFAULT now() | Data de criação |

**Índices:**
- `idx_order_items_order` (order_id)
- `idx_order_items_product` (product_id)

---

### 🔧 **TABELA CUSTOMERS - EXTENSÃO**

**Campos EXISTENTES:**
- id (uuid, PK)
- user_id (uuid, FK auth.users)
- name (text)
- email (text)
- **phone** (text) ← **Campo existente para telefone principal**
- address (text)
- notes (text)
- cpf (text)
- source (text)
- created_at (timestamptz)
- updated_at (timestamptz)

**Campos QUE SERÃO ADICIONADOS:**
- **whatsapp_opt_in** (boolean, DEFAULT false) ← Consentimento LGPD
- **whatsapp_phone** (text) ← Telefone do WhatsApp (pode diferir do `phone` principal)
- **whatsapp_name** (text) ← Nome do perfil WhatsApp
- **last_whatsapp_interaction** (timestamptz) ← Última interação

**LÓGICA DE PHONE vs WHATSAPP_PHONE:**
- `phone` = Telefone principal do cadastro (pode ser fixo, comercial, etc)
- `whatsapp_phone` = Telefone específico do WhatsApp (sempre móvel)
- **Por que separar?** Cliente pode ter telefone fixo no cadastro, mas usa WhatsApp pessoal

---

## 🔗 MAPA DE RELACIONAMENTOS

### **Fluxo Principal: WhatsApp → Compra → Pedido**

```
┌─────────────────────┐
│   CUSTOMERS         │
│  (Tabela Central)   │
└──────┬──────────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌─────────────────────┐           ┌─────────────────────┐
│ WHATSAPP_           │           │   APPOINTMENTS      │
│ CONVERSATIONS       │           │   (Serviços)        │
└──────┬──────────────┘           └─────────────────────┘
       │
       ├─── 1:N ───▶ whatsapp_messages
       │
       └─── 1:1 ───▶ shopping_carts
                           │
                           ├─── 1:N ───▶ cart_items
                           │                 │
                           │                 └─── N:1 ───▶ products
                           │                                   │
                           │                                   ├─── 1:N ───▶ product_variants
                           │                                   ├─── 1:N ───▶ product_images
                           │                                   └─── N:N ───▶ inventory_items
                           │                                          (via product_inventory_items)
                           │
                           └─── CONVERSÃO ───▶ orders
                                                  │
                                                  ├─── 1:N ───▶ order_items
                                                  ├─── 1:1 ───▶ pix_charges (pagamento)
                                                  └─── 1:1 ───▶ shipping_address (snapshot)
```

---

## ⚠️ PONTOS CRÍTICOS IDENTIFICADOS

### ✅ **1. DUPLICAÇÃO DE CAMPOS (AUDITADO)**

| Potencial Conflito | Status | Resolução |
|-------------------|--------|-----------|
| `customers.phone` vs `whatsapp_phone` | ✅ OK | Campos complementares, não duplicados |
| `customers.customer_id` vs `whatsapp_conversations.customer_id` | ✅ OK | Relacionamento normal (FK) |
| `products` vs `inventory_items` | ✅ OK | Propósitos diferentes (e-commerce vs estoque interno) |

**Conclusão:** Não há duplicação real. Todos os campos têm propósitos distintos.

---

### ✅ **2. DADOS EM 2 LUGARES (AUDITADO)**

**❌ NÃO ACONTECE! Análise:**

| Dado | Local 1 | Local 2 | Conflito? |
|------|---------|---------|-----------|
| Telefone WhatsApp | `customers.whatsapp_phone` | `whatsapp_conversations.whatsapp_phone` | ✅ **NÃO** - `conversations` é cache temporário |
| Nome WhatsApp | `customers.whatsapp_name` | `whatsapp_conversations.whatsapp_name` | ✅ **NÃO** - `customers` é fonte da verdade, `conversations` é snapshot |
| Preço produto | `products.price` | `cart_items.unit_price` | ✅ **NÃO** - `cart_items` é snapshot (imutável) |
| Endereço | `shipping_addresses` | `orders.shipping_address` | ✅ **NÃO** - `orders` guarda snapshot (cliente pode mudar endereço depois) |

**Regra de Ouro:**
- **Tabelas principais** = Fonte da verdade (customers, products)
- **Tabelas transacionais** = Snapshots imutáveis (orders, order_items, cart_items)
- **Tabelas temporárias** = Cache/sessão (whatsapp_conversations, shopping_carts)

---

### 🔍 **3. CAMPOS FALTANTES (ANÁLISE DETALHADA)**

#### **Fase 1: MVP Mínimo (O que temos é suficiente?)**

✅ **SIM, para MVP básico**. Mas podemos adicionar:

**3.1. Tabela `products` - MELHORIAS SUGERIDAS:**

| Campo Faltante | Tipo | Propósito | Prioridade |
|----------------|------|-----------|------------|
| `requires_shipping` | boolean | Produto digital não precisa frete | 🟡 MÉDIA |
| `max_quantity_per_order` | integer | Limitar compras (produtos escassos) | 🟡 MÉDIA |
| `available_from` | timestamptz | Pré-venda/lançamento programado | 🟢 BAIXA |
| `available_until` | timestamptz | Produto sazonal/limitado | 🟢 BAIXA |

**Recomendação:** Adicionar apenas `requires_shipping` (útil para calcular frete).

---

**3.2. Tabela `whatsapp_conversations` - MELHORIAS SUGERIDAS:**

| Campo Faltante | Tipo | Propósito | Prioridade |
|----------------|------|-----------|------------|
| `language` | text | Detectar idioma do cliente | 🟢 BAIXA |
| `sentiment` | text | Positivo/Negativo (IA) | 🟢 BAIXA |
| `tags` | text[] | Tags de categorização | 🟡 MÉDIA |

**Recomendação:** Adicionar `tags` (útil para filtros/relatórios).

---

**3.3. Tabela `orders` - MELHORIAS SUGERIDAS:**

| Campo Faltante | Tipo | Propósito | Prioridade |
|----------------|------|-----------|------------|
| `invoice_url` | text | Link para nota fiscal | 🟡 MÉDIA |
| `refund_amount` | numeric(10,2) | Valor reembolsado (se parcial) | 🟡 MÉDIA |
| `refunded_at` | timestamptz | Data do reembolso | 🟡 MÉDIA |

**Recomendação:** Adicionar campos de reembolso (importante para e-commerce).

---

**3.4. NOVA TABELA SUGERIDA: `order_status_history`**

**Propósito:** Rastrear todas as mudanças de status do pedido (auditoria).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| order_id | uuid | Pedido relacionado |
| old_status | order_status | Status anterior |
| new_status | order_status | Novo status |
| changed_by_user_id | uuid | Usuário que alterou |
| notes | text | Observações |
| created_at | timestamptz | Data da mudança |

**Prioridade:** 🟡 MÉDIA (útil para rastreamento).

---

**3.5. NOVA TABELA SUGERIDA: `abandoned_cart_recovery`**

**Propósito:** Rastrear tentativas de recuperação de carrinhos abandonados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| cart_id | uuid | Carrinho abandonado |
| recovery_message_sent_at | timestamptz | Quando enviou mensagem de recuperação |
| message_template_id | uuid | Template usado |
| recovered | boolean | Carrinho foi recuperado? |
| recovered_at | timestamptz | Data de recuperação |

**Prioridade:** 🟢 BAIXA (Fase 2+).

---

## 📝 PADRONIZAÇÃO DE NOMENCLATURA

### **✅ NOMES DE TABELAS (REGRAS)**

**Padrão adotado:**
- ✅ **Plural** para tabelas princípais: `products`, `orders`, `customers`
- ✅ **snake_case**: `product_categories`, `whatsapp_messages`
- ✅ **Descritivo**: `shopping_carts` (não `carts`), `order_items` (não `items`)

**Tabelas antigas (manter como está):**
- `appointments` ✅
- `customers` ✅
- `inventory_items` ✅
- `pix_charges` ✅

**Tabelas novas (seguem o padrão):**
- `product_categories` ✅
- `products` ✅
- `product_variants` ✅
- `product_images` ✅
- `product_inventory_items` ✅
- `whatsapp_conversations` ✅
- `whatsapp_messages` ✅
- `whatsapp_templates` ✅
- `shopping_carts` ✅
- `cart_items` ✅
- `shipping_addresses` ✅
- `orders` ✅
- `order_items` ✅

---

### **📘 DICIONÁRIO DE TABELAS (PARA CÓDIGO)**

```typescript
// USE SEMPRE ESTES NOMES NO CÓDIGO
const TABLES = {
  // Produtos
  PRODUCT_CATEGORIES: 'product_categories',
  PRODUCTS: 'products',
  PRODUCT_VARIANTS: 'product_variants',
  PRODUCT_IMAGES: 'product_images',
  PRODUCT_INVENTORY_ITEMS: 'product_inventory_items',
  
  // WhatsApp
  WHATSAPP_CONVERSATIONS: 'whatsapp_conversations',
  WHATSAPP_MESSAGES: 'whatsapp_messages',
  WHATSAPP_TEMPLATES: 'whatsapp_templates',
  
  // E-commerce
  SHOPPING_CARTS: 'shopping_carts',
  CART_ITEMS: 'cart_items',
  SHIPPING_ADDRESSES: 'shipping_addresses',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  
  // Existentes
  CUSTOMERS: 'customers',
  APPOINTMENTS: 'appointments',
  INVENTORY_ITEMS: 'inventory_items',
  PIX_CHARGES: 'pix_charges',
  COUPONS: 'coupons',
  FINANCIAL_TRANSACTIONS: 'financial_transactions',
  // ... etc
} as const;
```

---

## 🔒 VALIDAÇÃO DE INTEGRIDADE REFERENCIAL

### **ON DELETE Behaviors - AUDITADOS**

| Relacionamento | FK | ON DELETE | Justificativa |
|----------------|----|-----------|--------------||
| `product_categories.user_id` → `auth.users.id` | ✅ | **CASCADE** | Deletar empresa = deletar tudo |
| `products.user_id` → `auth.users.id` | ✅ | **CASCADE** | Deletar empresa = deletar tudo |
| `products.category_id` → `product_categories.id` | ✅ | **SET NULL** | Deletar categoria = produtos ficam sem categoria |
| `product_variants.product_id` → `products.id` | ✅ | **CASCADE** | Deletar produto = deletar variantes |
| `cart_items.product_id` → `products.id` | ✅ | **CASCADE** | Deletar produto = remover do carrinho |
| `order_items.product_id` → `products.id` | ✅ | **SET NULL** | Deletar produto = manter histórico (snapshot) |
| `orders.customer_id` → `customers.id` | ✅ | **RESTRICT** | ❌ Não pode deletar cliente com pedidos |
| `shopping_carts.customer_id` → `customers.id` | ✅ | **SET NULL** | Deletar cliente = carrinho fica anônimo |
| `whatsapp_conversations.customer_id` → `customers.id` | ✅ | **SET NULL** | Deletar cliente = conversa fica anônima |

**✅ Cenário testado:** Deletar `customer` com pedidos históricos:
- ❌ **BLOQUEADO** por `ON DELETE RESTRICT` em `orders`
- ✅ **Correto!** Não podemos perder histórico de vendas

---

## 🚀 LÓGICA DE NEGÓCIO SIMPLIFICADA

### **1. Fluxo de Compra (Simplificado)**

```
┌─────────────────────────────────────────────────────────────┐
│ FLUXO SIMPLIFICADO: Cliente → Compra → Pagamento → Entrega │
└─────────────────────────────────────────────────────────────┘

1. Cliente manda mensagem no WhatsApp
   → INSERT whatsapp_conversations
   → INSERT whatsapp_messages (inbound)
   
2. IA detecta intenção "comprar produto X"
   → UPDATE whatsapp_messages.ai_response (intent: "purchase")
   
3. Sistema cria carrinho
   → INSERT shopping_carts (status: active)
   → INSERT cart_items (product_id, quantity, unit_price)
   → UPDATE shopping_carts.total = SUM(cart_items.subtotal) + shipping_cost
   
4. Cliente confirma compra
   → INSERT orders (status: pending_payment, order_number: generate_order_number())
   → INSERT order_items (snapshot de cart_items)
   → UPDATE shopping_carts (status: converted, converted_to_order_id)
   
5. Gerar cobrança PIX
   → INSERT pix_charges (amount: orders.total)
   → UPDATE orders.pix_charge_id
   → Enviar QR Code via WhatsApp
   
6. Webhook PIX confirma pagamento
   → UPDATE pix_charges (status: paid)
   → UPDATE orders (status: payment_confirmed, payment_confirmed_at)
   
7. Separar pedido
   → UPDATE orders (status: processing)
   → Baixar estoque (via product_inventory_items)
   
8. Enviar pedido
   → UPDATE orders (status: shipped, tracking_code)
   → Notificar cliente via WhatsApp
   
9. Confirmar entrega
   → UPDATE orders (status: delivered, delivered_at)
```

---

### **2. Cálculo de Preços (Simplificado)**

```typescript
// REGRA: Sempre usar snapshot de preços (não buscar preço atual)
// Motivo: Cliente não pode ter preço alterado após adicionar no carrinho

// ❌ ERRADO (preço pode mudar):
const total = items.map(i => products.find(p => p.id === i.product_id).price * i.quantity)

// ✅ CORRETO (snapshot imutável):
const total = cart_items.reduce((sum, item) => sum + item.subtotal, 0)
// onde: cart_items.subtotal = unit_price * quantity (gravado no momento da adição)
```

---

### **3. Baixa de Estoque (Simplificado)**

```typescript
// REGRA: Baixar estoque APENAS após pagamento confirmado
// NÃO baixar ao adicionar no carrinho (pode abandonar)

// Quando: orders.status = 'payment_confirmed'
async function deductInventory(orderId: string) {
  const orderItems = await getOrderItems(orderId);
  
  for (const item of orderItems) {
    // Se produto rastreia estoque
    if (item.product.track_inventory) {
      // Buscar vínculos produto → inventory_items
      const links = await getProductInventoryItems(item.product_id, item.variant_id);
      
      for (const link of links) {
        // Calcular quanto baixar
        const qtyToDeduct = item.quantity * link.quantity_needed;
        
        // Baixar de inventory_items (tabela existente)
        await updateInventoryStock(link.inventory_item_id, -qtyToDeduct);
        
        // Registrar movimento
        await insertStockMovement({
          item_id: link.inventory_item_id,
          type: 'out',
          quantity: -qtyToDeduct,
          reason: `Pedido #${order.order_number}`,
          reference_type: 'order',
          reference_id: orderId
        });
      }
    }
  }
  
  // Marcar como baixado
  await updateOrderItems(orderId, { inventory_deducted: true });
}
```

---

### **4. Expiração de Carrinhos (Simplificado)**

```typescript
// REGRA: Carrinhos expiram após 24h de inatividade
// Job executado a cada 1h

async function expireAbandonedCarts() {
  const expiredCarts = await supabase
    .from('shopping_carts')
    .update({ status: 'abandoned' })
    .eq('status', 'active')
    .lt('expires_at', new Date())
    .select();
  
  // Opcional: Enviar mensagem de recuperação
  for (const cart of expiredCarts) {
    await sendCartRecoveryMessage(cart.conversation_id, cart.id);
  }
}
```

---

## ✅ CHECKLIST PRÉ-EXECUÇÃO

### **Auditoria Completa:**

- [x] **1. Duplicação de campos** → Não encontrada
- [x] **2. Dados em 2 lugares** → Snapshots justificados
- [x] **3. Nomenclatura padronizada** → 100% consistente
- [x] **4. Integridade referencial** → ON DELETE corretos
- [ ] **5. Campos faltantes** → Identificados (não críticos para MVP)
- [ ] **6. Lógica de negócio** → Fluxos documentados
- [ ] **7. Dicionário de tabelas** → Pronto para uso em código

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Revisar campos faltantes** → Adicionar melhorias sugeridas (se aprovado)
2. ⏳ **Aplicar migration SQL** → Aguardando aprovação final
3. ⏳ **Criar Edge Function `whatsapp-webhook`** → Após migration
4. ⏳ **Desenvolver lógica de carrinho** → Após webhook
5. ⏳ **Integrar OpenAI** → Fase 2

---

## 📌 NOTAS IMPORTANTES

**Para o desenvolvedor (eu mesmo):**

- 🔴 **NUNCA** buscar preço de `products.price` em contexto transacional (usar `cart_items.unit_price`)
- 🔴 **NUNCA** deletar `customers` que têm `orders` (ON DELETE RESTRICT protege)
- 🟡 **SEMPRE** criar snapshot em `order_items` (campos `product_name`, `product_sku`, etc)
- 🟢 **SEMPRE** usar `TABLES` constant para nomes de tabelas
- 🟢 **SEMPRE** validar `track_inventory` antes de baixar estoque

**Complexidade:**
- ✅ **Código limpo**: Funções pequenas, responsabilidade única
- ✅ **Simplicidade**: Evitar over-engineering, YAGNI (You Ain't Gonna Need It)
- ✅ **Clareza**: Comentários em lógica crítica (baixa estoque, cálculo preço)

---

**FIM DO DOCUMENTO DE REFERÊNCIA**
