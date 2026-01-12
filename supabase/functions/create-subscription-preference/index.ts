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
  card_token_id?: string;
  payer_email?: string;
  payer_identification?: {
    type: string;
    number: string;
  };
  device_session_id?: string;
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
    
    const billingToTypeMap: Record<string, string> = {
      "monthly": "monthly",
      "semiannual": "semestral",
      "annual": "annual"
    };
    
    const planType = requestData.planType || billingToTypeMap[requestData.billing_frequency || ""] || "monthly";

    console.log(`Creating subscription preference for user ${user.id} with plan ${planType}`);

    const planDetails: Record<string, { price: number; title: string; description: string; frequency: number; frequency_type: string }> = {
      monthly: { price: 49.00, title: "Plano Mensal", description: "Assinatura mensal", frequency: 1, frequency_type: "months" },
      semestral: { price: 259.00, title: "Plano Semestral", description: "Assinatura semestral", frequency: 6, frequency_type: "months" },
      annual: { price: 475.00, title: "Plano Anual", description: "Assinatura anual", frequency: 12, frequency_type: "months" }
    };

    const selectedPlan = planDetails[planType] || planDetails.monthly;

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, phone, cpf")
      .eq("id", user.id)
      .single();

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("Mercado Pago access token not configured");
    }

    // CARD PAYMENT FLOW
    if (requestData.card_token_id) {
      console.log("💳 Processing card payment");
      
      const payerEmail = requestData.payer_email || user.email || "";
      const payerIdentification = requestData.payer_identification?.number || profile?.cpf?.replace(/\D/g, '') || "";
      const payerName = profile?.full_name || "";
      const payerPhone = profile?.phone?.replace(/\D/g, '') || "";
      const deviceSessionId = requestData.device_session_id || "";
      
      console.log("📧 Payer email:", payerEmail);
      console.log("🆔 Payer ID:", payerIdentification ? `${payerIdentification.slice(0, 3)}***` : "MISSING");
      console.log("🔐 Device session:", deviceSessionId ? `${deviceSessionId.slice(0, 8)}...` : "NOT_PROVIDED");

      if (!payerEmail || !payerEmail.includes("@")) {
        throw new Error("Email válido é obrigatório para pagamento com cartão");
      }
      
      if (!payerIdentification || payerIdentification.length < 11) {
        throw new Error("CPF válido é obrigatório para pagamento com cartão");
      }

      const payerData: Record<string, unknown> = {
        email: payerEmail,
        first_name: payerName.split(' ')[0] || "Cliente",
        last_name: payerName.split(' ').slice(1).join(' ') || "Foguete",
        identification: { type: "CPF", number: payerIdentification }
      };

      if (payerPhone && payerPhone.length >= 10) {
        payerData.phone = { area_code: payerPhone.slice(0, 2), number: payerPhone.slice(2) };
      }

      const paymentData = {
        transaction_amount: selectedPlan.price,
        token: requestData.card_token_id,
        description: selectedPlan.title,
        installments: 1,
        payer: payerData,
        external_reference: user.id,
        metadata: { userId: user.id, planId: planType, type: "platform_subscription" },
        additional_info: {
          items: [{
            id: `plan_${planType}`,
            title: `${selectedPlan.title} - Foguete`,
            description: `${selectedPlan.description} do sistema de gestão Foguete. Acesso completo a todas as funcionalidades por ${selectedPlan.frequency} mês(es).`,
            category_id: "services",
            quantity: 1,
            unit_price: selectedPlan.price
          }],
          payer: {
            first_name: payerData.first_name as string,
            last_name: payerData.last_name as string,
            phone: payerPhone ? { area_code: payerPhone.slice(0, 2), number: payerPhone.slice(2) } : undefined,
            registration_date: new Date().toISOString()
          }
        }
      };

      const mpHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": `${user.id}-${Date.now()}`
      };

      if (deviceSessionId) {
        mpHeaders["X-meli-session-id"] = deviceSessionId;
        console.log("🔐 Added X-meli-session-id header");
      }

      const paymentResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: mpHeaders,
        body: JSON.stringify(paymentData),
      });

      const paymentResult = await paymentResponse.json();

      console.log("📥 Payment response:", { id: paymentResult.id, status: paymentResult.status, status_detail: paymentResult.status_detail });

      if (paymentResult.status !== "approved") {
        console.error("❌ Payment not approved:", paymentResult.status_detail);
        
        const errorMessages: Record<string, string> = {
          "cc_rejected_high_risk": "O Mercado Pago bloqueou este pagamento por segurança. Recomendamos usar PIX.",
          "cc_rejected_insufficient_amount": "Saldo insuficiente no cartão.",
          "cc_rejected_bad_filled_card_number": "Número do cartão incorreto.",
          "cc_rejected_bad_filled_security_code": "CVV incorreto.",
          "cc_rejected_call_for_authorize": "Autorize o pagamento com seu banco.",
          "cc_rejected_card_disabled": "Cartão desabilitado.",
        };

        const errorMessage = errorMessages[paymentResult.status_detail] || `Pagamento recusado: ${paymentResult.status_detail}`;

        return new Response(JSON.stringify({ 
          success: false, error: errorMessage, payment_id: paymentResult.id, status: paymentResult.status
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      console.log("✅ Payment approved! ID:", paymentResult.id);

      // Activate subscription
      const startDate = new Date();
      const nextBillingDate = new Date(startDate);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + selectedPlan.frequency);

      const { data: existingSub } = await supabaseClient
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .is("customer_id", null)
        .is("plan_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSub) {
        await supabaseClient.from("subscriptions").update({
          status: "active", type: "platform", billing_frequency: planType,
          payment_method: "credit_card", plan_name: selectedPlan.title,
          start_date: startDate.toISOString(), next_billing_date: nextBillingDate.toISOString(),
          last_billing_date: startDate.toISOString(), failed_payments_count: 0
        }).eq("id", existingSub.id);
      } else {
        await supabaseClient.from("subscriptions").insert({
          user_id: user.id, type: "platform", status: "active", billing_frequency: planType,
          payment_method: "credit_card", plan_name: selectedPlan.title,
          start_date: startDate.toISOString(), next_billing_date: nextBillingDate.toISOString(),
          last_billing_date: startDate.toISOString(), failed_payments_count: 0
        });
      }

      return new Response(JSON.stringify({ 
        success: true, payment_id: paymentResult.id, status: "approved",
        message: `Assinatura ativada! Pagamento de R$${selectedPlan.price.toFixed(2)} confirmado.`
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // REDIRECT FLOW (PIX/external checkout)
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
      },
      status: "pending",
      back_url: `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovableproject.com") || ""}/configuracoes`,
      payer_email: user.email,
      external_reference: user.id,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      throw new Error(`Erro ao criar preferência: ${errorText}`);
    }

    const preferenceResponse = await mpResponse.json();

    return new Response(JSON.stringify({ 
      success: true, init_point: preferenceResponse.init_point, preference_id: preferenceResponse.id
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message, success: false }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);