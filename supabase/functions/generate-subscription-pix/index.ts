import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionPixRequest {
  planType: "monthly" | "semestral" | "annual";
}

// Valores dos planos
const planDetails = {
  monthly: { price: 49.00, title: "Plano Mensal", months: 1, billing_frequency: "monthly" },
  semestral: { price: 259.00, title: "Plano Semestral", months: 6, billing_frequency: "semestral" },
  annual: { price: 475.00, title: "Plano Anual", months: 12, billing_frequency: "annual" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Autenticar usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body: SubscriptionPixRequest = await req.json();
    const { planType } = body;

    if (!planType || !planDetails[planType]) {
      throw new Error("Tipo de plano inválido. Use: monthly, semestral ou annual");
    }

    const plan = planDetails[planType];
    console.log(`📧 Gerando PIX para assinatura ${planType}: R$ ${plan.price}`);

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const expirationMinutes = 30;
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + expirationMinutes);

    // Criar pagamento PIX no Mercado Pago
    const paymentData = {
      transaction_amount: plan.price,
      description: plan.title,
      payment_method_id: "pix",
      payer: {
        email: user.email || "usuario@email.com",
        first_name: user.user_metadata?.full_name?.split(" ")[0] || "Usuario",
        last_name: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "Sistema",
      },
      metadata: {
        type: "platform_subscription",
        userId: user.id,
        user_id: user.id,
        months: plan.months.toString(),
        plan_name: plan.title,
        plan_id: planType,
        billing_frequency: plan.billing_frequency,
      },
      date_of_expiration: expirationDate.toISOString(),
    };

    console.log("📤 Criando pagamento PIX no Mercado Pago...");

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `subscription-${user.id}-${planType}-${Date.now()}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("❌ Erro Mercado Pago:", errorText);
      throw new Error(`Erro ao criar PIX: ${errorText}`);
    }

    const mpPayment = await mpResponse.json();
    console.log("✅ PIX criado:", mpPayment.id);

    // Extrair dados do PIX
    const pixData = mpPayment.point_of_interaction?.transaction_data;
    const qrCode = pixData?.qr_code || "";
    const qrCodeBase64 = pixData?.qr_code_base64 || "";
    const ticketUrl = pixData?.ticket_url || "";

    if (!qrCode) {
      console.error("❌ QR Code não retornado:", mpPayment);
      throw new Error("Erro ao gerar QR Code PIX");
    }

    // Salvar na tabela pix_charges para rastreamento
    const { data: pixCharge, error: insertError } = await supabaseClient
      .from("pix_charges")
      .insert({
        user_id: user.id,
        amount: plan.price,
        customer_name: user.user_metadata?.full_name || user.email || "Usuario",
        customer_phone: user.user_metadata?.phone || null,
        description: plan.title,
        status: "pending",
        qr_code: qrCode,
        qr_code_url: qrCodeBase64,
        txid: String(mpPayment.id),
        expires_at: expirationDate.toISOString(),
        metadata: {
          type: "platform_subscription",
          plan_type: planType,
          months: plan.months,
          mp_payment_id: mpPayment.id,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Erro ao salvar pix_charge:", insertError);
      // Continuar mesmo com erro - o pagamento foi criado no MP
    } else {
      console.log("✅ PIX charge salvo:", pixCharge?.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        qrCode: qrCode,
        qrCodeBase64: qrCodeBase64,
        ticketUrl: ticketUrl,
        amount: plan.price,
        chargeId: pixCharge?.id || mpPayment.id,
        expiresAt: expirationDate.toISOString(),
        planName: plan.title,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("❌ Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
