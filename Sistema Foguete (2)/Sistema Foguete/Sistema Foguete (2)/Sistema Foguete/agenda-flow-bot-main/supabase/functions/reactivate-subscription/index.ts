import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateOperation } from "../_shared/subscription-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReactivateRequest {
  subscriptionId: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_frequency: string;
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

    console.log(`Creating payment for subscription reactivation ${subscriptionId} for user ${user.id}`);

    // Buscar assinatura para garantir que pertence ao usuário
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select(`
        *,
        subscription_plans:plan_id (
          id,
          name,
          description,
          price,
          billing_frequency
        )
      `)
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found or unauthorized");
    }

    // ✅ VALIDAÇÃO: Verificar que é subscription de cliente
    const validation = validateOperation(subscription, 'reactivate', 'client');
    if (!validation.valid) {
      console.error(validation.error);
      throw new Error(validation.error);
    }

    // Verificar que tem customer_id (redundante mas explícito)
    if (!subscription.customer_id) {
      throw new Error("Cannot reactivate: This is a platform subscription. Platform subscriptions must be reactivated through /planos page.");
    }

    console.log(`Reactivating CLIENT subscription ${subscriptionId} for customer ${subscription.customer_id}`);

    // Verificar se a assinatura está cancelada
    if (subscription.status !== "cancelled") {
      throw new Error("A assinatura não está cancelada");
    }

    const plan = subscription.subscription_plans as unknown as SubscriptionPlan;
    if (!plan) {
      throw new Error("Plano da assinatura não encontrado");
    }

    // Buscar dados do cliente
    const { data: customer, error: customerError } = await supabaseClient
      .from("customers")
      .select("*")
      .eq("id", subscription.customer_id)
      .single();

    if (customerError || !customer) {
      throw new Error("Cliente não encontrado");
    }

    // Criar preferência de pagamento no Mercado Pago
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("Mercado Pago access token not configured");
    }

    const preference = {
      items: [
        {
          title: `Reativação - ${plan.name}`,
          description: plan.description || `Pagamento para reativar assinatura ${plan.name}`,
          quantity: 1,
          unit_price: Number(plan.price),
          currency_id: "BRL",
        },
      ],
      payer: {
        name: customer.name,
        email: customer.email || "",
        phone: {
          number: customer.phone || "",
        },
      },
      back_urls: {
        success: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
        failure: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
        pending: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      },
      auto_return: "approved",
      external_reference: subscriptionId,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      metadata: {
        subscription_id: subscriptionId,
        customer_id: subscription.customer_id,
        user_id: user.id,
        type: "subscription_reactivation",
      },
    };

    console.log("Creating Mercado Pago preference:", JSON.stringify(preference, null, 2));

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Mercado Pago API error:", errorText);
      throw new Error(`Erro ao criar preferência no Mercado Pago: ${errorText}`);
    }

    const mpData = await mpResponse.json();
    console.log("Mercado Pago preference created:", mpData.id);

    // Retornar o link de pagamento para o usuário
    // A assinatura será reativada automaticamente quando o webhook confirmar o pagamento
    return new Response(
      JSON.stringify({ 
        success: true,
        paymentUrl: mpData.init_point,
        preferenceId: mpData.id,
        message: "Link de pagamento gerado. Complete o pagamento para reativar a assinatura." 
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
