import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserSeatPreferenceRequest {
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

    const body: UserSeatPreferenceRequest = await req.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password || !role) {
      throw new Error("Missing required fields: email, name, password, role");
    }

    console.log(`💳 Gerando preferência de cartão para novo usuário: ${email}`);

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

    // Buscar dados do perfil do owner para preencher payer
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .single();

    const baseUrl = Deno.env.get("PUBLIC_APP_URL") || "https://sistemafoguete.com.br";
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`;

    // Criar preferência de pagamento
    const preferenceData = {
      items: [
        {
          id: `user-seat-${Date.now()}`,
          title: `Licença de Usuário - ${name}`,
          description: `Acesso mensal para ${email}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: amount,
        },
      ],
      payer: {
        name: profile?.full_name || user.email?.split("@")[0] || "Usuario",
        email: user.email || email,
      },
      back_urls: {
        success: `${baseUrl}/configuracoes?payment=success`,
        failure: `${baseUrl}/configuracoes?payment=failure`,
        pending: `${baseUrl}/configuracoes?payment=pending`,
      },
      auto_return: "approved",
      notification_url: webhookUrl,
      metadata: {
        type: "user_seat",
        owner_user_id: user.id,
        pending_email: email,
        pending_name: name,
        pending_role: role,
      },
      external_reference: `user-seat:${user.id}:${email}`,
    };

    console.log("📤 Criando preferência no Mercado Pago...");

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
      console.error("❌ Erro Mercado Pago:", errorText);
      throw new Error(`Erro ao criar preferência: ${errorText}`);
    }

    const mpPreference = await mpResponse.json();
    console.log("✅ Preferência criada:", mpPreference.id);

    // Salvar no banco de dados
    const { data: seatPayment, error: insertError } = await supabaseClient
      .from("user_seat_payments")
      .insert({
        owner_user_id: user.id,
        pending_email: email,
        pending_name: name,
        pending_password: password,
        pending_role: role,
        amount,
        payment_method: "card",
        payment_id: mpPreference.id,
        status: "pending",
        checkout_url: mpPreference.init_point,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
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
        preferenceId: mpPreference.id,
        checkoutUrl: mpPreference.init_point,
        seatPaymentId: seatPayment.id,
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
