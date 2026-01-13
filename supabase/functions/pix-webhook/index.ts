import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { calculateAccumulatedNextBillingDate, tryLockPixCharge } from "../_shared/platform-subscription-helpers.ts";

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

        // ✅ IDEMPOTÊNCIA: Tentar adquirir lock antes de processar
        const { locked } = await tryLockPixCharge(supabaseClient, pixCharge.id, "platform");
        if (!locked) {
          console.log("⏭️ Pagamento já processado, retornando sucesso");
          return new Response(
            JSON.stringify({ success: true, message: "Already processed" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // ✅ Buscar subscription de PLATAFORMA (customer_id e plan_id NULL)
        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", metadata.userId)
          .is("customer_id", null)
          .is("plan_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const startDate = new Date();
        const months = metadata.months || 1;
        
        // Normalizar months
        const normalizedMonths = [1, 6, 12].includes(months) ? months : 
          (months <= 3 ? 1 : months <= 9 ? 6 : 12);
        
        // ✅ ACUMULAR dias restantes se existir assinatura ativa
        const { nextBillingDate, accumulatedDays } = calculateAccumulatedNextBillingDate(
          startDate,
          normalizedMonths,
          existingSub?.next_billing_date
        );
        
        console.log(`📅 Next billing date: ${nextBillingDate.toISOString()} (${normalizedMonths} meses${accumulatedDays > 0 ? ` + ${accumulatedDays} dias acumulados` : ''})`);

        if (existingSub) {
          // Update existing subscription
          const { error: subUpdateError } = await supabaseClient
            .from("subscriptions")
            .update({
              status: "active",
              type: "platform",
              plan_id: null,
              customer_id: null,
              billing_frequency: metadata.billingFrequency,
              payment_method: "pix",
              plan_name: metadata.planName,
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
              failed_payments_count: 0,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingSub.id);

          if (subUpdateError) {
            console.error("Error updating subscription:", subUpdateError);
          } else {
            console.log("Subscription updated successfully");
            console.log(`✅ Pagamento confirmado para assinatura: ${existingSub.id}${accumulatedDays > 0 ? ` (+${accumulatedDays} dias acumulados)` : ''}`);
          }
        } else {
          // Create new subscription
          const { error: subCreateError } = await supabaseClient
            .from("subscriptions")
            .insert({
              user_id: metadata.userId,
              plan_id: null,
              customer_id: null,
              billing_frequency: metadata.billingFrequency,
              payment_method: "pix",
              plan_name: metadata.planName,
              type: "platform",
              status: "active",
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
              failed_payments_count: 0
            });

          if (subCreateError) {
            console.error("Error creating subscription:", subCreateError);
          } else {
            console.log("Subscription created successfully");
            console.log("✅ Nova assinatura criada com pagamento confirmado");
          }
        }

        console.log("ℹ️ Assinatura de plataforma processada - NÃO criar transação financeira");
      }
      
      // Pagamento de assinatura de cliente (Assinaturas da aba Assinaturas)
      else if (metadata?.subscription_id) {
        console.log("Processing customer subscription payment, subscription_id:", metadata.subscription_id);

        // ✅ IDEMPOTÊNCIA: Tentar adquirir lock
        const { locked } = await tryLockPixCharge(supabaseClient, pixCharge.id, "customer");
        if (!locked) {
          console.log("⏭️ Pagamento já processado, retornando sucesso");
          return new Response(
            JSON.stringify({ success: true, message: "Already processed" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

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

          // Create financial transaction for customer subscription (verificar duplicação)
          const description = `Pagamento Assinatura - ${subscription.customers?.name || 'Cliente'} - ${subscription.subscription_plans?.name || 'Plano'}`;
          const { data: existingTrans } = await supabaseClient
            .from("financial_transactions")
            .select("id")
            .eq("user_id", subscription.user_id)
            .eq("amount", payload.amount)
            .eq("description", description)
            .eq("payment_method", "pix")
            .eq("status", "completed")
            .maybeSingle();

          if (!existingTrans) {
            const { error: transError } = await supabaseClient
              .from("financial_transactions")
              .insert({
                user_id: subscription.user_id,
                type: "income",
                amount: payload.amount,
                description: description,
                payment_method: "pix",
                status: "completed",
                transaction_date: new Date().toISOString(),
              });

            if (transError) {
              console.error("Error creating financial transaction for customer subscription:", transError);
            } else {
              console.log("Financial transaction created successfully for customer subscription");
            }
          } else {
            console.log("ℹ️ Financial transaction already exists for customer subscription, skipping");
          }
        }
      }

      // Pagamento de pedido WhatsApp (E-commerce)
      else if (metadata?.order_id) {
        console.log("Processing WhatsApp order payment, order_id:", metadata.order_id);

        // ✅ IDEMPOTÊNCIA: Tentar adquirir lock
        const { locked } = await tryLockPixCharge(supabaseClient, pixCharge.id, "order");
        if (!locked) {
          console.log("⏭️ Pagamento já processado, retornando sucesso");
          return new Response(
            JSON.stringify({ success: true, message: "Already processed" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get order details
        const { data: order } = await supabaseClient
          .from("orders")
          .select(`
            *,
            customers (name, phone)
          `)
          .eq("id", metadata.order_id)
          .single();

        if (order) {
          // Update order status
          const { error: orderUpdateError } = await supabaseClient
            .from("orders")
            .update({
              status: "paid",
              payment_confirmed_at: new Date().toISOString(),
            })
            .eq("id", metadata.order_id);

          if (orderUpdateError) {
            console.error("Error updating order status:", orderUpdateError);
          } else {
            console.log("✅ Order status updated to 'paid'");
          }

          // Deduzir estoque dos produtos vendidos
          const { data: orderItems } = await supabaseClient
            .from("order_items")
            .select("id, product_id, variant_id, quantity, inventory_deducted")
            .eq("order_id", metadata.order_id)
            .eq("inventory_deducted", false);

          if (orderItems && orderItems.length > 0) {
            console.log(`📦 Deducting inventory for ${orderItems.length} items...`);

            for (const item of orderItems) {
              if (item.variant_id) {
                const { error: variantError } = await supabaseClient.rpc(
                  "decrement_variant_stock",
                  {
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                  }
                );

                if (variantError) {
                  console.error(`Error deducting variant stock (${item.variant_id}):`, variantError);
                } else {
                  await supabaseClient
                    .from("order_items")
                    .update({ inventory_deducted: true })
                    .eq("id", item.id);
                  console.log(`✅ Variant stock deducted: ${item.variant_id} (-${item.quantity})`);
                }
              } else if (item.product_id) {
                const { error: productError } = await supabaseClient.rpc(
                  "decrement_product_stock",
                  {
                    product_id: item.product_id,
                    quantity: item.quantity,
                  }
                );

                if (productError) {
                  console.error(`Error deducting product stock (${item.product_id}):`, productError);
                } else {
                  await supabaseClient
                    .from("order_items")
                    .update({ inventory_deducted: true })
                    .eq("id", item.id);
                  console.log(`✅ Product stock deducted: ${item.product_id} (-${item.quantity})`);
                }
              }
            }
          }

          // Find or create "Vendas WhatsApp" category
          let categoryId = null;
          const { data: existingCategory } = await supabaseClient
            .from("financial_categories")
            .select("id")
            .eq("user_id", order.user_id)
            .eq("name", "Vendas WhatsApp")
            .eq("type", "income")
            .maybeSingle();

          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            const { data: newCategory, error: catError } = await supabaseClient
              .from("financial_categories")
              .insert({
                user_id: order.user_id,
                name: "Vendas WhatsApp",
                type: "income",
              })
              .select("id")
              .single();

            if (!catError && newCategory) {
              categoryId = newCategory.id;
              console.log("✅ Created 'Vendas WhatsApp' category");
            }
          }

          // Create financial transaction
          const description = `Venda WhatsApp - Pedido #${metadata.order_number || order.order_number} - ${order.customers?.name || 'Cliente'}`;
          const { data: existingTrans } = await supabaseClient
            .from("financial_transactions")
            .select("id")
            .eq("user_id", order.user_id)
            .eq("amount", payload.amount)
            .eq("description", description)
            .eq("payment_method", "pix")
            .eq("status", "completed")
            .maybeSingle();

          if (!existingTrans) {
            const { error: transError } = await supabaseClient
              .from("financial_transactions")
              .insert({
                user_id: order.user_id,
                category_id: categoryId,
                type: "income",
                amount: payload.amount,
                description: description,
                payment_method: "pix",
                status: "completed",
                transaction_date: new Date().toISOString(),
              });

            if (transError) {
              console.error("Error creating financial transaction for WhatsApp order:", transError);
            } else {
              console.log("✅ Financial transaction created successfully for WhatsApp order");
            }
          } else {
            console.log("ℹ️ Financial transaction already exists for WhatsApp order, skipping");
          }

          // Send WhatsApp confirmation message
          if (order.conversation_id) {
            const sendUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp-message`;
            const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

            try {
              await fetch(sendUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({
                  user_id: order.user_id,
                  conversation_id: order.conversation_id,
                  to: order.customers?.phone || order.shipping_address?.recipient_phone,
                  message_type: "text",
                  content: `✅ *Pagamento confirmado!*

📦 *Pedido:* #${metadata.order_number || order.order_number}
💰 *Valor:* R$ ${order.total.toFixed(2)}

Seu pedido está sendo preparado para envio. Em breve você receberá o código de rastreamento! 🚚`,
                }),
              });
              console.log("✅ WhatsApp payment confirmation sent");
            } catch (error) {
              console.error("Error sending WhatsApp confirmation:", error);
            }
          }
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
