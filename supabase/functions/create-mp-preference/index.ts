import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PreferenceRequest {
  title: string;
  quantity: number;
  unit_price: number;
  description: string;
  payer: {
    email: string;
    name?: string;
  };
  metadata: {
    planId: string;
    billingFrequency: string;
    months: number;
    userId: string;
  };
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

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body: PreferenceRequest = await req.json();
    console.log("Creating Mercado Pago preference:", body);

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("Mercado Pago access token not configured");
    }

    // Create preference with Mercado Pago API
    const preferenceData = {
      items: [
        {
          title: body.title,
          quantity: body.quantity,
          unit_price: body.unit_price,
          currency_id: "BRL",
        }
      ],
      payer: {
        email: body.payer.email,
        name: body.payer.name || body.payer.email,
      },
      back_urls: {
        success: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook?status=success`,
        failure: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook?status=failure`,
        pending: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      metadata: body.metadata,
      statement_descriptor: "FOGUETE GESTAO",
      external_reference: `${body.metadata.userId}_${Date.now()}`,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error("Mercado Pago API error:", errorData);
      throw new Error(`Mercado Pago API error: ${mpResponse.status}`);
    }

    const preference = await mpResponse.json();
    console.log("Mercado Pago preference created:", preference.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        preferenceId: preference.id,
        initPoint: preference.init_point,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating Mercado Pago preference:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Error creating preference",
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
