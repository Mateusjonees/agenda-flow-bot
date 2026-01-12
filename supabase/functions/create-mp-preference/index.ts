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

  const startedAt = Date.now();

  try {
    // JWT Diagnostics
    const authHeader = req.headers.get("Authorization") || "";
    const hasBearer = authHeader.toLowerCase().startsWith("bearer ");
    
    let jwt = "", jwtAud = "n/a", jwtSub = "n/a", jwtExp = 0;
    
    if (hasBearer) {
      try {
        jwt = authHeader.slice(7);
        const payload = JSON.parse(atob(jwt.split(".")[1] || ""));
        jwtAud = payload?.aud || "n/a";
        jwtSub = (payload?.sub || "n/a").slice(0, 8);
        jwtExp = payload?.exp || 0;
      } catch (e) {
        console.error("❌ Erro ao decodificar JWT:", e);
      }
    }

    // Auth Client (ANON_KEY + JWT header)
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Admin Client with SERVICE_ROLE_KEY fallback
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let adminClient;

    if (serviceRoleKey) {
      adminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        serviceRoleKey
      );
      console.log("✅ Usando SERVICE_ROLE_KEY");
    } else {
      console.warn("⚠️ SERVICE_ROLE_KEY não disponível, usando authClient com RLS");
      adminClient = authClient;
    }

    // Verify authentication (PASS JWT!)
    const { data: { user }, error: userErr } = await authClient.auth.getUser(jwt);

    if (userErr || !user) {
      const now = Math.floor(Date.now() / 1000);
      const reason = !hasBearer
        ? "MissingAuthorizationHeader"
        : (jwtExp && now > jwtExp)
          ? "TokenExpired"
          : (userErr?.message || "AuthGetUserFailed");
      
      console.error("❌ Falha autenticação:", { reason, jwtAud, jwtSub, jwtExp, now });
      
      return new Response(JSON.stringify({
        error: "Usuário não autenticado",
        reason,
        jwt: { aud: jwtAud, sub: jwtSub, exp: jwtExp, now },
        service: "create-mp-preference",
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startedAt
      }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("✅ Usuário autenticado:", user.id);

    const body: PreferenceRequest = await req.json();
    console.log("Creating Mercado Pago preference:", body);

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("Mercado Pago access token not configured");
    }

    // Get user profile for additional payer data
    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name, phone, cpf")
      .eq("id", user.id)
      .single();

    const payerName = profile?.full_name || body.payer.name || body.payer.email;
    const payerPhone = profile?.phone?.replace(/\D/g, '') || "";
    const payerCpf = profile?.cpf?.replace(/\D/g, '') || "";

    // Create preference with Mercado Pago API - including all required fields for approval
    const preferenceData: Record<string, unknown> = {
      items: [
        {
          id: `plan_${body.metadata.planId || body.metadata.billingFrequency}`,
          title: body.title,
          description: body.description || `Assinatura ${body.title} - Sistema de gestão Foguete`,
          category_id: "services",
          quantity: body.quantity,
          unit_price: body.unit_price,
          currency_id: "BRL",
        }
      ],
      payer: {
        email: body.payer.email,
        name: payerName,
        surname: payerName.split(' ').slice(1).join(' ') || "",
        identification: payerCpf ? { type: "CPF", number: payerCpf } : undefined,
        phone: payerPhone ? { 
          area_code: payerPhone.slice(0, 2), 
          number: payerPhone.slice(2) 
        } : undefined,
      },
      back_urls: {
        success: "https://www.sistemafoguete.com.br/dashboard?payment=success",
        failure: "https://www.sistemafoguete.com.br/planos?payment=failure",
        pending: "https://www.sistemafoguete.com.br/planos?payment=pending",
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      metadata: body.metadata,
      statement_descriptor: "FOGUETE GESTAO",
      external_reference: `${body.metadata.userId}_${Date.now()}`,
    };

    console.log("📦 Preference items:", JSON.stringify(preferenceData.items));
    console.log("👤 Payer data:", JSON.stringify({ 
      email: body.payer.email, 
      hasPhone: !!payerPhone, 
      hasCpf: !!payerCpf 
    }));

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("❌ Erro Mercado Pago:", mpResponse.status, errorText);
      
      let errorMessage = "Erro ao criar preferência no Mercado Pago";
      let statusCode = 502;
      
      if (mpResponse.status === 400) {
        errorMessage = "Dados de pagamento inválidos. Verifique as informações.";
        statusCode = 422;
      } else if (mpResponse.status === 401) {
        errorMessage = "Erro de autenticação com Mercado Pago. Token inválido.";
        statusCode = 502;
      } else if (mpResponse.status === 429) {
        errorMessage = "Muitas tentativas. Aguarde alguns minutos.";
        statusCode = 429;
      } else if (mpResponse.status >= 500) {
        errorMessage = "Mercado Pago temporariamente indisponível.";
        statusCode = 502;
      }
      
      return new Response(JSON.stringify({
        error: errorMessage,
        details: errorText,
        mpStatus: mpResponse.status,
        service: "create-mp-preference",
        timestamp: new Date().toISOString()
      }), {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
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
    console.error("❌ Erro completo:", error);
    
    let errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    let statusCode = 400;
    
    if (errorMessage.includes("não autenticado") || errorMessage.includes("Unauthorized")) {
      statusCode = 401;
    } else if (errorMessage.includes("Mercado Pago") || errorMessage.includes("API")) {
      statusCode = 502;
    } else if (errorMessage.includes("inválido") || errorMessage.includes("invalid")) {
      statusCode = 422;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString(),
        service: "create-mp-preference"
      }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);
