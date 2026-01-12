import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { calculateAccumulatedNextBillingDate } from "../_shared/platform-subscription-helpers.ts";

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

    console.log("🔍 Verificando pagamentos da plataforma pendentes...");

    // Buscar PIX charges pagos que têm metadata.userId mas não têm subscription correspondente
    const { data: paidCharges, error: fetchError } = await supabaseClient
      .from("pix_charges")
      .select("*")
      .eq("status", "paid")
      .order("paid_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📋 Encontradas ${paidCharges?.length || 0} cobranças pagas`);

    const results = [];

    for (const charge of paidCharges || []) {
      try {
        const metadata = typeof charge.metadata === 'string' 
          ? JSON.parse(charge.metadata) 
          : charge.metadata;

        const userId = metadata?.userId;
        const planId = metadata?.planId;
        const months = metadata?.months;

        // Ignorar se não tiver userId ou se for de cliente
        if (!userId || charge.customer_id) {
          continue;
        }

        console.log(`🔎 Verificando charge ${charge.id} do user ${userId}`);

        // Verificar se já existe subscription da plataforma para este usuário
        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .is("customer_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!existingSub) {
          console.log(`📝 Criando subscription da plataforma para user ${userId}`);

          const startDate = new Date(charge.paid_at || charge.created_at);
          const monthsToAdd = months || 1;
          
          // ✅ ACUMULAR dias restantes (mesmo para nova criação, pode haver subscription antiga)
          const { nextBillingDate, accumulatedDays } = calculateAccumulatedNextBillingDate(
            startDate,
            monthsToAdd,
            null // Nova criação, sem assinatura existente
          );
          
          console.log(`📅 Next billing date: ${nextBillingDate.toISOString()} (start: ${startDate.toISOString()} + ${monthsToAdd} meses)`);

          // Criar subscription da plataforma
          const { error: subError } = await supabaseClient
            .from("subscriptions")
            .insert({
              user_id: userId,
              customer_id: null,  // ✅ Assinatura de plataforma
              plan_id: null,  // ✅ Assinatura de plataforma
              type: "platform",  // ✅ GARANTIR type correto
              status: "active",
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
              failed_payments_count: 0
            });

          if (subError) {
            console.error("❌ Erro ao criar subscription:", subError);
            results.push({
              charge_id: charge.id,
              user_id: userId,
              status: "error",
              error: subError.message
            });
          } else {
            console.log(`✅ Subscription da plataforma criada para user ${userId}`);

            // ✅ NÃO criar transação financeira para assinaturas de PLATAFORMA
            // Isso evita que pagamentos da plataforma apareçam nos relatórios do usuário
            console.log("ℹ️ Assinatura de plataforma - não criar transação financeira no relatório do usuário");

            results.push({
              charge_id: charge.id,
              user_id: userId,
              status: "created",
              plan_id: planId
            });
          }
        } else {
          console.log(`ℹ️ User ${userId} já possui subscription da plataforma`);
          
          // ✅ SEMPRE recalcular com acúmulo de dias restantes
          const chargeDate = new Date(charge.paid_at || charge.created_at);
          const monthsToAdd = months || 1;
          
          // ✅ ACUMULAR dias restantes se next_billing_date está no futuro
          const { nextBillingDate, accumulatedDays } = calculateAccumulatedNextBillingDate(
            chargeDate,
            monthsToAdd,
            existingSub.next_billing_date
          );
          
          console.log(`📅 Atualizando subscription ${existingSub.id} - ${monthsToAdd} meses${accumulatedDays > 0 ? ` + ${accumulatedDays} dias acumulados` : ''}`);

          const { error: updateError } = await supabaseClient
            .from("subscriptions")
            .update({
              type: "platform",  // ✅ GARANTIR type correto
              last_billing_date: chargeDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              status: "active",
              failed_payments_count: 0,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingSub.id);

          if (updateError) {
            console.error("❌ Erro ao atualizar subscription:", updateError);
          } else {
            results.push({
              charge_id: charge.id,
              user_id: userId,
              status: "updated",
              accumulated_days: accumulatedDays
            });
          }
        }
      } catch (error: any) {
        console.error(`❌ Erro processando charge ${charge.id}:`, error);
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
        total_checked: paidCharges?.length || 0,
        processed: results.length,
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
