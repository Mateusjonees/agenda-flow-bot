import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Usar AwesomeAPI (gratuita e sem necessidade de API key)
    const response = await fetch(
      "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL"
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
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
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
