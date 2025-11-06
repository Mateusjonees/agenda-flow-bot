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

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

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
      const errorData = await mpResponse.text();
      console.error("Mercado Pago API error:", mpResponse.status, errorData);
      throw new Error(`Mercado Pago API error: ${mpResponse.status}`);
    }

    const mpData = await mpResponse.json();
    console.log("Mercado Pago payment created:", mpData.id);

    const txid = mpData.id.toString();
    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || "";
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || "";
    const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url || "";
    
    // Create Pix charge in database
    const { data: pixCharge, error: pixError } = await supabaseClient
      .from("pix_charges")
      .insert({
        user_id: user.id,
        appointment_id: appointmentId || null,
        txid: txid,
        amount: amount,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        status: mpData.status || "pending",
        expires_at: mpData.date_of_expiration || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          description: description || "Pagamento de serviço",
          mp_payment_id: mpData.id,
          ticket_url: ticketUrl,
          ...metadata
        }
      })
      .select()
      .single();

    if (pixError) {
      throw pixError;
    }

    // Create pending financial transaction
    const { error: transactionError } = await supabaseClient
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
      console.error("Error creating transaction:", transactionError);
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
    console.error("Error generating Pix charge:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao gerar cobrança Pix",
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
