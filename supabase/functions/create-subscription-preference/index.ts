import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PreferenceRequest {
  plan_id?: string;
  plan_name?: string;
  price?: number;
  billing_frequency?: string;
  months?: number;
  user_id?: string;
  planType?: "monthly" | "semestral" | "annual";
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

    const requestData: PreferenceRequest = await req.json();
    
    // Mapear billing_frequency do frontend para planType interno
    const billingToTypeMap: Record<string, string> = {
      "monthly": "monthly",
      "semiannual": "semestral",
      "annual": "annual"
    };
    
    // Suporta tanto o formato antigo (planType) quanto o novo (billing_frequency)
    const planType = requestData.planType || billingToTypeMap[requestData.billing_frequency || ""] || "monthly";

    console.log(`Creating subscription preference for user ${user.id} with plan ${planType}`, requestData);

  // Definir preços e descrições baseado no plano
    const planDetails: Record<string, { price: number; title: string; description: string; frequency: number; frequency_type: string }> = {
      monthly: { 
        price: 49.00, 
        title: "Plano Mensal", 
        description: "Assinatura mensal da plataforma - Ideal para começar",
        frequency: 1,
        frequency_type: "months"
      },
      semestral: { 
        price: 259.00, 
        title: "Plano Semestral", 
        description: "Assinatura semestral da plataforma - Economia de 12%",
        frequency: 6,
        frequency_type: "months"
      },
      annual: { 
        price: 475.00, 
        title: "Plano Anual", 
        description: "Assinatura anual da plataforma - Economia de 19%",
        frequency: 12,
        frequency_type: "months"
      }
    };

    const selectedPlan = planDetails[planType] || planDetails.monthly;

    // Buscar dados do perfil do usuário
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    // Criar preferência de assinatura no Mercado Pago
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    
    if (!accessToken) {
      throw new Error("Mercado Pago access token not configured");
    }

    // Criar data de início com buffer de 5 minutos no futuro
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() + 5);

    const preferenceData = {
      reason: selectedPlan.title,
      auto_recurring: {
        frequency: selectedPlan.frequency,
        frequency_type: selectedPlan.frequency_type,
        transaction_amount: selectedPlan.price,
        currency_id: "BRL",
        start_date: startDate.toISOString(),
        free_trial: {
          frequency: 7,
          frequency_type: "days"
        }
      },
      back_url: `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovableproject.com") || ""}/configuracoes`,
      payer_email: user.email,
      external_reference: user.id,
      metadata: {
        userId: user.id,
        planId: planType,
        billingFrequency: planType,
        planName: selectedPlan.title,
        months: selectedPlan.frequency,
        type: "platform_subscription"
      }
    };

    console.log("Creating Mercado Pago subscription preference with data:", preferenceData);

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Mercado Pago error:", errorText);
      throw new Error(`Erro ao criar preferência no Mercado Pago: ${errorText}`);
    }

    const preferenceResponse = await mpResponse.json();

    console.log(`Subscription preference created successfully: ${preferenceResponse.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        init_point: preferenceResponse.init_point,
        preference_id: preferenceResponse.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating subscription preference:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao criar preferência de assinatura",
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
