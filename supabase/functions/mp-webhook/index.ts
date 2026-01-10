import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateSubscriptionIntegrity } from "../_shared/subscription-validation.ts";
import {
  processPlatformSubscriptionPayment,
  createFinancialTransaction,
  updatePixCharge,
  processSubscriptionRenewal,
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

    // Mercado Pago ALWAYS envia dados no body, não em query params
    let body;
    try {
      body = await req.json();
      console.log("📥 STEP 2: Body completo do webhook:", JSON.stringify(body, null, 2));
    } catch (e) {
      console.error("❌ Erro ao parsear body do webhook:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ✅ VALIDAR ASSINATURA HMAC
    const isValidSignature = await validateMercadoPagoSignature(req, body);
    if (!isValidSignature) {
      console.error("❌ Assinatura inválida - webhook rejeitado");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mercado Pago envia: type, action, data.id
    const type = body.type;           // "payment"
    const action = body.action;       // "payment.created"
    const id = body.data?.id;         // ID do pagamento
    const topic = type || action;     // usar type como topic

    console.log("� STEP 3: Dados parseados do webhook:", { 
      type, 
      action, 
      id, 
      topic,
      live_mode: body.live_mode,
      date_created: body.date_created
    });

    if (!id) {
      console.error("❌ STEP 4: ID do pagamento não encontrado no webhook");
      return new Response(
        JSON.stringify({ 
          error: "Missing payment ID", 
          received: { type, action, body } 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ STEP 5: Webhook válido - processando pagamento ID:", id);

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("Mercado Pago access token not configured");
    }

    // Processar webhooks de assinatura recorrente (com preapproval)
    if (topic === "subscription_preapproval" || topic === "subscription_authorized_payment") {
      console.log("🔄 Processando webhook de assinatura recorrente");
      
      // Para subscription_authorized_payment, o id é do payment, precisamos buscar o preapproval
      let preapprovalId = id;
      let paymentData = null;
      
      if (topic === "subscription_authorized_payment") {
        console.log("💳 Buscando dados do pagamento:", id);
        
        // Buscar payment para obter o preapproval_id
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (paymentResponse.ok) {
          paymentData = await paymentResponse.json();
          preapprovalId = paymentData.preapproval_id;
          console.log("📋 Preapproval ID:", preapprovalId);
          
          // ✅ Se pagamento aprovado, processar RENOVAÇÃO
          if (paymentData.status === "approved") {
            // Buscar metadata do preapproval
            const preapprovalResponse = await fetch(
              `https://api.mercadopago.com/preapproval/${preapprovalId}`,
              {
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                },
              }
            );

            if (preapprovalResponse.ok) {
              const preapprovalData = await preapprovalResponse.json();
              const metadata = preapprovalData.metadata || {};
              const userId = metadata.userId;
              const months = parseInt(metadata.months || "1");

              if (userId && metadata.type === "platform_subscription") {
                console.log(`🔄 Processando RENOVAÇÃO automática para user ${userId}`);
                
                // ✅ Usar função auxiliar para processar renovação
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

      if (!preapprovalId) {
        console.error("Missing preapproval ID for subscription webhook");
        return new Response(
          JSON.stringify({ error: "Missing preapproval ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const mpResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${preapprovalId}`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );

      if (!mpResponse.ok) {
        console.error("Erro ao buscar preapproval:", await mpResponse.text());
        return new Response(
          JSON.stringify({ error: "Failed to fetch preapproval" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const preapprovalData = await mpResponse.json();
      console.log("📋 Preapproval data:", preapprovalData);

      // ✅ Se o preapproval está pendente, retornar sucesso e aguardar autorização
      if (preapprovalData.status === "pending") {
        console.log(`⏳ Preapproval ${preapprovalId} ainda está pendente - aguardando autorização do usuário`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Preapproval pending - waiting for user authorization" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const metadata = preapprovalData.metadata || {};
      const userId = metadata.userId || preapprovalData.external_reference;
      
      if (!userId) {
        console.error("Missing userId in metadata");
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ✅ CORREÇÃO: Processar QUALQUER preapproval autorizado (não apenas platform_subscription)
      // O status "authorized" significa que o cartão foi autorizado e a assinatura está ativa
      if (preapprovalData.status === "authorized") {
        console.log(`✅ Ativando assinatura para user ${userId} (status: authorized)`);

        // Usar data de criação do MP ao invés de data atual
        const startDate = new Date(preapprovalData.date_created || preapprovalData.auto_recurring?.start_date || new Date());
        const months = parseInt(metadata.months || "1");
        const nextBillingDate = new Date(startDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + months);
        
        // ✅ CORREÇÃO: Não adicionar dias de trial para usuários PAGANTES
        // Trial é apenas para novos usuários que ainda não pagaram
        
        console.log(`📅 Next billing date calculated: ${nextBillingDate.toISOString()} (start: ${startDate.toISOString()} + ${months} months)`);

        // Verificar subscription existente
        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .is("customer_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingSub) {
          // Atualizar subscription existente
          console.log(`Updating existing PLATFORM subscription ${existingSub.id} (customer_id=${existingSub.customer_id}, plan_id=${existingSub.plan_id})`);
          const { error: subError } = await supabaseClient
            .from("subscriptions")
            .update({
              status: "active",
              type: "platform",  // ✅ GARANTIR type correto
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
              failed_payments_count: 0,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingSub.id);

          if (subError) {
            console.error("❌ Erro ao atualizar subscription:", subError);
          } else {
            console.log(`✅ Subscription ${existingSub.id} atualizada para active`);
          }
        } else {
          // Criar nova subscription da plataforma
          console.log("Creating/updating PLATFORM subscription (customer_id=NULL, plan_id=NULL)");
          
          // Preparar dados da subscription
          const subscriptionData = {
            user_id: userId,
            customer_id: null,  // ✅ EXPLÍCITO: Assinatura de plataforma
            plan_id: null,      // ✅ EXPLÍCITO: Assinatura de plataforma
            status: "active",
            start_date: startDate.toISOString(),
            next_billing_date: nextBillingDate.toISOString(),
            last_billing_date: startDate.toISOString(),
            failed_payments_count: 0
          };

          // ✅ VALIDAÇÃO: Verificar integridade antes de inserir
          const validation = validateSubscriptionIntegrity(subscriptionData as any);
          if (!validation.valid) {
            console.error("❌ Validation failed:", validation.error);
            throw new Error(validation.error);
          }

          const { error: subError } = await supabaseClient
            .from("subscriptions")
            .insert(subscriptionData);

          if (subError) {
            console.error("❌ Erro ao criar subscription:", subError);
          } else {
            console.log("✅ Nova subscription da plataforma criada");
          }
        }

        // ✅ NÃO criar transação financeira para assinaturas de PLATAFORMA
        // Isso evita que pagamentos da plataforma apareçam nos relatórios do usuário
        console.log(`ℹ️ Assinatura de plataforma ativada (sem criar transação financeira)`);

        return new Response(
          JSON.stringify({ success: true, message: "Platform subscription activated" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ✅ CORREÇÃO: Para QUALQUER outro status de preapproval, retornar sucesso
      // Isso evita que o código tente buscar o preapproval_id como payment_id (causando 404)
      console.log(`ℹ️ Preapproval ${preapprovalId} processado com status: ${preapprovalData.status}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Preapproval processed with status: ${preapprovalData.status}`,
          status: preapprovalData.status
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Processar webhooks de pagamento único (payment.created ou payment.updated)
    // ✅ IMPORTANTE: Mercado Pago envia payment.updated quando o pagamento é APROVADO
    if ((action === "payment.created" || action === "payment.updated") && id) {
      console.log(`💳 STEP 6: Processando pagamento (${action})`);
      console.log("🔍 Payment ID:", id);
      
      // Buscar informações do pagamento
      console.log("🔍 STEP 7: Buscando detalhes do pagamento no Mercado Pago...");
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        console.error("❌ STEP 8: Erro ao buscar payment:", paymentResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: "Failed to fetch payment", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payment = await paymentResponse.json();
      console.log("✅ STEP 8: Payment encontrado:", {
        id: payment.id,
        status: payment.status,
        payment_type_id: payment.payment_type_id,
        payment_method_id: payment.payment_method_id,
        transaction_amount: payment.transaction_amount,
        metadata: payment.metadata
      });

      // Validar status do pagamento
      if (payment.status !== "approved") {
        console.log(`⏳ STEP 9: Pagamento não aprovado ainda. Status: ${payment.status}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Payment status noted: ${payment.status}`,
            status: payment.status
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("✅ STEP 9: Pagamento APROVADO - processando...");

      // ℹ️ NOTA: Renovações automáticas são processadas pelo webhook subscription_authorized_payment
      // Este bloco processa apenas pagamentos PIX únicos de ativação inicial (sem preapproval_id)
      
      // Verificar se é pagamento de assinatura da plataforma
      const metadata = payment.metadata || {};
      console.log("🔍 STEP 10: Verificando tipo de pagamento. Metadata:", metadata);

      if (metadata?.type === "platform_subscription") {
        console.log("✅ STEP 11: É um pagamento de assinatura da plataforma!");
        
        // Pagamento PIX único aprovado para plano da plataforma
        const userId = metadata.userId || metadata.user_id;

        if (!userId) {
          console.error("❌ STEP 12: Missing userId in payment metadata");
          return new Response(
            JSON.stringify({ error: "Missing userId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`✅ STEP 12: Processando pagamento PIX da plataforma para user ${userId}`);

        const startDate = new Date();
        const months = parseInt(metadata.months || "1");
        const nextBillingDate = new Date(startDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + months);
        
        // ✅ CORREÇÃO: Não adicionar dias de trial para usuários PAGANTES
        // Trial é apenas para novos usuários que ainda não pagaram

        console.log("🔍 STEP 13: Calculando datas da assinatura:", {
          startDate: startDate.toISOString(),
          months,
          nextBillingDate: nextBillingDate.toISOString()
        });

        // Verificar subscription existente da plataforma (assinatura do sistema, não de cliente)
        console.log("🔍 STEP 14: Buscando subscription existente para user:", userId);
        
        // Primeira tentativa: buscar com customer_id null (padrão correto)
        let { data: existingSub, error: findSubError } = await supabaseClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .is("customer_id", null)
          .order("created_at", { ascending: false })
          .is("plan_id", null)  // ✅ SEGURANÇA: Garantir que é subscription de PLATAFORMA
          .limit(1)
          .maybeSingle();

        if (findSubError) {
          console.error("❌ STEP 15: Erro ao buscar subscription:", findSubError);
        } else if (existingSub) {
          console.log("✅ STEP 15: Subscription existente encontrada:", {
            id: existingSub.id,
            status: existingSub.status,
            customer_id: existingSub.customer_id,
            created_at: existingSub.created_at
          });
        } else {
          console.log("ℹ️ STEP 15: Nenhuma subscription existente encontrada - será criada uma nova");
        }

        if (existingSub) {
          // Atualizar subscription existente
          console.log(`Updating existing PLATFORM subscription ${existingSub.id} (customer_id=${existingSub.customer_id}, plan_id=${existingSub.plan_id})`);
          console.log("🔍 STEP 16: Atualizando subscription existente ID:", existingSub.id);
          const { error: subError } = await supabaseClient
            .from("subscriptions")
            .update({
              status: "active",
              type: "platform",  // ✅ GARANTIR type correto
              billing_frequency: metadata.billing_frequency || metadata.plan_id,
              payment_method: "card",
              plan_name: metadata.plan_name,
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
              failed_payments_count: 0,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingSub.id);

          if (subError) {
            console.error("❌ STEP 17: Erro ao atualizar subscription:", subError);
          } else {
            console.log(`✅ STEP 17: Subscription ${existingSub.id} atualizada para ACTIVE com sucesso!`);
          }
        } else {
          // Criar nova subscription da plataforma
          console.log("Creating/updating PLATFORM subscription (customer_id=NULL, plan_id=NULL)");
          console.log("🔍 STEP 16: Criando nova subscription da plataforma");
          
          // Preparar dados da subscription
          const subscriptionData = {
            user_id: userId,
            customer_id: null,  // ✅ EXPLÍCITO: Assinatura de plataforma
            plan_id: null,      // ✅ EXPLÍCITO: Assinatura de plataforma
            type: "platform",
            status: "active",
            billing_frequency: metadata.billing_frequency || metadata.plan_id,
            payment_method: "card",
            plan_name: metadata.plan_name,
            start_date: startDate.toISOString(),
            next_billing_date: nextBillingDate.toISOString(),
            last_billing_date: startDate.toISOString(),
            failed_payments_count: 0
          };

          // ✅ VALIDAÇÃO: Verificar integridade antes de inserir
          const validation = validateSubscriptionIntegrity(subscriptionData as any);
          if (!validation.valid) {
            console.error("❌ STEP 16b: Validation failed:", validation.error);
            throw new Error(validation.error);
          }

          const { data: newSub, error: subError } = await supabaseClient
            .from("subscriptions")
            .insert(subscriptionData)
            .select()
            .single();

          if (subError) {
            console.error("❌ STEP 17: Erro ao criar subscription:", subError);
          } else {
            console.log("✅ STEP 17: Nova subscription da plataforma criada com ID:", newSub?.id);
          }
        }

        // ✅ NÃO criar transação financeira para assinaturas de PLATAFORMA
        // Isso evita que pagamentos da plataforma apareçam nos relatórios do usuário
        console.log(`ℹ️ Pagamento PIX de plataforma processado (sem criar transação financeira)`);

        // Atualizar pix_charge se existir
        if (payment.external_reference) {
          console.log("🔍 STEP 20: Atualizando pix_charge com external_reference:", payment.external_reference);
          await updatePixCharge(
            supabaseClient,
            userId,
            payment.external_reference
          );
        } else {
          console.log("ℹ️ STEP 20: Nenhum external_reference - pulando atualização de pix_charge");
        }

        console.log("🎉 STEP 22: PROCESSAMENTO COMPLETO! Assinatura da plataforma ativada com sucesso!");
        return new Response(
          JSON.stringify({ success: true, message: "Platform PIX payment processed successfully" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("ℹ️ STEP 11: Não é pagamento de plataforma - processamento genérico");
      return new Response(
        JSON.stringify({ success: true, message: "Payment processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Processar pagamentos tradicionais (fallback para outros webhooks)
    if (!id) {
      console.log("No payment ID to process");
      return new Response(
        JSON.stringify({ message: "No payment to process" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get payment information from Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!mpResponse.ok) {
      throw new Error(`Failed to get payment info: ${mpResponse.status}`);
    }

    const payment = await mpResponse.json();
    console.log("Payment info:", payment);

    const metadata = payment.metadata;
    const status = payment.status;

    console.log("Payment status:", status);
    console.log("Payment metadata:", metadata);

    if (status === "approved") {
      // Verificar se é uma reativação de assinatura
      if (metadata?.type === "subscription_reactivation" && metadata?.subscription_id) {
        console.log("Processing subscription reactivation for:", metadata.subscription_id);
        
        // Calcular próxima data de cobrança (1 mês + 7 dias de trial)
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);

        // Reativar a assinatura
        const { error: reactivateError } = await supabaseClient
          .from("subscriptions")
          .update({
            status: "active",
            type: "platform",  // ✅ GARANTIR type correto
            next_billing_date: nextBillingDate.toISOString(),
            last_billing_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            failed_payments_count: 0,
          })
          .eq("id", metadata.subscription_id)
          .eq("user_id", metadata.user_id);

        if (reactivateError) {
          console.error("Error reactivating subscription:", reactivateError);
          throw reactivateError;
        }

        console.log("Subscription reactivated successfully:", metadata.subscription_id);

        // ✅ NÃO criar transação financeira para reativações de plataforma
        // Isso evita que apareçam nos relatórios do usuário
        console.log(`ℹ️ Reativação de plataforma processada (sem criar transação financeira)`);
      }
      // Pagamento de assinatura normal da plataforma
      else if (metadata?.userId) {
        // Check if subscription already exists
        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", metadata.userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const startDate = new Date();
        const nextBillingDate = new Date(startDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + (metadata.months || 1));
        
        // Adicionar 7 dias de trial
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);

        if (existingSub) {
          // Update existing subscription
          const { error: updateError } = await supabaseClient
            .from("subscriptions")
            .update({
              status: "active",
              type: "platform",  // ✅ GARANTIR type correto
              plan_id: null,  // ✅ Plataforma usa plan_id=null
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
              failed_payments_count: 0,
            })
            .eq("id", existingSub.id);

          if (updateError) {
            console.error("Error updating subscription:", updateError);
          } else {
            console.log("Subscription updated successfully");
          }
        } else {
          // Create new subscription
          const { error: createError } = await supabaseClient
            .from("subscriptions")
            .insert({
              user_id: metadata.userId,
              plan_id: null,  // ✅ Plataforma usa plan_id=null
              customer_id: null,  // ✅ Plataforma usa customer_id=null
              type: "platform",  // ✅ GARANTIR type correto
              status: "active",
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
            });

          if (createError) {
            console.error("Error creating subscription:", createError);
          } else {
            console.log("Subscription created successfully");
          }
        }

        // ✅ NÃO criar transação financeira para assinaturas de PLATAFORMA
        // Isso evita que pagamentos da plataforma apareçam nos relatórios do usuário
        console.log(`ℹ️ Assinatura de plataforma processada (sem criar transação financeira)`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Webhook processed successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing Mercado Pago webhook:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Error processing webhook",
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
