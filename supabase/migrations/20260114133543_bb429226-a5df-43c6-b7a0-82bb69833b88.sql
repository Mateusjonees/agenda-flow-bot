-- Função para obter o user_id do dono (owner) de um usuário
-- Se o usuário for o dono, retorna seu próprio ID
-- Se for membro da equipe, retorna o ID de quem o criou (created_by)
CREATE OR REPLACE FUNCTION public.get_owner_user_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT created_by FROM user_roles WHERE user_id = _user_id AND created_by IS NOT NULL LIMIT 1),
    _user_id
  )
$$;

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - CUSTOMERS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

CREATE POLICY "Users can view their own customers" ON customers
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own customers" ON customers
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own customers" ON customers
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own customers" ON customers
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - APPOINTMENTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments;

CREATE POLICY "Users can view their own appointments" ON appointments
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own appointments" ON appointments
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own appointments" ON appointments
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own appointments" ON appointments
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - SERVICES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own services" ON services;
DROP POLICY IF EXISTS "Users can create their own services" ON services;
DROP POLICY IF EXISTS "Users can update their own services" ON services;
DROP POLICY IF EXISTS "Users can delete their own services" ON services;

CREATE POLICY "Users can view their own services" ON services
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own services" ON services
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own services" ON services
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own services" ON services
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - FINANCIAL_TRANSACTIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON financial_transactions;

CREATE POLICY "Users can view their own transactions" ON financial_transactions
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own transactions" ON financial_transactions
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own transactions" ON financial_transactions
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own transactions" ON financial_transactions
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - FINANCIAL_CATEGORIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own categories" ON financial_categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON financial_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON financial_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON financial_categories;

CREATE POLICY "Users can view their own categories" ON financial_categories
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own categories" ON financial_categories
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own categories" ON financial_categories
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own categories" ON financial_categories
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - BUSINESS_SETTINGS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own settings" ON business_settings;
DROP POLICY IF EXISTS "Users can create their own settings" ON business_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON business_settings;

CREATE POLICY "Users can view their own settings" ON business_settings
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own settings" ON business_settings
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own settings" ON business_settings
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - BUSINESS_HOURS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own hours" ON business_hours;
DROP POLICY IF EXISTS "Users can create their own hours" ON business_hours;
DROP POLICY IF EXISTS "Users can update their own hours" ON business_hours;
DROP POLICY IF EXISTS "Users can delete their own hours" ON business_hours;

CREATE POLICY "Users can view their own hours" ON business_hours
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own hours" ON business_hours
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own hours" ON business_hours
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own hours" ON business_hours
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - INVENTORY_ITEMS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can create their own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can update their own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete their own inventory" ON inventory_items;

CREATE POLICY "Users can view their own inventory" ON inventory_items
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own inventory" ON inventory_items
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own inventory" ON inventory_items
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own inventory" ON inventory_items
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - STOCK_MOVEMENTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can create their own movements" ON stock_movements;

CREATE POLICY "Users can view their own movements" ON stock_movements
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own movements" ON stock_movements
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - PROPOSALS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can create their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can update their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can delete their own proposals" ON proposals;

CREATE POLICY "Users can view their own proposals" ON proposals
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own proposals" ON proposals
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own proposals" ON proposals
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own proposals" ON proposals
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - COUPONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can create their own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can update their own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can delete their own coupons" ON coupons;

CREATE POLICY "Users can view their own coupons" ON coupons
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own coupons" ON coupons
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own coupons" ON coupons
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own coupons" ON coupons
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - LOYALTY_CARDS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own loyalty cards" ON loyalty_cards;
DROP POLICY IF EXISTS "Users can create their own loyalty cards" ON loyalty_cards;
DROP POLICY IF EXISTS "Users can update their own loyalty cards" ON loyalty_cards;
DROP POLICY IF EXISTS "Users can delete their own loyalty cards" ON loyalty_cards;

CREATE POLICY "Users can view their own loyalty cards" ON loyalty_cards
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own loyalty cards" ON loyalty_cards
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own loyalty cards" ON loyalty_cards
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own loyalty cards" ON loyalty_cards
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - TASKS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own tasks" ON tasks
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - SUBTASKS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can create their own subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can update their own subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can delete their own subtasks" ON subtasks;

CREATE POLICY "Users can view their own subtasks" ON subtasks
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own subtasks" ON subtasks
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own subtasks" ON subtasks
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own subtasks" ON subtasks
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - PIX_CHARGES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own pix charges" ON pix_charges;
DROP POLICY IF EXISTS "Users can create their own pix charges" ON pix_charges;
DROP POLICY IF EXISTS "Users can update their own pix charges" ON pix_charges;

CREATE POLICY "Users can view their own pix charges" ON pix_charges
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own pix charges" ON pix_charges
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own pix charges" ON pix_charges
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - SUBSCRIPTIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - SUBSCRIPTION_PLANS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can create their own plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can update their own plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can delete their own plans" ON subscription_plans;

CREATE POLICY "Users can view their own plans" ON subscription_plans
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own plans" ON subscription_plans
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own plans" ON subscription_plans
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own plans" ON subscription_plans
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - SERVICE_PACKAGES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own packages" ON service_packages;
DROP POLICY IF EXISTS "Users can create their own packages" ON service_packages;
DROP POLICY IF EXISTS "Users can update their own packages" ON service_packages;
DROP POLICY IF EXISTS "Users can delete their own packages" ON service_packages;

CREATE POLICY "Users can view their own packages" ON service_packages
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own packages" ON service_packages
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own packages" ON service_packages
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own packages" ON service_packages
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - PRODUCTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can create their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

CREATE POLICY "Users can view their own products" ON products
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own products" ON products
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - PRODUCT_CATEGORIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own product categories" ON product_categories;
DROP POLICY IF EXISTS "Users can create their own product categories" ON product_categories;
DROP POLICY IF EXISTS "Users can update their own product categories" ON product_categories;
DROP POLICY IF EXISTS "Users can delete their own product categories" ON product_categories;

CREATE POLICY "Users can view their own product categories" ON product_categories
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own product categories" ON product_categories
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own product categories" ON product_categories
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own product categories" ON product_categories
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - ORDERS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - SHOPPING_CARTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own carts" ON shopping_carts;
DROP POLICY IF EXISTS "Users can create their own carts" ON shopping_carts;
DROP POLICY IF EXISTS "Users can update their own carts" ON shopping_carts;
DROP POLICY IF EXISTS "Users can delete their own carts" ON shopping_carts;

CREATE POLICY "Users can view their own carts" ON shopping_carts
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own carts" ON shopping_carts
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own carts" ON shopping_carts
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own carts" ON shopping_carts
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - SHIPPING_ADDRESSES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own addresses" ON shipping_addresses;
DROP POLICY IF EXISTS "Users can create their own addresses" ON shipping_addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON shipping_addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON shipping_addresses;

CREATE POLICY "Users can view their own addresses" ON shipping_addresses
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own addresses" ON shipping_addresses
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own addresses" ON shipping_addresses
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own addresses" ON shipping_addresses
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - CUSTOMER_DOCUMENTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own documents" ON customer_documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON customer_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON customer_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON customer_documents;

CREATE POLICY "Users can view their own documents" ON customer_documents
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own documents" ON customer_documents
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own documents" ON customer_documents
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own documents" ON customer_documents
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - DOCUMENT_HISTORY
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own history" ON document_history;
DROP POLICY IF EXISTS "Users can create their own history" ON document_history;

CREATE POLICY "Users can view their own history" ON document_history
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own history" ON document_history
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - REVIEWS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

CREATE POLICY "Users can view their own reviews" ON reviews
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own reviews" ON reviews
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - CASH_FLOW_PROJECTIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own projections" ON cash_flow_projections;
DROP POLICY IF EXISTS "Users can create their own projections" ON cash_flow_projections;
DROP POLICY IF EXISTS "Users can update their own projections" ON cash_flow_projections;
DROP POLICY IF EXISTS "Users can delete their own projections" ON cash_flow_projections;

CREATE POLICY "Users can view their own projections" ON cash_flow_projections
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own projections" ON cash_flow_projections
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can update their own projections" ON cash_flow_projections
  FOR UPDATE USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can delete their own projections" ON cash_flow_projections
  FOR DELETE USING (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - NOTIFICATION_VIEWS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON notification_views;
DROP POLICY IF EXISTS "Users can create their own notifications" ON notification_views;

CREATE POLICY "Users can view their own notifications" ON notification_views
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own notifications" ON notification_views
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS - AUDIT_LOGS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can create their own logs" ON audit_logs;

CREATE POLICY "Users can view their own logs" ON audit_logs
  FOR SELECT USING (user_id = get_owner_user_id(auth.uid()));

CREATE POLICY "Users can create their own logs" ON audit_logs
  FOR INSERT WITH CHECK (user_id = get_owner_user_id(auth.uid()));