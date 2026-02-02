import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache simples em memória para evitar rate limit
let cachedRates: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

// Valores fallback caso a API esteja indisponível
const fallbackRates = {
  usd: {
    code: "USD",
    name: "Dólar Americano",
    bid: 5.85,
    ask: 5.86,
    high: 5.90,
    low: 5.80,
    varBid: 0.02,
    pctChange: 0.34,
    timestamp: null,
  },
  eur: {
    code: "EUR",
    name: "Euro",
    bid: 6.35,
    ask: 6.36,
    high: 6.40,
    low: 6.30,
    varBid: 0.01,
    pctChange: 0.16,
    timestamp: null,
  },
  btc: {
    code: "BTC",
    name: "Bitcoin",
    bid: 520000,
    ask: 521000,
    high: 530000,
    low: 510000,
    varBid: 5000,
    pctChange: 0.97,
    timestamp: null,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    
    // Verificar se o cache ainda é válido
    if (cachedRates && (now - cacheTimestamp) < CACHE_DURATION_MS) {
      console.log("Returning cached rates");
      return new Response(
        JSON.stringify({ 
          success: true, 
          rates: cachedRates,
          updated_at: new Date(cacheTimestamp).toISOString(),
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar AwesomeAPI (gratuita e sem necessidade de API key)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(
      "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL",
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Se receber rate limit ou outro erro, usar cache ou fallback
      if (cachedRates) {
        console.log("API error, returning stale cache");
        return new Response(
          JSON.stringify({ 
            success: true, 
            rates: cachedRates,
            updated_at: new Date(cacheTimestamp).toISOString(),
            cached: true,
            stale: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log("API error, returning fallback rates");
      return new Response(
        JSON.stringify({ 
          success: true, 
          rates: fallbackRates,
          updated_at: new Date().toISOString(),
          fallback: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Formatar os dados para retorno
    const rates = {
      usd: {
        code: "USD",
        name: "Dólar Americano",
        bid: parseFloat(data.USDBRL?.bid || 0),
        ask: parseFloat(data.USDBRL?.ask || 0),
        high: parseFloat(data.USDBRL?.high || 0),
        low: parseFloat(data.USDBRL?.low || 0),
        varBid: parseFloat(data.USDBRL?.varBid || 0),
        pctChange: parseFloat(data.USDBRL?.pctChange || 0),
        timestamp: data.USDBRL?.timestamp,
      },
      eur: {
        code: "EUR",
        name: "Euro",
        bid: parseFloat(data.EURBRL?.bid || 0),
        ask: parseFloat(data.EURBRL?.ask || 0),
        high: parseFloat(data.EURBRL?.high || 0),
        low: parseFloat(data.EURBRL?.low || 0),
        varBid: parseFloat(data.EURBRL?.varBid || 0),
        pctChange: parseFloat(data.EURBRL?.pctChange || 0),
        timestamp: data.EURBRL?.timestamp,
      },
      btc: {
        code: "BTC",
        name: "Bitcoin",
        bid: parseFloat(data.BTCBRL?.bid || 0),
        ask: parseFloat(data.BTCBRL?.ask || 0),
        high: parseFloat(data.BTCBRL?.high || 0),
        low: parseFloat(data.BTCBRL?.low || 0),
        varBid: parseFloat(data.BTCBRL?.varBid || 0),
        pctChange: parseFloat(data.BTCBRL?.pctChange || 0),
        timestamp: data.BTCBRL?.timestamp,
      },
    };

    // Atualizar cache
    cachedRates = rates;
    cacheTimestamp = now;

    return new Response(
      JSON.stringify({ 
        success: true, 
        rates,
        updated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Error fetching exchange rates:", error);
    
    // Tentar retornar cache ou fallback em caso de erro
    if (cachedRates) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          rates: cachedRates,
          updated_at: new Date(cacheTimestamp).toISOString(),
          cached: true,
          stale: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        rates: fallbackRates,
        updated_at: new Date().toISOString(),
        fallback: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
