import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserSeatPixRequest {
  email: string;
  name: string;
  password: string;
  role: string;
}

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

    const body: UserSeatPixRequest = await req.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password || !role) {
      throw new Error("Missing required fields: email, name, password, role");
    }

    console.log(`📧 Gerando PIX para novo usuário: ${email}`);

    // Verificar se email já existe
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
      throw new Error("Este email já está cadastrado no sistema");
    }

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    // Valor fixo de R$19,00 por usuário
    const amount = 19.00;
    const expirationMinutes = 30;
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + expirationMinutes);

    // Criar pagamento PIX no Mercado Pago
    const paymentData = {
      transaction_amount: amount,
      description: `Licença de Usuário - ${name}`,
      payment_method_id: "pix",
      payer: {
        email: user.email || email,
        first_name: name.split(" ")[0],
        last_name: name.split(" ").slice(1).join(" ") || "Usuario",
      },
      metadata: {
        type: "user_seat",
        owner_user_id: user.id,
        pending_email: email,
        pending_name: name,
        pending_role: role,
      },
      date_of_expiration: expirationDate.toISOString(),
    };

    console.log("📤 Criando pagamento PIX no Mercado Pago...");

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `user-seat-${user.id}-${email}-${Date.now()}`,
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

    // Salvar no banco de dados
    const { data: seatPayment, error: insertError } = await supabaseClient
      .from("user_seat_payments")
      .insert({
        owner_user_id: user.id,
        pending_email: email,
        pending_name: name,
        pending_password: password, // Será usada para criar o usuário após pagamento
        pending_role: role,
        amount,
        payment_method: "pix",
        mp_payment_id: String(mpPayment.id),
        status: "pending",
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
        expires_at: expirationDate.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Erro ao salvar pagamento:", insertError);
      throw new Error("Erro ao salvar dados do pagamento");
    }

    console.log("✅ Pagamento salvo:", seatPayment.id);

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: seatPayment.id,
          qr_code: qrCode,
          qr_code_base64: qrCodeBase64,
          ticket_url: ticketUrl,
          amount,
          pending_email: email,
          pending_name: name,
          expires_at: expirationDate.toISOString(),
        },
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
