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

    console.log("🔍 Verificando pagamentos da plataforma pendentes de processamento...");

    // ✅ CORREÇÃO CRÍTICA: Buscar APENAS charges que ainda NÃO foram processados
    // processed_at IS NULL garante idempotência - cada pagamento só é processado 1x
    const { data: paidCharges, error: fetchError } = await supabaseClient
      .from("pix_charges")
      .select("*")
      .eq("status", "paid")
      .is("processed_at", null)           // ✅ IDEMPOTÊNCIA: Só não-processados
      .is("appointment_id", null)         // Não é agendamento
      .order("paid_at", { ascending: true }); // Processar na ordem cronológica

    if (fetchError) {
      throw fetchError;
    }

    // Filtrar apenas charges de plataforma (têm userId no metadata)
    const platformCharges = (paidCharges || []).filter(charge => {
      const metadata = typeof charge.metadata === 'string' 
        ? JSON.parse(charge.metadata) 
        : charge.metadata;
      return metadata?.userId && !charge.customer_id;
    });

    console.log(`📋 Encontradas ${platformCharges.length} cobranças de plataforma pendentes de processamento`);

    const results = [];

    for (const charge of platformCharges) {
      try {
        const metadata = typeof charge.metadata === 'string' 
          ? JSON.parse(charge.metadata) 
          : charge.metadata;

        const userId = metadata?.userId;
        const planId = metadata?.planId;
        const months = metadata?.months || 1;

        // Normalizar months para valores válidos (1, 6, 12)
        const normalizedMonths = [1, 6, 12].includes(months) ? months : 
          (months <= 3 ? 1 : months <= 9 ? 6 : 12);

        if (normalizedMonths !== months) {
          console.warn(`⚠️ Meses normalizados de ${months} para ${normalizedMonths}`);
        }

        console.log(`🔎 Processando charge ${charge.id} do user ${userId} (${normalizedMonths} meses)`);

        // ✅ LOCK ATÔMICO: Marcar como processado ANTES de qualquer operação
        // Se outro processo tentar ao mesmo tempo, só um consegue o lock
        const { data: lockedCharge, error: lockError } = await supabaseClient
          .from("pix_charges")
          .update({ 
            processed_at: new Date().toISOString(),
            processed_for: "platform",
            updated_at: new Date().toISOString()
          })
          .eq("id", charge.id)
          .is("processed_at", null)  // ✅ Só atualiza se ainda não processado
          .select()
          .maybeSingle();

        if (lockError || !lockedCharge) {
          console.log(`⏭️ Charge ${charge.id} já foi processado por outro processo, pulando...`);
          continue;
        }

        console.log(`🔒 Lock adquirido para charge ${charge.id}`);

        // Verificar se já existe subscription da plataforma para este usuário
        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .is("customer_id", null)
          .is("plan_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const chargeDate = new Date(charge.paid_at || charge.created_at);

        if (!existingSub) {
          console.log(`📝 Criando subscription da plataforma para user ${userId}`);

          // Para nova criação, não acumular
          const nextBillingDate = new Date(chargeDate);
          nextBillingDate.setMonth(nextBillingDate.getMonth() + normalizedMonths);
          
          console.log(`📅 Next billing date: ${nextBillingDate.toISOString()} (start: ${chargeDate.toISOString()} + ${normalizedMonths} meses)`);

          // Criar subscription da plataforma
          const { error: subError } = await supabaseClient
            .from("subscriptions")
            .insert({
              user_id: userId,
              customer_id: null,
              plan_id: null,
              type: "platform",
              status: "active",
              start_date: chargeDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: chargeDate.toISOString(),
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
            results.push({
              charge_id: charge.id,
              user_id: userId,
              status: "created",
              plan_id: planId,
              months: normalizedMonths
            });
          }
        } else {
          console.log(`ℹ️ User ${userId} já possui subscription da plataforma`);
          
          // ✅ CORREÇÃO: Usar lógica de acumulação correta
          // Acumular a partir do MAIOR entre (data do pagamento, next_billing_date existente)
          const { nextBillingDate, accumulatedDays } = calculateAccumulatedNextBillingDate(
            chargeDate,
            normalizedMonths,
            existingSub.next_billing_date
          );
          
          console.log(`📅 Atualizando subscription ${existingSub.id} - ${normalizedMonths} meses${accumulatedDays > 0 ? ` + ${accumulatedDays} dias acumulados` : ''}`);

          const { error: updateError } = await supabaseClient
            .from("subscriptions")
            .update({
              type: "platform",
              last_billing_date: chargeDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              status: "active",
              failed_payments_count: 0,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingSub.id);

          if (updateError) {
            console.error("❌ Erro ao atualizar subscription:", updateError);
            results.push({
              charge_id: charge.id,
              user_id: userId,
              status: "error",
              error: updateError.message
            });
          } else {
            results.push({
              charge_id: charge.id,
              user_id: userId,
              status: "updated",
              accumulated_days: accumulatedDays,
              months: normalizedMonths
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
        total_paid: paidCharges?.length || 0,
        total_platform_pending: platformCharges.length,
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
