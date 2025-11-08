import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PixChargeRequest {
  appointmentId?: string;
  amount: number;
  customerName: string;
  customerPhone?: string;
  description?: string;
  metadata?: Record<string, any>;
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
        service: "generate-pix",
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startedAt
      }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("✅ Usuário autenticado:", user.id);

    const { appointmentId, amount, customerName, customerPhone, description, metadata }: PixChargeRequest = 
      await req.json();

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    // Create payment with Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": `${user.id}-${Date.now()}`
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: description || "Assinatura Foguete Gestão",
        payment_method_id: "pix",
        payer: {
          email: user.email,
          first_name: customerName.split(" ")[0],
          last_name: customerName.split(" ").slice(1).join(" ") || customerName.split(" ")[0]
        },
        metadata: metadata || {}
      })
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("❌ Erro Mercado Pago:", mpResponse.status, errorText);
      
      let errorMessage = "Erro ao criar cobrança PIX";
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
        service: "generate-pix",
        timestamp: new Date().toISOString()
      }), {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const mpData = await mpResponse.json();
    console.log("Mercado Pago payment created:", mpData.id);

    const txid = mpData.id.toString();
    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || "";
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || "";
    const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url || "";
    
    // Create Pix charge in database
    const { data: pixCharge, error: pixError } = await adminClient
      .from("pix_charges")
      .insert({
        user_id: user.id,
        appointment_id: appointmentId || null,
        txid: txid,
        amount: amount,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        qr_code: qrCode,
        qr_code_url: ticketUrl,
        description: description || "Pagamento de serviço",
        status: mpData.status || "pending",
        expires_at: mpData.date_of_expiration || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          qr_code_base64: qrCodeBase64,
          mp_payment_id: mpData.id,
          ticket_url: ticketUrl,
          ...metadata
        }
      })
      .select()
      .single();

    if (pixError) {
      console.error("❌ Erro ao criar pix_charge:", pixError);
      throw pixError;
    }

    // Create pending financial transaction
    const { error: transactionError } = await adminClient
      .from("financial_transactions")
      .insert({
        user_id: user.id,
        appointment_id: appointmentId || null,
        type: "income",
        amount: amount,
        description: `Cobrança Pix - ${customerName}`,
        payment_method: "pix",
        status: "pending"
      });

    if (transactionError) {
      console.error("⚠️ Erro ao criar transaction:", transactionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        charge: pixCharge,
        qrCode: qrCode,
        qrCodeBase64: qrCodeBase64,
        ticketUrl: ticketUrl,
        paymentId: mpData.id,
        message: "Cobrança Pix gerada com sucesso!"
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
        service: "generate-pix"
      }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);
