import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const url = new URL(req.url);
    let topic = url.searchParams.get("topic");
    let id = url.searchParams.get("id");
    let action = url.searchParams.get("action");

    // Tentar obter do body se não vier por query params
    try {
      const body = await req.json();
      topic = topic || body.topic;
      id = id || body.id || body.data?.id;
      action = action || body.action;
      
      console.log("📥 Webhook received:", { topic, id, action, body });
    } catch (e) {
      console.log("📥 Webhook received (query params only):", { topic, id, action });
    }

    if (!topic && !action) {
      return new Response(
        JSON.stringify({ error: "Missing topic or action" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

        const startDate = new Date();
        const months = parseInt(metadata.months || "1");
        const nextBillingDate = new Date(startDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + months);

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
          const { error: subError } = await supabaseClient
            .from("subscriptions")
            .insert({
              user_id: userId,
              status: "active",
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
              failed_payments_count: 0
            });

          if (subError) {
            console.error("❌ Erro ao criar subscription:", subError);
          } else {
            console.log("✅ Nova subscription da plataforma criada");
          }
        }

        // Criar transação financeira
        const { error: transError } = await supabaseClient
          .from("financial_transactions")
          .insert({
            user_id: userId,
            type: "income",
            amount: preapprovalData.auto_recurring?.transaction_amount || 0,
            description: `Assinatura ${metadata.billingFrequency || metadata.planId} - Plano Foguetinho`,
            payment_method: "mercado_pago",
            status: "completed",
            transaction_date: new Date().toISOString()
          });

        if (transError) {
          console.error("❌ Erro ao criar transação:", transError);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Platform subscription activated" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Processar webhooks de pagamento único (payment.created)
    if (action === "payment.created" && id) {
      console.log("💳 Processando pagamento único (payment.created)");
      
      // Buscar informações do pagamento
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!paymentResponse.ok) {
        console.error("Erro ao buscar payment:", await paymentResponse.text());
        return new Response(
          JSON.stringify({ error: "Failed to fetch payment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payment = await paymentResponse.json();
      console.log("💳 Payment data:", payment);

      // Se tem preapproval_id, deve ser processado como assinatura recorrente (não chegaria aqui)
      if (payment.preapproval_id) {
        console.log("⚠️ Payment tem preapproval_id, redirecionando para fluxo de assinatura");
        // Processar como assinatura recorrente
      } else if (payment.status === "approved" && payment.metadata?.type === "platform_subscription") {
        // Pagamento PIX único aprovado para plano da plataforma
        const metadata = payment.metadata;
        const userId = metadata.userId;

        if (!userId) {
          console.error("Missing userId in payment metadata");
          return new Response(
            JSON.stringify({ error: "Missing userId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`✅ Processando pagamento PIX da plataforma para user ${userId}`);

        const startDate = new Date();
        const months = parseInt(metadata.months || "1");
        const nextBillingDate = new Date(startDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + months);

        // Verificar subscription existente da plataforma
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
          const { error: subError } = await supabaseClient
            .from("subscriptions")
            .insert({
              user_id: userId,
              status: "active",
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
              failed_payments_count: 0
            });

          if (subError) {
            console.error("❌ Erro ao criar subscription:", subError);
          } else {
            console.log("✅ Nova subscription da plataforma criada");
          }
        }

        // Criar transação financeira
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
          console.error("❌ Erro ao criar transação:", transError);
        }

        // Atualizar pix_charge se existir
        if (payment.external_reference) {
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
            console.error("❌ Erro ao atualizar pix_charge:", pixError);
          } else {
            console.log("✅ PIX charge atualizado");
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: "Platform PIX payment processed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
        
        // Calcular próxima data de cobrança
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

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
