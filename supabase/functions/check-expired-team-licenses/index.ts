import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge function para verificar e expirar licenças de colaboradores
 * Deve ser executada diariamente via cron job
 * 
 * Esta função:
 * 1. Marca como is_paid=false todos os colaboradores com next_payment_due < NOW()
 * 2. Isso faz com que esses colaboradores entrem em modo leitura
 */
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔍 Verificando licenças de colaboradores expiradas...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Chamar a função SQL que expira licenças
    const { data, error } = await supabaseClient.rpc("expire_overdue_team_licenses");

    if (error) {
      console.error("❌ Erro ao expirar licenças:", error);
      throw error;
    }

    const expiredCount = data || 0;
    console.log(`✅ ${expiredCount} licenças de colaboradores expiradas`);

    // Também buscar colaboradores que serão expirados nos próximos 3 dias para log
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: expiringSoon } = await supabaseClient
      .from("user_roles")
      .select("user_id, next_payment_due, created_by")
      .lt("next_payment_due", threeDaysFromNow)
      .gt("next_payment_due", new Date().toISOString())
      .eq("is_paid", true)
      .not("created_by", "is", null);

    if (expiringSoon && expiringSoon.length > 0) {
      console.log(`⚠️ ${expiringSoon.length} licenças expirarão nos próximos 3 dias`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredCount,
        expiring_soon_count: expiringSoon?.length || 0,
        message: `${expiredCount} licenças expiradas, ${expiringSoon?.length || 0} expirarão em breve`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Erro na verificação de licenças:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
