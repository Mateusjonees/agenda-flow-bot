import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action } = await req.json();
    console.log(`Evolution API action: ${action} for user: ${user.id}`);

    // Get Evolution API config from secrets
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error("Evolution API not configured");
      return new Response(
        JSON.stringify({ 
          error: "Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY nos secrets." 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Instance name based on user ID (shortened)
    const instanceName = `foguete_${user.id.substring(0, 8)}`;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': evolutionApiKey,
    };

    switch (action) {
      case "status": {
        // Check if instance exists and is connected
        try {
          const response = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
            method: 'GET',
            headers,
          });

          if (!response.ok) {
            // Instance might not exist
            console.log("Instance not found or not connected");
            return new Response(
              JSON.stringify({ connected: false }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const data = await response.json();
          console.log("Connection state:", data);

          const isConnected = data?.instance?.state === 'open';

          if (isConnected) {
            return new Response(
              JSON.stringify({ connected: true, instanceName }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Check if there's a QR code available
          const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers,
          });

          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            if (qrData?.base64) {
              return new Response(
                JSON.stringify({ connected: false, qrcode: qrData.base64, instanceName }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }

          return new Response(
            JSON.stringify({ connected: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (err) {
          console.error("Status check error:", err);
          return new Response(
            JSON.stringify({ connected: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case "connect": {
        // First, try to create instance if it doesn't exist
        try {
          const createResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              instanceName,
              qrcode: true,
              integration: 'WHATSAPP-BAILEYS',
            }),
          });

          const createData = await createResponse.json();
          console.log("Create instance response:", createData);

          // If instance was created or already exists, get QR code
          const connectResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers,
          });

          if (!connectResponse.ok) {
            throw new Error("Falha ao obter QR Code");
          }

          const connectData = await connectResponse.json();
          console.log("Connect response:", connectData);

          if (connectData?.base64) {
            return new Response(
              JSON.stringify({ qrcode: connectData.base64, instanceName }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Check if already connected
          if (connectData?.instance?.state === 'open') {
            return new Response(
              JSON.stringify({ connected: true, instanceName }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          throw new Error("Não foi possível gerar o QR Code");
        } catch (err: any) {
          console.error("Connect error:", err);
          return new Response(
            JSON.stringify({ error: err.message || "Erro ao conectar" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case "refresh-qr": {
        try {
          const response = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers,
          });

          if (!response.ok) {
            throw new Error("Falha ao atualizar QR Code");
          }

          const data = await response.json();
          
          if (data?.base64) {
            return new Response(
              JSON.stringify({ qrcode: data.base64 }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          throw new Error("QR Code não disponível");
        } catch (err: any) {
          console.error("Refresh QR error:", err);
          return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case "disconnect": {
        try {
          // Logout from WhatsApp
          await fetch(`${evolutionApiUrl}/instance/logout/${instanceName}`, {
            method: 'DELETE',
            headers,
          });

          // Delete instance
          await fetch(`${evolutionApiUrl}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers,
          });

          console.log("Instance disconnected and deleted");

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (err: any) {
          console.error("Disconnect error:", err);
          return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: "Ação inválida" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (err: any) {
    console.error("Evolution API error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
