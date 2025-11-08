import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReactivateRequest {
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

    const { subscriptionId }: ReactivateRequest = await req.json();

    console.log(`Reactivating subscription ${subscriptionId} for user ${user.id}`);

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

    // Verificar se a assinatura está cancelada
    if (subscription.status !== "cancelled") {
      throw new Error("Subscription is not cancelled");
    }

    // Calcular próxima data de cobrança (1 mês a partir de agora)
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    // Atualizar status da assinatura no banco
    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .update({
        status: "active",
        next_billing_date: nextBillingDate.toISOString(),
        updated_at: new Date().toISOString(),
        failed_payments_count: 0,
      })
      .eq("id", subscriptionId);

    if (updateError) {
      throw updateError;
    }

    // Nota: Se houver um ID de assinatura do Mercado Pago armazenado,
    // você pode adicionar aqui a lógica para reativar também no MP:
    // const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    // await fetch(`https://api.mercadopago.com/preapproval/${mpSubscriptionId}`, {
    //   method: 'PUT',
    //   headers: { 'Authorization': `Bearer ${accessToken}` },
    //   body: JSON.stringify({ status: 'authorized' })
    // });

    console.log(`Subscription ${subscriptionId} reactivated successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Assinatura reativada com sucesso" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error reactivating subscription:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao reativar assinatura",
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
