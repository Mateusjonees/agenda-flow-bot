# 🔧 PLANO DE CORREÇÃO - SISTEMA DE PAGAMENTOS E ASSINATURAS

**Data:** 26/11/2025
**Status:** AGUARDANDO APROVAÇÃO PARA EXECUÇÃO
**Prioridade:** CRÍTICA

---

## 📊 DIAGNÓSTICO ATUAL

### ✅ O que está funcionando:
1. Trial de 7 dias é criado automaticamente via trigger
2. SubscriptionGuard bloqueia páginas corretamente
3. Webhook processa pagamentos PIX e Cartão
4. Realtime updates funcionando
5. Validação de integridade implementada

### ❌ Problemas Críticos Identificados:

#### PROBLEMA 1: Schema do Banco de Dados
**Localização:** `supabase/migrations/20251106184325_cf93a270-b1e8-4ba7-be3c-f338f0203adc.sql`

**Estado Atual:**
```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,  -- ❌ SEM NULL
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE CASCADE,  -- ❌ SEM NULL
  status TEXT DEFAULT 'active',
  -- ...
);
```

**Problema:** As colunas `customer_id` e `plan_id` NÃO permitem NULL, mas a validação espera que sejam NULL para assinaturas de plataforma.

**Impacto:** 
- Inserts de assinatura de plataforma podem falhar
- Validação `validateSubscriptionIntegrity` pode rejeitar dados válidos
- Inconsistência entre schema e lógica de negócio

---

#### PROBLEMA 2: Fallback Perigoso no Webhook
**Localização:** `supabase/functions/mp-webhook/index.ts` (linhas 495-510)

**Código Problemático:**
```typescript
// Primeira tentativa: buscar com customer_id null
let { data: existingSub } = await supabaseClient
  .from("subscriptions")
  .select("*")
  .eq("user_id", userId)
  .is("customer_id", null)  // ✅ Correto
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

// ❌ PERIGO: Se não encontrou, busca qualquer subscription
if (!existingSub && !findSubError) {
  console.log("⚠️ STEP 14b: Não encontrou com customer_id null, tentando busca geral...");
  const fallbackResult = await supabaseClient
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)  // ❌ Sem filtro de customer_id/plan_id
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  existingSub = fallbackResult.data;
}
```

**Problema:** Pode pegar assinatura de CLIENTE em vez de criar nova de PLATAFORMA.

**Impacto:**
- Dados misturados entre assinatura de plataforma e de cliente
- Pode atualizar assinatura errada
- Corrupção de dados

---

#### PROBLEMA 3: Falta de Validação HMAC
**Localização:** `supabase/functions/mp-webhook/index.ts` (início da função)

**Estado Atual:** Nenhuma validação de assinatura

**Problema:** Qualquer pessoa pode enviar webhook falso para o endpoint.

**Impacto:**
- Segurança comprometida
- Possível ativação de assinaturas sem pagamento
- Risco de fraude

---

#### PROBLEMA 4: Renovação Automática Incompleta
**Localização:** `supabase/functions/mp-webhook/index.ts` (linhas 88-129)

**Código Atual:**
```typescript
if (topic === "subscription_authorized_payment") {
  // Buscar payment para obter preapproval_id
  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`);
  const paymentData = await paymentResponse.json();
  preapprovalId = paymentData.preapproval_id;
  
  // ❌ PROBLEMA: Não processa a renovação!
  // Deveria atualizar next_billing_date e criar transação
}
```

**Problema:** Webhook recebe renovação mas não atualiza a subscription.

**Impacto:**
- Usuário paga mas subscription não é renovada
- next_billing_date não é atualizada
- Sistema expira assinatura mesmo com pagamento em dia

---

#### PROBLEMA 5: Código Duplicado
**Localização:** `supabase/functions/mp-webhook/index.ts`

**Blocos Duplicados:**
1. Linhas 84-247: Processa `subscription_preapproval`
2. Linhas 257-426: Processa `payment.created` (PIX)
3. Linhas 647-773: Processa `payment.created` genérico

**Problema:** Mesma lógica repetida 3 vezes com pequenas diferenças.

**Impacto:**
- Difícil manutenção
- Risco de bugs ao atualizar apenas um bloco
- Inconsistências entre os fluxos

---

#### PROBLEMA 6: Verificação de Duplicação Inconsistente
**Localização:** `supabase/functions/mp-webhook/index.ts`

**Bom Exemplo (linhas 234-245):**
```typescript
const { data: existingTrans } = await supabaseClient
  .from("financial_transactions")
  .select("id")
  .eq("user_id", userId)
  .eq("amount", amount)
  .eq("description", description)
  .eq("payment_method", "mercado_pago")
  .eq("status", "completed")
  .maybeSingle();

if (!existingTrans) {
  // ✅ Só insere se não existir
  await supabaseClient.from("financial_transactions").insert(/* ... */);
}
```

**Problema:** Outros blocos (linhas 568-584, 730-744) NÃO fazem essa verificação.

**Impacto:**
- Transações financeiras duplicadas
- Relatórios financeiros incorretos
- Dificuldade em reconciliação

---

## 🎯 PLANO DE CORREÇÃO (10 ETAPAS)

### ETAPA 1: Diagnóstico do Banco de Dados
**Objetivo:** Verificar estado atual da tabela subscriptions

**Ações:**
1. Conectar no Supabase Studio
2. Executar query de diagnóstico:
```sql
-- Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'subscriptions'
    AND column_name IN ('customer_id', 'plan_id');

-- Verificar constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'subscriptions'
    AND kcu.column_name IN ('customer_id', 'plan_id');
```

**Resultado Esperado:** Confirmar que customer_id e plan_id são NOT NULL

---

### ETAPA 2: Análise de Dados Existentes
**Objetivo:** Verificar se há dados inconsistentes

**Ações:**
1. Executar query de análise:
```sql
-- Verificar subscriptions existentes
SELECT 
    id,
    user_id,
    customer_id,
    plan_id,
    status,
    CASE 
        WHEN customer_id IS NULL AND plan_id IS NULL THEN 'PLATAFORMA'
        WHEN customer_id IS NOT NULL AND plan_id IS NOT NULL THEN 'CLIENTE'
        ELSE 'INCONSISTENTE'
    END as tipo_subscription
FROM subscriptions
ORDER BY created_at DESC;

-- Contar por tipo
SELECT 
    CASE 
        WHEN customer_id IS NULL AND plan_id IS NULL THEN 'PLATAFORMA'
        WHEN customer_id IS NOT NULL AND plan_id IS NOT NULL THEN 'CLIENTE'
        ELSE 'INCONSISTENTE'
    END as tipo,
    COUNT(*) as total
FROM subscriptions
GROUP BY tipo;

-- Verificar subscriptions de plataforma (status trial ou active)
SELECT 
    s.*,
    u.email
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE (customer_id IS NULL OR plan_id IS NULL)
    AND status IN ('trial', 'active')
ORDER BY s.created_at DESC;
```

**Resultado Esperado:** 
- Identificar quantas subscriptions de plataforma existem
- Verificar se há dados inconsistentes
- Listar usuários que seriam afetados

---

### ETAPA 3: Criar Migration de Correção
**Objetivo:** Corrigir schema do banco sem quebrar dados existentes

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_fix_subscriptions_schema.sql`

**Conteúdo da Migration:**
```sql
-- ================================================
-- Migration: Correção de Schema - Subscriptions
-- Objetivo: Permitir NULL em customer_id e plan_id
--           para suportar assinaturas de plataforma
-- Data: 26/11/2025
-- ================================================

-- PASSO 1: Remover constraint NOT NULL (se existir)
-- Isso permite que customer_id e plan_id sejam NULL

DO $$ 
BEGIN
  -- Remover NOT NULL de customer_id
  ALTER TABLE public.subscriptions 
  ALTER COLUMN customer_id DROP NOT NULL;
  
  RAISE NOTICE 'customer_id agora permite NULL';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'customer_id já permite NULL ou erro: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  -- Remover NOT NULL de plan_id
  ALTER TABLE public.subscriptions 
  ALTER COLUMN plan_id DROP NOT NULL;
  
  RAISE NOTICE 'plan_id agora permite NULL';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'plan_id já permite NULL ou erro: %', SQLERRM;
END $$;

-- PASSO 2: Adicionar constraint CHECK para validar integridade
-- REGRA: customer_id e plan_id devem ser AMBOS null OU AMBOS preenchidos

ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_integrity_check;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_integrity_check 
CHECK (
  (customer_id IS NULL AND plan_id IS NULL) OR 
  (customer_id IS NOT NULL AND plan_id IS NOT NULL)
);

-- PASSO 3: Adicionar índices para melhorar performance de queries

-- Índice para buscar subscriptions de plataforma
CREATE INDEX IF NOT EXISTS idx_subscriptions_platform 
ON public.subscriptions(user_id, status) 
WHERE customer_id IS NULL AND plan_id IS NULL;

-- Índice para buscar subscriptions de cliente
CREATE INDEX IF NOT EXISTS idx_subscriptions_client 
ON public.subscriptions(user_id, customer_id, plan_id) 
WHERE customer_id IS NOT NULL AND plan_id IS NOT NULL;

-- PASSO 4: Adicionar coluna auxiliar para facilitar queries (opcional)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS subscription_type TEXT 
GENERATED ALWAYS AS (
  CASE 
    WHEN customer_id IS NULL AND plan_id IS NULL THEN 'platform'
    WHEN customer_id IS NOT NULL AND plan_id IS NOT NULL THEN 'client'
    ELSE 'invalid'
  END
) STORED;

-- PASSO 5: Log de sucesso
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration concluída com sucesso!';
  RAISE NOTICE '✅ customer_id e plan_id agora permitem NULL';
  RAISE NOTICE '✅ Constraint de integridade adicionada';
  RAISE NOTICE '✅ Índices criados para otimizar queries';
END $$;
```

**Validação Pós-Migration:**
```sql
-- Verificar se constraints foram aplicadas
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.subscriptions'::regclass
    AND conname LIKE '%integrity%';

-- Testar inserção de subscription de plataforma
INSERT INTO subscriptions (
    user_id,
    customer_id,
    plan_id,
    status,
    start_date,
    next_billing_date
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    NULL,  -- ✅ Assinatura de plataforma
    NULL,  -- ✅ Assinatura de plataforma
    'trial',
    NOW(),
    NOW() + INTERVAL '7 days'
);

-- Se inseriu sem erro, está funcionando! ✅
```

**Rollback (se necessário):**
```sql
-- Remover constraint
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_integrity_check;

-- Remover coluna gerada
ALTER TABLE public.subscriptions 
DROP COLUMN IF EXISTS subscription_type;

-- Remover índices
DROP INDEX IF EXISTS idx_subscriptions_platform;
DROP INDEX IF EXISTS idx_subscriptions_client;

-- Voltar NOT NULL (cuidado: só se não houver dados NULL)
-- ALTER TABLE public.subscriptions 
-- ALTER COLUMN customer_id SET NOT NULL;
-- ALTER TABLE public.subscriptions 
-- ALTER COLUMN plan_id SET NOT NULL;
```

---

### ETAPA 4: Refatorar Webhook - Criar Funções Auxiliares
**Objetivo:** Eliminar código duplicado

**Arquivo:** `supabase/functions/_shared/platform-subscription-helpers.ts`

**Conteúdo:**
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface PlatformSubscriptionData {
  userId: string;
  months: number;
  amount: number;
  planName: string;
  billingFrequency: string;
  startDate: Date;
}

/**
 * Processa pagamento de assinatura de plataforma
 * Consolida lógica duplicada de PIX e Cartão
 */
export async function processPlatformSubscriptionPayment(
  supabaseClient: any,
  data: PlatformSubscriptionData
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  
  try {
    // Calcular next_billing_date (months + 7 dias de trial)
    const nextBillingDate = new Date(data.startDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + data.months);
    nextBillingDate.setDate(nextBillingDate.getDate() + 7); // Trial

    console.log(`📅 Processando pagamento para ${data.userId}: ${data.months} meses + 7 dias trial`);

    // Buscar subscription existente de PLATAFORMA
    const { data: existingSub, error: findError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", data.userId)
      .is("customer_id", null)
      .is("plan_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("❌ Erro ao buscar subscription:", findError);
      throw findError;
    }

    if (existingSub) {
      // ✅ Atualizar subscription existente (trial -> active)
      console.log(`✅ Atualizando subscription existente: ${existingSub.id}`);
      
      const { error: updateError } = await supabaseClient
        .from("subscriptions")
        .update({
          status: "active",
          start_date: data.startDate.toISOString(),
          next_billing_date: nextBillingDate.toISOString(),
          last_billing_date: data.startDate.toISOString(),
          failed_payments_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingSub.id);

      if (updateError) throw updateError;
      
      return { success: true, subscriptionId: existingSub.id };
      
    } else {
      // ✅ Criar nova subscription de plataforma
      console.log(`✅ Criando nova subscription de plataforma`);
      
      const { data: newSub, error: insertError } = await supabaseClient
        .from("subscriptions")
        .insert({
          user_id: data.userId,
          customer_id: null,  // ✅ EXPLÍCITO: Assinatura de plataforma
          plan_id: null,      // ✅ EXPLÍCITO: Assinatura de plataforma
          status: "active",
          start_date: data.startDate.toISOString(),
          next_billing_date: nextBillingDate.toISOString(),
          last_billing_date: data.startDate.toISOString(),
          failed_payments_count: 0
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      return { success: true, subscriptionId: newSub.id };
    }
    
  } catch (error: any) {
    console.error("❌ Erro ao processar pagamento:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Cria transação financeira (com verificação de duplicação)
 */
export async function createFinancialTransaction(
  supabaseClient: any,
  userId: string,
  amount: number,
  description: string,
  paymentMethod: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    // Verificar se transação já existe
    const { data: existing } = await supabaseClient
      .from("financial_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("amount", amount)
      .eq("description", description)
      .eq("payment_method", paymentMethod)
      .eq("status", "completed")
      .maybeSingle();

    if (existing) {
      console.log("ℹ️ Transação já existe, pulando criação");
      return { success: true };
    }

    // Criar nova transação
    const { error } = await supabaseClient
      .from("financial_transactions")
      .insert({
        user_id: userId,
        type: "income",
        amount: amount,
        description: description,
        payment_method: paymentMethod,
        status: "completed",
        transaction_date: new Date().toISOString()
      });

    if (error) throw error;
    
    console.log("✅ Transação financeira criada");
    return { success: true };
    
  } catch (error: any) {
    console.error("❌ Erro ao criar transação:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualiza PIX charge para status "paid"
 */
export async function updatePixCharge(
  supabaseClient: any,
  userId: string,
  txid: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const { error } = await supabaseClient
      .from("pix_charges")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("txid", txid)
      .eq("user_id", userId);

    if (error) throw error;
    
    console.log("✅ PIX charge atualizado para 'paid'");
    return { success: true };
    
  } catch (error: any) {
    console.error("❌ Erro ao atualizar PIX:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Processa renovação de assinatura recorrente
 */
export async function processSubscriptionRenewal(
  supabaseClient: any,
  userId: string,
  months: number,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    // Buscar subscription de plataforma
    const { data: subscription, error: findError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .is("customer_id", null)
      .is("plan_id", null)
      .single();

    if (findError || !subscription) {
      throw new Error("Subscription de plataforma não encontrada");
    }

    console.log(`🔄 Processando renovação para subscription ${subscription.id}`);

    // Calcular nova data de cobrança
    const currentBillingDate = new Date(subscription.next_billing_date);
    const newBillingDate = new Date(currentBillingDate);
    newBillingDate.setMonth(newBillingDate.getMonth() + months);

    // Atualizar subscription
    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .update({
        next_billing_date: newBillingDate.toISOString(),
        last_billing_date: new Date().toISOString(),
        failed_payments_count: 0,
        status: "active",
        updated_at: new Date().toISOString()
      })
      .eq("id", subscription.id);

    if (updateError) throw updateError;

    // Criar transação de renovação
    await createFinancialTransaction(
      supabaseClient,
      userId,
      amount,
      description,
      "mercadopago_subscription"
    );

    console.log("✅ Renovação processada com sucesso");
    return { success: true };
    
  } catch (error: any) {
    console.error("❌ Erro ao processar renovação:", error);
    return { success: false, error: error.message };
  }
}
```

---

### ETAPA 5: Remover Fallback Perigoso
**Arquivo:** `supabase/functions/mp-webhook/index.ts`

**Mudança:** Remover linhas 505-510

**Antes:**
```typescript
let { data: existingSub, error: findSubError } = await supabaseClient
  .from("subscriptions")
  .select("*")
  .eq("user_id", userId)
  .is("customer_id", null)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

// ❌ REMOVER ESTE BLOCO
if (!existingSub && !findSubError) {
  console.log("⚠️ Não encontrou com customer_id null, tentando busca geral...");
  const fallbackResult = await supabaseClient
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  existingSub = fallbackResult.data;
  findSubError = fallbackResult.error;
  
  if (existingSub) {
    console.log("✅ Subscription encontrada (customer_id:", existingSub.customer_id, ")");
  }
}
```

**Depois:**
```typescript
// Buscar subscription de PLATAFORMA
const { data: existingSub, error: findSubError } = await supabaseClient
  .from("subscriptions")
  .select("*")
  .eq("user_id", userId)
  .is("customer_id", null)
  .is("plan_id", null)  // ✅ Adicionar filtro de plan_id também
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

// ✅ Usar função auxiliar para processar
const result = await processPlatformSubscriptionPayment(supabaseClient, {
  userId,
  months,
  amount,
  planName,
  billingFrequency,
  startDate: new Date()
});
```

---

### ETAPA 6: Implementar Validação HMAC
**Arquivo:** `supabase/functions/mp-webhook/index.ts`

**Adicionar no início da função handler:**

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateSubscriptionIntegrity } from "../_shared/subscription-validation.ts";
import { 
  processPlatformSubscriptionPayment,
  createFinancialTransaction,
  updatePixCharge,
  processSubscriptionRenewal
} from "../_shared/platform-subscription-helpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

/**
 * Valida assinatura HMAC do Mercado Pago
 * Previne webhooks falsos/maliciosos
 */
async function validateMercadoPagoSignature(
  req: Request,
  body: any
): Promise<boolean> {
  try {
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (!xSignature || !xRequestId) {
      console.error("❌ Missing signature headers");
      return false;
    }

    // Parse signature components
    const parts = xSignature.split(',');
    const tsMatch = parts.find(p => p.startsWith('ts='));
    const v1Match = parts.find(p => p.startsWith('v1='));

    if (!tsMatch || !v1Match) {
      console.error("❌ Invalid signature format");
      return false;
    }

    const ts = tsMatch.split('=')[1];
    const receivedHash = v1Match.split('=')[1];

    // Construir string a assinar
    const dataId = body.data?.id || body.id;
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Obter secret do ambiente
    const secret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
    if (!secret) {
      console.warn("⚠️ MERCADO_PAGO_WEBHOOK_SECRET não configurado - pulando validação");
      return true; // Permitir em ambiente de desenvolvimento
    }

    // Calcular HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(manifest);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      messageData
    );
    
    // Converter para hex
    const hashArray = Array.from(new Uint8Array(signature));
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Comparar hashes
    if (computedHash !== receivedHash) {
      console.error("❌ Invalid signature - computed:", computedHash, "received:", receivedHash);
      return false;
    }

    console.log("✅ Signature validated successfully");
    return true;
    
  } catch (error) {
    console.error("❌ Error validating signature:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("🔍 STEP 1: Webhook do Mercado Pago recebido");

    // Parse body
    let body;
    try {
      body = await req.json();
      console.log("📥 STEP 2: Body do webhook:", JSON.stringify(body, null, 2));
    } catch (e) {
      console.error("❌ Erro ao parsear body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ VALIDAR ASSINATURA HMAC
    const isValidSignature = await validateMercadoPagoSignature(req, body);
    if (!isValidSignature) {
      console.error("❌ Assinatura inválida - webhook rejeitado");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Continuar processamento normal...
    const type = body.type;
    const action = body.action;
    const id = body.data?.id;
    // ...
```

**Configurar Secret no Supabase:**
1. Acessar Supabase Dashboard > Settings > Edge Functions
2. Adicionar variável de ambiente:
   - Nome: `MERCADO_PAGO_WEBHOOK_SECRET`
   - Valor: (obter no painel do Mercado Pago)

---

### ETAPA 7: Implementar Renovação Automática
**Arquivo:** `supabase/functions/mp-webhook/index.ts`

**Localização:** Bloco que processa `subscription_authorized_payment` (linhas 88-129)

**Substituir por:**

```typescript
// Processar webhooks de assinatura recorrente
if (topic === "subscription_preapproval" || topic === "subscription_authorized_payment") {
  console.log("🔄 Processando webhook de assinatura recorrente");
  
  let preapprovalId = id;
  let paymentData = null;
  
  // Se for authorized_payment, buscar dados do pagamento primeiro
  if (topic === "subscription_authorized_payment") {
    console.log("💳 Buscando dados do pagamento:", id);
    
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (paymentResponse.ok) {
      paymentData = await paymentResponse.json();
      preapprovalId = paymentData.preapproval_id;
      console.log("📋 Preapproval ID:", preapprovalId);
      
      // ✅ Se pagamento aprovado, processar renovação
      if (paymentData.status === "approved") {
        // Buscar metadata do preapproval
        const preapprovalResponse = await fetch(
          `https://api.mercadopago.com/preapproval/${preapprovalId}`,
          { headers: { "Authorization": `Bearer ${accessToken}` } }
        );

        if (preapprovalResponse.ok) {
          const preapprovalData = await preapprovalResponse.json();
          const metadata = preapprovalData.metadata || {};
          const userId = metadata.userId;
          const months = parseInt(metadata.months || "1");

          if (userId && metadata.type === "platform_subscription") {
            console.log(`🔄 Processando RENOVAÇÃO automática para user ${userId}`);
            
            // ✅ Usar função auxiliar
            const result = await processSubscriptionRenewal(
              supabaseClient,
              userId,
              months,
              paymentData.transaction_amount,
              `Renovação assinatura - ${months} mês(es)`
            );

            if (result.success) {
              console.log("✅ Renovação automática processada com sucesso!");
              return new Response(
                JSON.stringify({ 
                  success: true, 
                  message: "Subscription renewed successfully" 
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            } else {
              throw new Error(result.error || "Erro ao processar renovação");
            }
          }
        }
      }
    }
  }

  // Se não foi renovação, processar como ativação inicial
  if (!preapprovalId) {
    console.error("❌ Missing preapproval ID");
    return new Response(
      JSON.stringify({ error: "Missing preapproval ID" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Buscar dados do preapproval
  const preapprovalResponse = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    { headers: { "Authorization": `Bearer ${accessToken}` } }
  );

  if (!preapprovalResponse.ok) {
    console.error("Erro ao buscar preapproval:", await preapprovalResponse.text());
    return new Response(
      JSON.stringify({ error: "Failed to fetch preapproval" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const preapprovalData = await preapprovalResponse.json();
  console.log("📋 Preapproval data:", preapprovalData);

  const metadata = preapprovalData.metadata || {};
  const userId = metadata.userId || preapprovalData.external_reference;
  
  if (!userId) {
    console.error("Missing userId");
    return new Response(
      JSON.stringify({ error: "Missing userId" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verificar se é assinatura da plataforma e se foi autorizada
  if (metadata.type === "platform_subscription" && preapprovalData.status === "authorized") {
    console.log(`✅ Ativando assinatura da plataforma para user ${userId}`);

    const startDate = new Date(preapprovalData.date_created || new Date());
    const months = parseInt(metadata.months || "1");
    
    // ✅ Usar função auxiliar
    const result = await processPlatformSubscriptionPayment(supabaseClient, {
      userId,
      months,
      amount: preapprovalData.auto_recurring?.transaction_amount || 0,
      planName: metadata.planName || "Plataforma",
      billingFrequency: metadata.billingFrequency || "monthly",
      startDate
    });

    if (!result.success) {
      throw new Error(result.error || "Erro ao processar pagamento");
    }

    // Criar transação financeira
    await createFinancialTransaction(
      supabaseClient,
      userId,
      preapprovalData.auto_recurring?.transaction_amount || 0,
      `Assinatura ${metadata.billingFrequency || metadata.planId} - Plano Foguetinho`,
      "mercado_pago"
    );

    return new Response(
      JSON.stringify({ success: true, message: "Platform subscription activated" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
```

---

### ETAPA 8: Adicionar Verificação Anti-Duplicação
**Objetivo:** Aplicar verificação em TODOS os blocos de criação de transação

**Mudança:** Substituir todas as chamadas diretas de insert em `financial_transactions` pela função `createFinancialTransaction`

**Localizações a modificar:**
- Linha 234-245 ✅ (já tem verificação)
- Linha 568-584 ❌ (adicionar)
- Linha 730-744 ❌ (adicionar)

**Exemplo de substituição:**

**Antes:**
```typescript
const { error: transError } = await supabaseClient
  .from("financial_transactions")
  .insert({
    user_id: userId,
    type: "income",
    amount: payment.transaction_amount,
    description: `Assinatura ${metadata.billingFrequency}`,
    payment_method: "pix",
    status: "completed",
    transaction_date: new Date().toISOString()
  });
```

**Depois:**
```typescript
await createFinancialTransaction(
  supabaseClient,
  userId,
  payment.transaction_amount,
  `Assinatura ${metadata.billingFrequency}`,
  "pix"
);
```

---

### ETAPA 9: Testes e Validação

**Checklist de Testes:**

#### 9.1 Testes de Banco de Dados
```sql
-- Teste 1: Inserir subscription de plataforma
INSERT INTO subscriptions (
    user_id,
    customer_id,
    plan_id,
    status,
    start_date,
    next_billing_date
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    NULL,
    NULL,
    'trial',
    NOW(),
    NOW() + INTERVAL '7 days'
);
-- ✅ Deve funcionar sem erro

-- Teste 2: Tentar inserir subscription inconsistente
INSERT INTO subscriptions (
    user_id,
    customer_id,
    plan_id,
    status
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    NULL,
    (SELECT id FROM subscription_plans LIMIT 1),  -- ❌ plan_id preenchido mas customer_id null
    'active'
);
-- ❌ Deve falhar com erro de constraint

-- Teste 3: Verificar índices
EXPLAIN ANALYZE
SELECT * FROM subscriptions
WHERE user_id = 'some-uuid'
    AND customer_id IS NULL
    AND plan_id IS NULL
    AND status = 'active';
-- ✅ Deve usar índice idx_subscriptions_platform
```

#### 9.2 Testes de Webhook

**Teste PIX:**
1. Criar pagamento PIX via Planos.tsx
2. Simular webhook do MP com status "approved"
3. Verificar:
   - ✅ Subscription atualizada para "active"
   - ✅ next_billing_date = start_date + months + 7 dias
   - ✅ Transação financeira criada
   - ✅ PIX charge atualizado para "paid"

**Teste Cartão (Primeira Assinatura):**
1. Criar assinatura via cartão
2. Simular webhook "subscription_preapproval" com status "authorized"
3. Verificar mesmo resultado do PIX

**Teste Renovação Automática:**
1. Criar subscription ativa com next_billing_date no passado
2. Simular webhook "subscription_authorized_payment" com payment aprovado
3. Verificar:
   - ✅ next_billing_date atualizada (+months)
   - ✅ Transação de renovação criada
   - ✅ Status continua "active"

**Teste Anti-Duplicação:**
1. Enviar webhook 2x com mesmo payment_id
2. Verificar:
   - ✅ Apenas 1 transação criada
   - ✅ Log indica "já existe"

**Teste Validação HMAC:**
1. Enviar webhook com assinatura inválida
2. Verificar:
   - ✅ Retorna 401 Unauthorized
   - ✅ Não processa pagamento

---

### ETAPA 10: Documentação e Rollback Plan

**Documentação a criar:**

1. **CHANGELOG.md** - Registrar mudanças
2. **WEBHOOK_DEBUG_GUIDE.md** - Como debugar problemas
3. **ROLLBACK_PLAN.md** - Como reverter mudanças

**Plano de Rollback:**

**Se algo der errado na migration:**
```sql
-- Arquivo: rollback_subscriptions_fix.sql

-- Reverter constraint
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_integrity_check;

-- Reverter coluna gerada
ALTER TABLE public.subscriptions 
DROP COLUMN IF EXISTS subscription_type;

-- Reverter índices
DROP INDEX IF EXISTS idx_subscriptions_platform;
DROP INDEX IF EXISTS idx_subscriptions_client;

-- Logs
RAISE NOTICE 'Rollback executado - sistema voltou ao estado anterior';
```

**Se algo der errado no webhook:**
1. Fazer deploy da versão anterior:
   ```bash
   supabase functions deploy mp-webhook --no-verify-jwt
   ```

2. Revisar logs:
   ```bash
   supabase functions logs mp-webhook
   ```

3. Verificar subscriptions afetadas:
   ```sql
   SELECT * FROM subscriptions
   WHERE updated_at > NOW() - INTERVAL '1 hour'
   ORDER BY updated_at DESC;
   ```

---

## ⏱️ CRONOGRAMA DE EXECUÇÃO

### Fase 1: Preparação (1-2 horas)
- ✅ ETAPA 1: Diagnóstico do Banco
- ✅ ETAPA 2: Análise de Dados
- ✅ Backup completo do banco

### Fase 2: Correção de Schema (30 min)
- ✅ ETAPA 3: Executar migration
- ✅ Validar constraints
- ✅ Testar inserts

### Fase 3: Refatoração de Código (2-3 horas)
- ✅ ETAPA 4: Criar funções auxiliares
- ✅ ETAPA 5: Remover fallback perigoso
- ✅ ETAPA 6: Implementar HMAC
- ✅ ETAPA 7: Renovação automática
- ✅ ETAPA 8: Anti-duplicação

### Fase 4: Testes (1-2 horas)
- ✅ ETAPA 9: Executar todos os testes
- ✅ Validar cada cenário
- ✅ Corrigir bugs encontrados

### Fase 5: Documentação (30 min)
- ✅ ETAPA 10: Documentar mudanças
- ✅ Criar plano de rollback
- ✅ Atualizar README

**TEMPO TOTAL ESTIMADO: 5-8 horas**

---

## 🚨 RISCOS E MITIGAÇÕES

### Risco 1: Migration quebrar dados existentes
**Probabilidade:** Baixa
**Mitigação:** 
- Testar em ambiente de staging primeiro
- Fazer backup completo antes
- Migration tem rollback preparado

### Risco 2: Webhook parar de funcionar
**Probabilidade:** Média
**Mitigação:**
- Deploy gradual (testar em staging)
- Monitorar logs em tempo real
- Rollback imediato se necessário

### Risco 3: Assinaturas existentes serem afetadas
**Probabilidade:** Baixa
**Mitigação:**
- Migration só adiciona permissões (não remove)
- Dados existentes não são alterados
- Constraint valida integridade

---

## ✅ APROVAÇÃO NECESSÁRIA

**Antes de executar:**
- [ ] Revisar todo o plano
- [ ] Aprovar mudanças no banco
- [ ] Aprovar refatoração de código
- [ ] Agendar janela de manutenção
- [ ] Preparar backup completo
- [ ] Notificar equipe

**Após aprovação, executar na ordem:**
1. ETAPA 1 e 2 (diagnóstico)
2. ETAPA 3 (migration)
3. ETAPAS 4-8 (código)
4. ETAPA 9 (testes)
5. ETAPA 10 (docs)

---

**Status:** ⏸️ AGUARDANDO APROVAÇÃO
**Próximo Passo:** Revisar e aprovar plano

