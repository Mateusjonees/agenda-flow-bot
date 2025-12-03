import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: evolution-api-proxy
 * 
 * Propósito:
 * - Fazer proxy das requisições para Evolution API v2.x
 * - Resolver problema de Mixed Content (HTTPS → HTTP)
 * - Manter API Key segura no servidor
 * 
 * Endpoints suportados:
 * - GET  /instance/connect/{instance} - Gerar QR Code
 * - GET  /instance/connectionState/{instance} - Status da conexão
 * - POST /message/sendText/{instance} - Enviar texto
 * - POST /message/sendMedia/{instance} - Enviar mídia
 * - POST /chat/whatsappNumbers/{instance} - Verificar número
 */

interface ProxyRequest {
  endpoint: string;       // Ex: "/instance/connect/sistema-foguete"
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter credenciais do ambiente (configuradas no dashboard Supabase)
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error("❌ Evolution API credentials not configured");
      return new Response(
        JSON.stringify({ 
          error: "Evolution API not configured",
          details: "Missing EVOLUTION_API_URL or EVOLUTION_API_KEY environment variables"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Parse request body
    const request: ProxyRequest = await req.json();

    console.log("🔄 Evolution API Proxy:", {
      endpoint: request.endpoint,
      method: request.method,
    });

    // Validar endpoint (segurança básica - evitar SSRF)
    const allowedPrefixes = [
      "/instance/",
      "/message/",
      "/chat/",
      "/group/",
      "/webhook/",
    ];

    const isAllowed = allowedPrefixes.some(prefix => 
      request.endpoint.startsWith(prefix)
    );

    if (!isAllowed) {
      console.error("❌ Endpoint not allowed:", request.endpoint);
      return new Response(
        JSON.stringify({ error: "Endpoint not allowed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Construir URL completa
    const url = `${evolutionApiUrl}${request.endpoint}`;

    // Configurar headers para Evolution API
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "apikey": evolutionApiKey,
    };

    // Configurar opções da requisição
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Adicionar body se não for GET
    if (request.method !== "GET" && request.body) {
      fetchOptions.body = JSON.stringify(request.body);
    }

    console.log("📤 Forwarding to Evolution API:", url);

    // Fazer requisição para Evolution API
    const response = await fetch(url, fetchOptions);

    // Ler resposta
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Se não for JSON, retornar como texto
      responseData = { raw: responseText };
    }

    console.log("📥 Evolution API response:", {
      status: response.status,
      ok: response.ok,
    });

    // Se a Evolution API retornou erro, logar detalhes
    if (!response.ok) {
      console.error("❌ Evolution API error:", responseData);
    }

    // Retornar resposta
    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: response.status,
      }
    );

  } catch (error) {
    console.error("❌ Proxy error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Proxy error", 
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
