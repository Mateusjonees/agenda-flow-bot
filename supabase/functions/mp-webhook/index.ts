import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateSubscriptionIntegrity } from "../_shared/subscription-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Mercado Pago SEMPRE envia dados no body, não em query params
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
      
      if (topic === "subscription_authorized_payment") {
        // Buscar payment para obter o preapproval_id
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          preapprovalId = paymentData.preapproval_id;
          console.log("📋 Found preapproval_id:", preapprovalId);
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

      const metadata = preapprovalData.metadata || {};
      const userId = metadata.userId || preapprovalData.external_reference;
      
      if (!userId) {
        console.error("Missing userId in metadata");
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar se é assinatura da plataforma
      if (metadata.type === "platform_subscription" && preapprovalData.status === "authorized") {
        console.log(`✅ Ativando assinatura da plataforma para user ${userId}`);

        // Usar data de criação do MP ao invés de data atual
        const startDate = new Date(preapprovalData.date_created || preapprovalData.auto_recurring?.start_date || new Date());
        const months = parseInt(metadata.months || "1");
        const nextBillingDate = new Date(startDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + months);
        
        // Adicionar 7 dias de trial
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);
        
        console.log(`📅 Next billing date calculated: ${nextBillingDate.toISOString()} (start: ${startDate.toISOString()} + ${months} months + 7 days trial)`);

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

        // Criar transação financeira (verificar duplicação)
        const description = `Assinatura ${metadata.billingFrequency || metadata.planId} - Plano Foguetinho`;
        const amount = preapprovalData.auto_recurring?.transaction_amount || 0;
        
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
          const { error: transError } = await supabaseClient
            .from("financial_transactions")
            .insert({
              user_id: userId,
              type: "income",
              amount: amount,
              description: description,
              payment_method: "mercado_pago",
              status: "completed",
              transaction_date: new Date().toISOString()
            });

          if (transError) {
            console.error("❌ Erro ao criar transação:", transError);
          } else {
            console.log("✅ Transaction criada");
          }
        } else {
          console.log("ℹ️ Transaction já existe, pulando");
        }

        return new Response(
          JSON.stringify({ success: true, message: "Platform subscription activated" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Processar webhooks de pagamento único (payment.created)
    if (action === "payment.created" && id) {
      console.log("� STEP 6: Processando pagamento único (payment.created)");
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

      // Se tem preapproval_id, é um pagamento de RENOVAÇÃO
      if (payment.preapproval_id) {
        console.log("🔄 STEP 10: Processando pagamento de RENOVAÇÃO de assinatura");
        console.log(`Preapproval ID: ${payment.preapproval_id}`);
        
        try {
          // Buscar dados do preapproval para obter metadata com userId
          const preapprovalResponse = await fetch(
            `https://api.mercadopago.com/preapproval/${payment.preapproval_id}`,
            {
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              }
            }
          );

          if (!preapprovalResponse.ok) {
            console.error("❌ Erro ao buscar preapproval:", preapprovalResponse.status);
            return new Response(
              JSON.stringify({ error: "Failed to fetch preapproval" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const preapprovalData = await preapprovalResponse.json();
          console.log("📋 Preapproval data:", JSON.stringify(preapprovalData, null, 2));
          
          const metadata = preapprovalData.metadata || {};
          const userId = metadata.userId || metadata.user_id;
          const months = parseInt(metadata.months || "1");

          if (!userId) {
            console.error("❌ Missing userId in preapproval metadata");
            return new Response(
              JSON.stringify({ error: "Missing userId in preapproval" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          console.log(`✅ STEP 11: Processando renovação para user ${userId}, ${months} mês(es)`);

          // Buscar subscription da plataforma (customer_id = null e plan_id = null)
          const { data: subscription, error: findError } = await supabaseClient
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .is("customer_id", null)
            .is("plan_id", null)
            .single();

          if (findError || !subscription) {
            console.error("❌ STEP 12: Platform subscription not found for renewal:", findError);
            return new Response(
              JSON.stringify({ error: "Subscription not found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          console.log("✅ STEP 12: Subscription encontrada:", subscription.id);

          // Validar integridade da subscription
          const validation = validateSubscriptionIntegrity(subscription);
          if (!validation.valid) {
            console.error("❌ STEP 13: Subscription validation failed:", validation.error);
            return new Response(
              JSON.stringify({ error: validation.error }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          console.log(`✅ STEP 13: Subscription validada como ${validation.subscriptionType}`);

          // Calcular nova data de renovação: adicionar months à data atual de next_billing_date
          const currentBillingDate = new Date(subscription.next_billing_date);
          const newBillingDate = new Date(currentBillingDate);
          newBillingDate.setMonth(newBillingDate.getMonth() + months);

          console.log(`📅 STEP 14: Renovação calculada:`, {
            currentBillingDate: currentBillingDate.toISOString(),
            newBillingDate: newBillingDate.toISOString(),
            months
          });

          // Atualizar subscription com nova data de renovação
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

          if (updateError) {
            console.error("❌ STEP 15: Erro ao atualizar subscription:", updateError);
            throw updateError;
          }

          console.log("✅ STEP 15: Assinatura renovada com sucesso!");

          // Registrar transação financeira da renovação
          const { error: transactionError } = await supabaseClient
            .from("financial_transactions")
            .insert({
              user_id: userId,
              type: "income",
              description: `Renovação de assinatura da plataforma - ${months} mês(es)`,
              amount: payment.transaction_amount,
              status: "completed",
              payment_method: "mercadopago_subscription",
              transaction_date: new Date().toISOString()
            });

          if (transactionError) {
            console.error("⚠️ STEP 16: Erro ao criar transação (não crítico):", transactionError);
          } else {
            console.log("✅ STEP 16: Transação financeira registrada");
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Subscription renewed successfully",
              next_billing_date: newBillingDate.toISOString()
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );

        } catch (error) {
          console.error("❌ Erro ao processar renovação:", error);
          return new Response(
            JSON.stringify({ error: "Failed to process renewal" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
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
        
        // Adicionar 7 dias de trial
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);

        console.log("🔍 STEP 13: Calculando datas da assinatura:", {
          startDate: startDate.toISOString(),
          months,
          nextBillingDate: nextBillingDate.toISOString(),
          trialDays: 7
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
          .limit(1)
          .maybeSingle();

        // Se não encontrou, tentar buscar qualquer subscription do usuário (fallback)
        if (!existingSub && !findSubError) {
          console.log("⚠️ STEP 14b: Não encontrou com customer_id null, tentando busca geral...");
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
            console.log("✅ STEP 14b: Subscription encontrada na busca geral (customer_id:", existingSub.customer_id, ")");
          }
        }

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
              billing_frequency: metadata.billingFrequency || metadata.planId,
              payment_method: "card",
              plan_name: metadata.planName,
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
            billing_frequency: metadata.billingFrequency || metadata.planId,
            payment_method: "card",
            plan_name: metadata.planName,
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

        // Criar transação financeira
        console.log("🔍 STEP 18: Criando transação financeira");
        const { error: transError } = await supabaseClient
          .from("financial_transactions")
          .insert({
            user_id: userId,
            type: "income",
            amount: payment.transaction_amount,
            description: `Assinatura ${metadata.billingFrequency || metadata.planId} - Plano Foguetinho`,
            payment_method: "pix",
            status: "completed",
            transaction_date: new Date().toISOString()
          });

        if (transError) {
          console.error("❌ STEP 19: Erro ao criar transação:", transError);
        } else {
          console.log("✅ STEP 19: Transação financeira criada com sucesso!");
        }

        // Atualizar pix_charge se existir
        if (payment.external_reference) {
          console.log("🔍 STEP 20: Atualizando pix_charge com external_reference:", payment.external_reference);
          const { error: pixError } = await supabaseClient
            .from("pix_charges")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("txid", payment.external_reference)
            .eq("user_id", userId);

          if (pixError) {
            console.error("❌ STEP 21: Erro ao atualizar pix_charge:", pixError);
          } else {
            console.log("✅ STEP 21: PIX charge atualizado com sucesso!");
          }
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

        // Criar transação financeira para o pagamento de reativação
        const { error: transError } = await supabaseClient
          .from("financial_transactions")
          .insert({
            user_id: metadata.user_id,
            type: "income",
            amount: payment.transaction_amount,
            description: "Pagamento de reativação de assinatura - Mercado Pago",
            payment_method: "credit_card",
            status: "completed",
            transaction_date: new Date().toISOString(),
          });

        if (transError) {
          console.error("Error creating reactivation transaction:", transError);
        } else {
          console.log("Financial transaction created for reactivation");
        }
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
              plan_id: metadata.planId || existingSub.plan_id,
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
              plan_id: metadata.planId,
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

        // Create financial transaction
        const { error: transError } = await supabaseClient
          .from("financial_transactions")
          .insert({
            user_id: metadata.userId,
            type: "income",
            amount: payment.transaction_amount,
            description: `Assinatura ${metadata.billingFrequency || 'Renovação'} - Mercado Pago`,
            payment_method: "credit_card",
            status: "completed",
            transaction_date: new Date().toISOString(),
          });

        if (transError) {
          console.error("Error creating transaction:", transError);
        } else {
          console.log("Financial transaction created successfully");
        }
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
