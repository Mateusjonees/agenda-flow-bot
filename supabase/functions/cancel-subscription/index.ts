import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateSubscriptionIntegrity } from "../_shared/subscription-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancelRequest {
  subscriptionId: string;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { subscriptionId }: CancelRequest = await req.json();

    console.log(`Canceling subscription ${subscriptionId} for user ${user.id}`);

    // Buscar assinatura para garantir que pertence ao usuário
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found or unauthorized");
    }

    // ✅ VALIDAÇÃO: Verificar integridade dos dados
    const validation = validateSubscriptionIntegrity(subscription);
    if (!validation.valid) {
      console.error(validation.error);
      throw new Error(validation.error);
    }

    console.log(`Canceling ${validation.subscriptionType} subscription ${subscriptionId}`);

    // Atualizar status da assinatura no banco
    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .update({
        status: "cancelled",
        next_billing_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (updateError) {
      throw updateError;
    }

    // Nota: Se houver um ID de assinatura do Mercado Pago armazenado,
    // você pode adicionar aqui a lógica para cancelar também no MP:
    // const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    // await fetch(`https://api.mercadopago.com/preapproval/${mpSubscriptionId}`, {
    //   method: 'PUT',
    //   headers: { 'Authorization': `Bearer ${accessToken}` },
    //   body: JSON.stringify({ status: 'cancelled' })
    // });

    console.log(`Subscription ${subscriptionId} cancelled successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Assinatura cancelada com sucesso" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao cancelar assinatura",
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
