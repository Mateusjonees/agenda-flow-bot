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

    console.log("Checking for expired subscriptions...");

    const now = new Date();
    
    // Buscar assinaturas de PLATAFORMA expiradas
    const { data: expiredPlatformSubs } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .in("status", ["active", "trial"])
      .lt("next_billing_date", now.toISOString())
      .is("customer_id", null)
      .is("plan_id", null);

    // Buscar assinaturas de CLIENTE expiradas
    const { data: expiredClientSubs } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .in("status", ["active", "trial"])
      .lt("next_billing_date", now.toISOString())
      .not("customer_id", "is", null)
      .not("plan_id", "is", null);

    console.log(`Found ${expiredPlatformSubs?.length || 0} expired PLATFORM subscriptions`);
    console.log(`Found ${expiredClientSubs?.length || 0} expired CLIENT subscriptions`);

    // Combinar ambas as listas
    const subscriptions = [
      ...(expiredPlatformSubs || []),
      ...(expiredClientSubs || [])
    ];

    const results = [];

    for (const sub of subscriptions) {
      try {
        // ✅ VALIDAÇÃO: Verificar integridade dos dados
        const validation = validateSubscriptionIntegrity(sub);
        if (!validation.valid) {
          console.error(validation.error);
          results.push({
            subscriptionId: sub.id,
            userId: sub.user_id,
            success: false,
            error: validation.error,
          });
          continue;
        }

        console.log(`Processing expired ${validation.subscriptionType} subscription ${sub.id}`);

        // Atualizar status para expirado
        const { error: updateError } = await supabaseClient
          .from("subscriptions")
          .update({
            status: "expired",
            updated_at: now.toISOString(),
          })
          .eq("id", sub.id);

        if (updateError) {
          console.error(`Error updating subscription ${sub.id}:`, updateError);
          results.push({
            subscriptionId: sub.id,
            userId: sub.user_id,
            success: false,
            error: updateError.message,
          });
        } else {
          console.log(`Successfully expired subscription ${sub.id}`);
          results.push({
            subscriptionId: sub.id,
            userId: sub.user_id,
            success: true,
            previousStatus: sub.status,
            newStatus: "expired",
          });
        }
      } catch (error: any) {
        console.error(`Error processing subscription ${sub.id}:`, error);
        results.push({
          subscriptionId: sub.id,
          userId: sub.user_id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} subscriptions`,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error checking expired subscriptions:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Error checking subscriptions",
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
