-- =====================================
-- LIMPEZA DE POLÍTICAS RLS DUPLICADAS
-- Remove políticas antigas que usam auth.uid() = user_id
-- Mantém apenas as políticas com get_owner_user_id()
-- =====================================

-- APPOINTMENTS - Remover políticas antigas
DROP POLICY IF EXISTS "Users can delete own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;

-- CUSTOMERS - Remover política antiga
DROP POLICY IF EXISTS "Users can manage own customers" ON customers;

-- FINANCIAL_TRANSACTIONS - Remover política antiga
DROP POLICY IF EXISTS "Users can manage own transactions" ON financial_transactions;

-- INVENTORY_ITEMS - Remover política antiga
DROP POLICY IF EXISTS "Users can manage own inventory" ON inventory_items;

-- PRODUCTS - Remover políticas antigas
DROP POLICY IF EXISTS "Users can delete own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;

-- PROPOSALS - Remover política antiga
DROP POLICY IF EXISTS "Users can manage own proposals" ON proposals;

-- SERVICES - Remover política antiga
DROP POLICY IF EXISTS "Users can manage own services" ON services;

-- SUBSCRIPTIONS - Remover política antiga
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON subscriptions;

-- TASKS - Remover política antiga
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;