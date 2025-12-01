import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting subscription reminders check...");

    // Calcular data daqui a 3 dias
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);

    const fourDaysFromNow = new Date(threeDaysFromNow);
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 1);

    console.log(`Checking subscriptions expiring between ${threeDaysFromNow.toISOString()} and ${fourDaysFromNow.toISOString()}`);

    // Buscar assinaturas ativas que vencem em 3 dias
    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from("subscriptions")
      .select(`
        id,
        user_id,
        next_billing_date,
        status
      `)
      .eq("status", "active")
      .gte("next_billing_date", threeDaysFromNow.toISOString())
      .lt("next_billing_date", fourDaysFromNow.toISOString())
      .is("customer_id", null); // Apenas assinaturas de usuários da plataforma, não de clientes

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions to remind`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No subscriptions to remind",
          count: 0 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Para cada assinatura, buscar dados do usuário e verificar se já não enviou lembrete
    const remindersToSend = [];

    for (const subscription of subscriptions) {
      // Verificar se já enviou lembrete nos últimos 2 dias
      const { data: existingReminder } = await supabaseClient
        .from("subscription_reminders")
        .select("id")
        .eq("subscription_id", subscription.id)
        .eq("days_before_expiration", 3)
        .gte("sent_at", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existingReminder) {
        console.log(`Reminder already sent for subscription ${subscription.id}`);
        continue;
      }

      // Buscar dados do usuário
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("full_name")
        .eq("id", subscription.user_id)
        .single();

      // Buscar email do usuário
      const { data: { user } } = await supabaseClient.auth.admin.getUserById(subscription.user_id);

      if (!user?.email) {
        console.log(`No email found for user ${subscription.user_id}`);
        continue;
      }

      remindersToSend.push({
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        userEmail: user.email,
        userName: profile?.full_name || user.email.split('@')[0],
        daysUntilExpiration: 3,
        nextBillingDate: subscription.next_billing_date,
      });
    }

    console.log(`Sending ${remindersToSend.length} reminders...`);

    // Enviar lembretes
    const results = await Promise.allSettled(
      remindersToSend.map(async (reminder) => {
        const response = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-subscription-reminder`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify(reminder),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to send reminder: ${error}`);
        }

        return response.json();
      })
    );

    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    console.log(`Reminders sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription reminders check completed",
        total: remindersToSend.length,
        successful,
        failed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in check-subscription-reminders:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Error checking subscription reminders",
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
