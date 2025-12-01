import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: create-order-from-cart
 * 
 * Propósito:
 * - Converter carrinho em pedido finalizado
 * - Criar snapshot imutável dos produtos
 * - Gerar cobrança PIX (integração com ASAAS)
 * - Baixar estoque (se configurado)
 * - Enviar confirmação e QR Code via WhatsApp
 * 
 * Fluxo:
 * 1. Validar carrinho (não vazio, produtos disponíveis)
 * 2. Criar pedido com order_number único
 * 3. Copiar cart_items para order_items (snapshot)
 * 4. Gerar cobrança PIX
 * 5. Marcar carrinho como convertido
 * 6. Enviar QR Code via WhatsApp
 */

interface CreateOrderRequest {
  user_id: string;
  customer_id: string;
  conversation_id?: string;
  cart_id?: string; // Opcional - usa carrinho ativo se não informado
  shipping_address: {
    recipient_name: string;
    recipient_phone?: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    postal_code: string;
    reference?: string;
  };
  payment_method?: "pix"; // Futuramente: credit_card, boleto
  customer_notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: CreateOrderRequest = await req.json();

    console.log("📦 Creating order:", {
      user_id: request.user_id,
      customer_id: request.customer_id,
    });

    // 1. Buscar carrinho ativo
    let cart: any;

    if (request.cart_id) {
      const { data } = await supabase
        .from("shopping_carts")
        .select(`
          *,
          cart_items (
            *,
            product:products (id, name, sku, track_inventory, stock_quantity),
            variant:product_variants (id, name, attributes)
          )
        `)
        .eq("id", request.cart_id)
        .single();
      cart = data;
    } else {
      const { data } = await supabase
        .from("shopping_carts")
        .select(`
          *,
          cart_items (
            *,
            product:products (id, name, sku, track_inventory, stock_quantity),
            variant:product_variants (id, name, attributes)
          )
        `)
        .eq("user_id", request.user_id)
        .eq("customer_id", request.customer_id)
        .eq("status", "active")
        .single();
      cart = data;
    }

    if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Carrinho vazio ou não encontrado" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // 2. Validar estoque de todos os itens
    for (const item of cart.cart_items) {
      if (item.product?.track_inventory) {
        if (item.product.stock_quantity < item.quantity) {
          return new Response(
            JSON.stringify({
              error: `Estoque insuficiente para ${item.product.name}`,
              product_id: item.product_id,
              available: item.product.stock_quantity,
              requested: item.quantity,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      }
    }

    // 3. Gerar número único do pedido
    const { data: orderNumberResult, error: fnError } = await supabase.rpc(
      "generate_order_number"
    );

    if (fnError) {
      console.error("Error generating order number:", fnError);
      throw fnError;
    }

    const orderNumber = orderNumberResult;

    console.log("📝 Order number generated:", orderNumber);

    // 4. Criar pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: request.user_id,
        customer_id: request.customer_id,
        cart_id: cart.id,
        conversation_id: request.conversation_id,
        order_number: orderNumber,
        status: "pending_payment",
        subtotal: cart.subtotal,
        discount: cart.discount || 0,
        shipping_cost: cart.shipping_cost || 0,
        total: cart.total,
        coupon_id: cart.coupon_id,
        coupon_discount: cart.coupon_discount || 0,
        shipping_address: request.shipping_address,
        payment_method: request.payment_method || "pix",
        customer_notes: request.customer_notes,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    console.log("✅ Order created:", order.id);

    // 5. Criar order_items (snapshot dos cart_items)
    const orderItems = cart.cart_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product?.name || "Produto removido",
      product_sku: item.product?.sku,
      variant_name: item.variant?.name,
      variant_attributes: item.variant?.attributes,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      inventory_deducted: false,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    console.log("✅ Order items created:", orderItems.length);

    // 6. Marcar carrinho como convertido
    await supabase
      .from("shopping_carts")
      .update({
        status: "converted",
        converted_to_order_id: order.id,
      })
      .eq("id", cart.id);

    // 7. Gerar cobrança PIX (integração ASAAS - similar ao sistema existente)
    const { data: customer } = await supabase
      .from("customers")
      .select("name, phone, cpf")
      .eq("id", request.customer_id)
      .single();

    // Chamar função existente de geração de PIX (já existe no projeto)
    const pixUrl = `${supabaseUrl}/functions/v1/generate-pix`;
    const pixResponse = await fetch(pixUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        user_id: request.user_id,
        customer_name: customer?.name || request.shipping_address.recipient_name,
        customer_phone: customer?.phone || request.shipping_address.recipient_phone,
        amount: order.total,
        description: `Pedido #${orderNumber}`,
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
        },
      }),
    });

    if (!pixResponse.ok) {
      console.error("PIX generation failed:", await pixResponse.text());
      throw new Error("Failed to generate PIX charge");
    }

    const pixCharge = await pixResponse.json();

    console.log("✅ PIX charge created:", pixCharge.txid);

    // 8. Atualizar pedido com pix_charge_id
    await supabase
      .from("orders")
      .update({
        pix_charge_id: pixCharge.id,
      })
      .eq("id", order.id);

    // 9. Enviar confirmação e QR Code via WhatsApp
    if (request.conversation_id) {
      const sendUrl = `${supabaseUrl}/functions/v1/send-whatsapp-message`;

      // Mensagem de confirmação
      await fetch(sendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          user_id: request.user_id,
          conversation_id: request.conversation_id,
          to: customer?.phone || request.shipping_address.recipient_phone,
          message_type: "text",
          content: `✅ *Pedido confirmado!*

📦 *Número:* ${orderNumber}
💰 *Total:* R$ ${order.total.toFixed(2)}

Estou gerando o QR Code PIX para pagamento...`,
        }),
      });

      // QR Code PIX
      setTimeout(async () => {
        await fetch(sendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            user_id: request.user_id,
            conversation_id: request.conversation_id,
            to: customer?.phone || request.shipping_address.recipient_phone,
            message_type: "image",
            media_url: pixCharge.qr_code_url,
            content: `💳 *Pagamento PIX*

Escaneie o QR Code acima ou use o código abaixo:

\`\`\`${pixCharge.qr_code}\`\`\`

⏰ Válido até: ${new Date(pixCharge.expires_at).toLocaleString("pt-BR")}

Assim que confirmar o pagamento, você receberá uma notificação!`,
          }),
        });
      }, 2000);

      console.log("✅ WhatsApp messages sent");
    }

    // 10. Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_number: orderNumber,
          total: order.total,
          status: order.status,
        },
        pix_charge: {
          id: pixCharge.id,
          qr_code: pixCharge.qr_code,
          qr_code_url: pixCharge.qr_code_url,
          expires_at: pixCharge.expires_at,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Order creation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
