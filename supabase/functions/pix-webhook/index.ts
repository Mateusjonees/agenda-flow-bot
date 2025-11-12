import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PixWebhookPayload {
  txid: string;
  status: "paid" | "expired" | "cancelled";
  amount: number;
  paidAt?: string;
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

    // TODO: Verify webhook signature from your payment provider
    // This is critical for security!
    
    const payload: PixWebhookPayload = await req.json();
    console.log("Received Pix webhook:", payload);

    // Find the Pix charge
    const { data: pixCharge, error: findError } = await supabaseClient
      .from("pix_charges")
      .select("*")
      .eq("txid", payload.txid)
      .single();

    if (findError || !pixCharge) {
      console.error("Pix charge not found:", payload.txid);
      return new Response(
        JSON.stringify({ error: "Pix charge not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update Pix charge status
    const updateData: any = {
      status: payload.status,
      updated_at: new Date().toISOString()
    };

    if (payload.status === "paid" && payload.paidAt) {
      updateData.paid_at = payload.paidAt;
    }

    const { error: updateError } = await supabaseClient
      .from("pix_charges")
      .update(updateData)
      .eq("id", pixCharge.id);

    if (updateError) {
      throw updateError;
    }

    console.log("Pix charge updated successfully:", pixCharge.id);

    // Process subscription if this is a subscription payment
    if (payload.status === "paid" && pixCharge.metadata) {
      const metadata = typeof pixCharge.metadata === 'string' 
        ? JSON.parse(pixCharge.metadata) 
        : pixCharge.metadata;

      // Pagamento de assinatura da plataforma (Planos do sistema)
      if (metadata?.userId && metadata?.planId) {
        console.log("Processing platform subscription payment for user:", metadata.userId);

        // Check if subscription exists
        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", metadata.userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const startDate = new Date();
        const nextBillingDate = new Date(startDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + (metadata.months || 1));

        if (existingSub) {
          // Update existing subscription
          const { error: subUpdateError } = await supabaseClient
            .from("subscriptions")
            .update({
              status: "active",
              plan_id: metadata.planId || existingSub.plan_id,
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
              failed_payments_count: 0,
            })
            .eq("id", existingSub.id);

          if (subUpdateError) {
            console.error("Error updating subscription:", subUpdateError);
          } else {
            console.log("Subscription updated successfully");
          }
        } else {
          // Create new subscription
          const { error: subCreateError } = await supabaseClient
            .from("subscriptions")
            .insert({
              user_id: metadata.userId,
              plan_id: metadata.planId,
              status: "active",
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
            });

          if (subCreateError) {
            console.error("Error creating subscription:", subCreateError);
          } else {
            console.log("Subscription created successfully");
          }
        }

        // Create financial transaction for platform subscription
        const { error: transError } = await supabaseClient
          .from("financial_transactions")
          .insert({
            user_id: metadata.userId,
            type: "income",
            amount: payload.amount,
            description: `Assinatura ${metadata.billingFrequency || 'Renovação'} - PIX`,
            payment_method: "pix",
            status: "completed",
            transaction_date: new Date().toISOString(),
          });

        if (transError) {
          console.error("Error creating financial transaction:", transError);
        }
      }
      
      // Pagamento de assinatura de cliente (Assinaturas da aba Assinaturas)
      else if (metadata?.subscription_id) {
        console.log("Processing customer subscription payment, subscription_id:", metadata.subscription_id);

        // Get subscription details
        const { data: subscription } = await supabaseClient
          .from("subscriptions")
          .select(`
            *,
            subscription_plans (name, price),
            customers (name)
          `)
          .eq("id", metadata.subscription_id)
          .single();

        if (subscription) {
          // Update subscription as paid
          const { error: subUpdateError } = await supabaseClient
            .from("subscriptions")
            .update({
              last_billing_date: new Date().toISOString(),
              failed_payments_count: 0,
            })
            .eq("id", metadata.subscription_id);

          if (subUpdateError) {
            console.error("Error updating customer subscription:", subUpdateError);
          }

          // Create financial transaction for customer subscription
          const { error: transError } = await supabaseClient
            .from("financial_transactions")
            .insert({
              user_id: subscription.user_id,
              type: "income",
              amount: payload.amount,
              description: `Pagamento Assinatura - ${subscription.customers?.name || 'Cliente'} - ${subscription.subscription_plans?.name || 'Plano'}`,
              payment_method: "pix",
              status: "completed",
              transaction_date: new Date().toISOString(),
            });

          if (transError) {
            console.error("Error creating financial transaction for customer subscription:", transError);
          } else {
            console.log("Financial transaction created successfully for customer subscription");
          }
        }
      }
    }

    // TODO: Send WhatsApp confirmation message to customer
    // You can call send-whatsapp function here

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
    console.error("Error processing Pix webhook:", error);
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
