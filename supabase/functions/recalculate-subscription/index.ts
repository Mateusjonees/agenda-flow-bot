import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function de admin para recalcular assinaturas corrompidas
 * 
 * Uso: POST /recalculate-subscription
 * Body: { userId?: string } - se não informado, recalcula todos os corrompidos
 * 
 * O que faz:
 * 1. Busca pagamentos PIX pagos de plataforma ordenados por paid_at
 * 2. Deduplicados por txid
 * 3. Calcula next_billing_date cronologicamente
 * 4. Atualiza subscription com valores corretos
 */
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let body: { userId?: string; dryRun?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // Body opcional
    }

    const { userId, dryRun = false } = body;

    console.log(`🔧 Recalculando assinaturas${userId ? ` para user ${userId}` : ' corrompidas'}${dryRun ? ' (DRY RUN)' : ''}`);

    // Buscar assinaturas de plataforma (potencialmente corrompidas)
    let query = supabaseClient
      .from("subscriptions")
      .select("*")
      .is("customer_id", null)
      .is("plan_id", null)
      .eq("type", "platform");

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) throw subError;

    console.log(`📋 Encontradas ${subscriptions?.length || 0} assinaturas de plataforma`);

    const results: any[] = [];
    const now = new Date();

    for (const sub of subscriptions || []) {
      try {
        // Verificar se está corrompida (next_billing_date > 400 dias no futuro)
        const nextBilling = new Date(sub.next_billing_date);
        const daysRemaining = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 400 && !userId) {
          // Não corrompida, pular (a menos que seja recálculo específico)
          continue;
        }

        console.log(`\n🔍 Processando user ${sub.user_id} (dias atuais: ${daysRemaining})`);

        // Buscar todos os pagamentos PIX de plataforma deste usuário
        const { data: charges, error: chargeError } = await supabaseClient
          .from("pix_charges")
          .select("*")
          .eq("status", "paid")
          .is("appointment_id", null)
          .order("paid_at", { ascending: true });

        if (chargeError) throw chargeError;

        // Filtrar apenas charges deste usuário com metadata de plataforma
        const userCharges = (charges || []).filter(c => {
          const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata;
          return meta?.userId === sub.user_id && !c.customer_id;
        });

        console.log(`📋 Encontrados ${userCharges.length} pagamentos para user ${sub.user_id}`);

        // Deduplicar por txid
        const seenTxids = new Set<string>();
        const uniqueCharges = userCharges.filter(c => {
          if (seenTxids.has(c.txid)) return false;
          seenTxids.add(c.txid);
          return true;
        });

        console.log(`📋 ${uniqueCharges.length} pagamentos únicos após deduplicação`);

        if (uniqueCharges.length === 0) {
          console.log(`⚠️ Nenhum pagamento encontrado para user ${sub.user_id}`);
          results.push({
            user_id: sub.user_id,
            status: "skipped",
            reason: "no_payments",
            old_days: daysRemaining
          });
          continue;
        }

        // Calcular next_billing_date cronologicamente
        let calculatedNextBilling: Date | null = null;
        let totalMonths = 0;
        const paymentDetails: any[] = [];

        for (const charge of uniqueCharges) {
          const meta = typeof charge.metadata === 'string' ? JSON.parse(charge.metadata) : charge.metadata;
          let months = meta?.months || 1;
          
          // Normalizar months
          months = [1, 6, 12].includes(months) ? months : (months <= 3 ? 1 : months <= 9 ? 6 : 12);
          totalMonths += months;

          const paidAt = new Date(charge.paid_at || charge.created_at);
          
          paymentDetails.push({
            txid: charge.txid,
            paid_at: paidAt.toISOString(),
            months: months,
            amount: charge.amount
          });

          if (!calculatedNextBilling) {
            // Primeiro pagamento: base = paid_at + months
            calculatedNextBilling = new Date(paidAt);
            calculatedNextBilling.setMonth(calculatedNextBilling.getMonth() + months);
          } else {
            // Pagamentos subsequentes: acumular a partir do next atual
            // Se o pagamento foi feito antes de vencer, acumular
            // Se foi depois, partir do pagamento
            if (paidAt < calculatedNextBilling) {
              // Pago antes de vencer - acumular
              calculatedNextBilling.setMonth(calculatedNextBilling.getMonth() + months);
            } else {
              // Pago depois de vencer - partir do pagamento
              calculatedNextBilling = new Date(paidAt);
              calculatedNextBilling.setMonth(calculatedNextBilling.getMonth() + months);
            }
          }
        }

        // Guard-rail: limitar a 400 dias no máximo
        const maxDays = 400;
        const calculatedDays = Math.ceil((calculatedNextBilling!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (calculatedDays > maxDays) {
          console.warn(`⚠️ Limitando de ${calculatedDays} para ${maxDays} dias`);
          calculatedNextBilling = new Date(now);
          calculatedNextBilling.setDate(calculatedNextBilling.getDate() + maxDays);
        }

        const newDays = Math.ceil((calculatedNextBilling!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const firstPayment = uniqueCharges[0];
        const lastPayment = uniqueCharges[uniqueCharges.length - 1];

        console.log(`📊 Recálculo: ${daysRemaining} dias → ${newDays} dias`);
        console.log(`📊 Total de meses pagos: ${totalMonths}`);

        const result: any = {
          user_id: sub.user_id,
          subscription_id: sub.id,
          old_next_billing: sub.next_billing_date,
          old_days: daysRemaining,
          new_next_billing: calculatedNextBilling!.toISOString(),
          new_days: newDays,
          total_payments: uniqueCharges.length,
          total_months: totalMonths,
          payment_details: paymentDetails
        };

        if (!dryRun) {
          // Atualizar subscription
          const { error: updateError } = await supabaseClient
            .from("subscriptions")
            .update({
              start_date: new Date(firstPayment.paid_at || firstPayment.created_at).toISOString(),
              last_billing_date: new Date(lastPayment.paid_at || lastPayment.created_at).toISOString(),
              next_billing_date: calculatedNextBilling!.toISOString(),
              status: newDays > 0 ? "active" : "expired",
              type: "platform",
              customer_id: null,
              plan_id: null,
              updated_at: new Date().toISOString()
            })
            .eq("id", sub.id);

          if (updateError) {
            console.error("❌ Erro ao atualizar:", updateError);
            result.status = "error";
            result.error = updateError.message;
          } else {
            console.log("✅ Subscription atualizada!");
            result.status = "updated";

            // Marcar todos os charges como processados
            for (const charge of uniqueCharges) {
              await supabaseClient
                .from("pix_charges")
                .update({
                  processed_at: new Date().toISOString(),
                  processed_for: "platform_recalc"
                })
                .eq("id", charge.id)
                .is("processed_at", null);
            }
          }
        } else {
          result.status = "dry_run";
        }

        results.push(result);

      } catch (error: any) {
        console.error(`❌ Erro processando user ${sub.user_id}:`, error);
        results.push({
          user_id: sub.user_id,
          status: "error",
          error: error.message
        });
      }
    }

    const summary = {
      total_checked: subscriptions?.length || 0,
      total_processed: results.length,
      updated: results.filter(r => r.status === "updated").length,
      errors: results.filter(r => r.status === "error").length,
      skipped: results.filter(r => r.status === "skipped").length,
      dry_run: dryRun
    };

    console.log("\n📊 Resumo:", summary);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("❌ Erro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
