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

    const url = new URL(req.url);
    const topic = url.searchParams.get("topic");
    const id = url.searchParams.get("id");

    console.log("Mercado Pago webhook received:", { topic, id });

    if (!topic || !id) {
      return new Response(
        JSON.stringify({ error: "Missing topic or id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("Mercado Pago access token not configured");
    }

    // Get payment information from Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!mpResponse.ok) {
      throw new Error(`Failed to get payment info: ${mpResponse.status}`);
    }

    const payment = await mpResponse.json();
    console.log("Payment info:", payment);

    const metadata = payment.metadata;
    const status = payment.status;

    if (status === "approved") {
      // Create subscription
      const { data: planData } = await supabaseClient
        .from("subscription_plans")
        .select("*")
        .eq("id", metadata.planId)
        .single();

      if (planData) {
        const startDate = new Date();
        const nextBillingDate = new Date(startDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + metadata.months);

        const { error: subError } = await supabaseClient
          .from("subscriptions")
          .insert({
            user_id: metadata.userId,
            customer_id: metadata.userId, // Using user as customer
            plan_id: metadata.planId,
            status: "active",
            start_date: startDate.toISOString(),
            next_billing_date: nextBillingDate.toISOString(),
            last_billing_date: startDate.toISOString(),
          });

        if (subError) {
          console.error("Error creating subscription:", subError);
        } else {
          console.log("Subscription created successfully");
        }

        // Create financial transaction
        const { error: transError } = await supabaseClient
          .from("financial_transactions")
          .insert({
            user_id: metadata.userId,
            type: "income",
            amount: payment.transaction_amount,
            description: `Assinatura ${metadata.billingFrequency}`,
            payment_method: payment.payment_type_id,
            status: "completed",
            transaction_date: new Date().toISOString(),
          });

        if (transError) {
          console.error("Error creating transaction:", transError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Webhook processed successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing Mercado Pago webhook:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Error processing webhook",
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
