import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isPlatformSubscription, isClientSubscription } from "../_shared/subscription-validation.ts";

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

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    console.log("🔍 Buscando cobranças PIX pendentes...");

    // Buscar cobranças pendentes dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: pendingCharges, error: fetchError } = await supabaseClient
      .from("pix_charges")
      .select("*")
      .eq("status", "pending")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📋 Encontradas ${pendingCharges?.length || 0} cobranças pendentes`);

    const results = [];

    for (const charge of pendingCharges || []) {
      try {
        // Pegar ID do pagamento do metadata
        const metadata = typeof charge.metadata === 'string' 
          ? JSON.parse(charge.metadata) 
          : charge.metadata;

        const mpPaymentId = metadata?.mp_payment_id;

        if (!mpPaymentId) {
          console.log(`⚠️ Cobrança ${charge.id} sem mp_payment_id`);
          continue;
        }

        // Consultar status no Mercado Pago
        const mpResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${mpPaymentId}`,
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          }
        );

        if (!mpResponse.ok) {
          console.error(`❌ Erro ao consultar MP payment ${mpPaymentId}: ${mpResponse.status}`);
          continue;
        }

        const payment = await mpResponse.json();
        console.log(`🔎 Payment ${mpPaymentId} status: ${payment.status}`);

        // Se foi aprovado, processar
        if (payment.status === "approved") {
          console.log(`✅ Pagamento ${mpPaymentId} APROVADO! Processando...`);

          // Atualizar cobrança
          const { error: updateError } = await supabaseClient
            .from("pix_charges")
            .update({
              status: "paid",
              paid_at: payment.date_approved || new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("id", charge.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar cobrança ${charge.id}:`, updateError);
            continue;
          }

          // Processar assinatura se for pagamento de plano
          if (metadata?.userId && metadata?.planId) {
            console.log(`💳 Processing PLATFORM subscription payment for user ${metadata.userId}`);

            // Buscar a assinatura de PLATAFORMA do usuário
            const { data: existingSub } = await supabaseClient
              .from("subscriptions")
              .select("*")
              .eq("user_id", metadata.userId)
              .is("customer_id", null)  // ✅ FILTRO: Apenas plataforma
              .is("plan_id", null)      // ✅ FILTRO: Apenas plataforma
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            const startDate = new Date();
            const nextBillingDate = new Date(startDate);
            nextBillingDate.setMonth(nextBillingDate.getMonth() + (metadata.months || 1));
            
            // Adicionar 7 dias de trial
            nextBillingDate.setDate(nextBillingDate.getDate() + 7);
            
            console.log(`📅 Next billing date: ${nextBillingDate.toISOString()} (${metadata.months || 1} months + 7 days trial)`);

            if (existingSub) {
              // Atualizar
              const { error: subError } = await supabaseClient
                .from("subscriptions")
                .update({
                  status: "active",
                  plan_id: null,  // ✅ Assinatura de plataforma usa plan_id=null
                  start_date: startDate.toISOString(),
                  next_billing_date: nextBillingDate.toISOString(),
                  last_billing_date: startDate.toISOString(),
                  failed_payments_count: 0,
                })
                .eq("id", existingSub.id);

              if (subError) {
                console.error("❌ Erro ao atualizar subscription:", subError);
              } else {
                console.log(`✅ Subscription ${existingSub.id} atualizada!`);
              }
            } else {
              // Criar nova
              const { error: subError } = await supabaseClient
                .from("subscriptions")
                .insert({
                  user_id: metadata.userId,
                  plan_id: null,  // ✅ Assinatura de plataforma usa plan_id=null
                  customer_id: null,  // ✅ Assinatura de plataforma
                  status: "active",
                  start_date: startDate.toISOString(),
                  next_billing_date: nextBillingDate.toISOString(),
                  last_billing_date: startDate.toISOString(),
                });

              if (subError) {
                console.error("❌ Erro ao criar subscription:", subError);
              } else {
                console.log("✅ Nova subscription criada!");
              }
            }

            // ✅ NÃO criar transação financeira para assinaturas de PLATAFORMA
            // Isso evita que pagamentos da plataforma apareçam nos relatórios do usuário
            console.log("ℹ️ Assinatura de plataforma - não criar transação financeira no relatório do usuário");
          }

          // Se é uma assinatura de cliente (subscription_id presente no charge)
          if (charge.subscription_id) {
            console.log(`💳 Processing CLIENT subscription payment for subscription ${charge.subscription_id}`);
            
            // Buscar e validar a subscription
            const { data: subscription } = await supabaseClient
              .from("subscriptions")
              .select("*")
              .eq("id", charge.subscription_id)
              .single();
            
            if (subscription && !isClientSubscription(subscription)) {
              console.error(`ERROR: Expected client subscription but got platform subscription for ${charge.subscription_id}`);
              results.push({
                charge_id: charge.id,
                status: "error",
                error: "Invalid subscription type"
              });
              continue;
            }
            
            if (subscription) {
              console.log(`Updating CLIENT subscription ${charge.subscription_id} to active`);
              
              const { error: subUpdateError } = await supabaseClient
                .from("subscriptions")
                .update({
                  status: "active",
                  last_billing_date: new Date().toISOString(),
                  failed_payments_count: 0,
                })
                .eq("id", charge.subscription_id);

              if (subUpdateError) {
                console.error(`❌ Erro ao atualizar subscription de cliente:`, subUpdateError);
              } else {
                console.log(`✅ Client subscription ${charge.subscription_id} updated!`);
              }

              // Criar transação financeira (verificar duplicação)
              const { data: existingTrans } = await supabaseClient
                .from("financial_transactions")
                .select("id")
                .eq("user_id", subscription.user_id)
                .eq("amount", charge.amount)
                .eq("description", "Assinatura de Cliente - PIX")
                .eq("payment_method", "pix")
                .eq("status", "completed")
                .maybeSingle();

              if (!existingTrans) {
                const { error: transError } = await supabaseClient
                  .from("financial_transactions")
                  .insert({
                    user_id: subscription.user_id,
                    type: "income",
                    amount: charge.amount,
                    description: `Assinatura de Cliente - PIX`,
                    payment_method: "pix",
                    status: "completed",
                    transaction_date: new Date().toISOString(),
                  });

                if (transError) {
                  console.error("❌ Erro ao criar transação de cliente:", transError);
                } else {
                  console.log("✅ Transaction de cliente criada");
                }
              } else {
                console.log("ℹ️ Transaction de cliente já existe, pulando");
              }
            }
          }

          results.push({
            charge_id: charge.id,
            mp_payment_id: mpPaymentId,
            status: "processed",
            user_id: metadata?.userId
          });
        }
      } catch (error: any) {
        console.error(`❌ Erro processando cobrança ${charge.id}:`, error);
        results.push({
          charge_id: charge.id,
          status: "error",
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_pending: pendingCharges?.length || 0,
        processed: results.filter(r => r.status === "processed").length,
        errors: results.filter(r => r.status === "error").length,
        results: results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Erro completo:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro desconhecido",
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
