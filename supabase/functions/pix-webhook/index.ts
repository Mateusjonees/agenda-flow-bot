import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MercadoPagoWebhook {
  id?: number;
  live_mode?: boolean;
  type?: string;
  date_created?: string;
  application_id?: number;
  user_id?: number;
  version?: number;
  api_version?: string;
  action?: string;
  data?: {
    id: string;
  };
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
    
    const webhook: MercadoPagoWebhook = await req.json();
    console.log("🔔 Received Mercado Pago webhook:", JSON.stringify(webhook));

    // Validate webhook type
    if (webhook.type !== "payment" && webhook.action !== "payment.updated") {
      console.log("ℹ️ Webhook type not 'payment', ignoring:", webhook.type);
      return new Response(JSON.stringify({ success: true, message: "Webhook type ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract payment ID
    const paymentId = webhook.data?.id;
    if (!paymentId) {
      console.error("❌ Payment ID not found in webhook");
      return new Response(JSON.stringify({ error: "Payment ID not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("💳 Processing payment ID:", paymentId);

    // Fetch payment details from Mercado Pago
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("❌ Error fetching payment from Mercado Pago:", errorText);
      throw new Error(`MP API error: ${mpResponse.status}`);
    }

    const paymentData = await mpResponse.json();
    console.log("📦 Payment data:", JSON.stringify({
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference,
      transaction_amount: paymentData.transaction_amount
    }));

    const txid = paymentData.id.toString();
    const status = paymentData.status; // approved, pending, rejected, etc
    const amount = paymentData.transaction_amount;

    // Find the Pix charge
    const { data: pixCharge, error: findError } = await supabaseClient
      .from("pix_charges")
      .select("*")
      .eq("txid", txid)
      .single();

    if (findError || !pixCharge) {
      console.error("❌ Pix charge not found for txid:", txid);
      return new Response(
        JSON.stringify({ error: "Pix charge not found", txid }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Pix charge found:", pixCharge.id);

    // Map Mercado Pago status to our status
    let ourStatus = "pending";
    if (status === "approved") {
      ourStatus = "paid";
    } else if (status === "rejected" || status === "cancelled") {
      ourStatus = "cancelled";
    } else if (status === "expired") {
      ourStatus = "expired";
    }

    // Update Pix charge status
    const updateData: any = {
      status: ourStatus,
      updated_at: new Date().toISOString()
    };

    if (ourStatus === "paid") {
      updateData.paid_at = paymentData.date_approved || new Date().toISOString();
    }

    const { error: updateError } = await supabaseClient
      .from("pix_charges")
      .update(updateData)
      .eq("id", pixCharge.id);

    if (updateError) {
      throw updateError;
    }

    console.log("✅ Pix charge updated successfully:", pixCharge.id, "Status:", ourStatus);

    // Process subscription if this is a subscription payment
    if (ourStatus === "paid" && pixCharge.metadata) {
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
              billing_frequency: metadata.billingFrequency,
              payment_method: "pix",
              plan_name: metadata.planName,
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
             console.log("✅ Pagamento confirmado para assinatura:", existingSub.id);
             console.log("Status atualizado para: active");
             console.log("Método de pagamento: pix");
           }
         } else {
           // Create new subscription
          const { error: subCreateError } = await supabaseClient
            .from("subscriptions")
            .insert({
              user_id: metadata.userId,
              plan_id: metadata.planId,
              billing_frequency: metadata.billingFrequency,
              payment_method: "pix",
              plan_name: metadata.planName,
              type: "platform",
              status: "active",
              start_date: startDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              last_billing_date: startDate.toISOString(),
            });

           if (subCreateError) {
             console.error("Error creating subscription:", subCreateError);
           } else {
             console.log("Subscription created successfully");
             console.log("✅ Nova assinatura criada com pagamento confirmado");
             console.log("Status: active, Método: pix");
           }
        }

        // Create financial transaction for platform subscription (verificar duplicação)
        const { data: existingTrans } = await supabaseClient
          .from("financial_transactions")
          .select("id")
          .eq("user_id", metadata.userId)
          .eq("amount", payload.amount)
          .eq("description", `Assinatura ${metadata.billingFrequency || 'Renovação'} - PIX`)
          .eq("payment_method", "pix")
          .eq("status", "completed")
          .maybeSingle();

        if (!existingTrans) {
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
          } else {
            console.log("✅ Financial transaction created");
          }
        } else {
          console.log("ℹ️ Financial transaction already exists, skipping");
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

        // Get order details
        const { data: order } = await supabaseClient
          .from("orders")
          .select(`
            *,
            customers (name)
          `)
          .eq("id", metadata.order_id)
          .single();

        if (order) {
          // Update order status
          const { error: orderUpdateError } = await supabaseClient
            .from("orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
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
              // Se tem variant_id, deduzir do variant
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
                  // Marcar como deduzido
                  await supabaseClient
                    .from("order_items")
                    .update({ inventory_deducted: true })
                    .eq("id", item.id);
                  console.log(`✅ Variant stock deducted: ${item.variant_id} (-${item.quantity})`);
                }
              }
              // Senão, deduzir do product
              else if (item.product_id) {
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
                  // Marcar como deduzido
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
            // Create category if it doesn't exist
            const { data: newCategory, error: catError } = await supabaseClient
              .from("financial_categories")
              .insert({
                user_id: order.user_id,
                name: "Vendas WhatsApp",
                type: "income",
                icon: "shopping-cart",
                color: "#10B981",
              })
              .select("id")
              .single();

            if (!catError && newCategory) {
              categoryId = newCategory.id;
              console.log("✅ Created 'Vendas WhatsApp' category");
            }
          }

          // Create financial transaction (verificar duplicação)
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
