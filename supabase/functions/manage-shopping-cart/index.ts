import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: manage-shopping-cart
 * 
 * Propósito:
 * - Gerenciar carrinho de compras (adicionar, remover, atualizar)
 * - Calcular subtotal, descontos, frete
 * - Aplicar cupons de desconto
 * - Validar estoque disponível
 * 
 * Actions:
 * - add_item: Adicionar produto ao carrinho
 * - remove_item: Remover produto do carrinho
 * - update_quantity: Atualizar quantidade
 * - apply_coupon: Aplicar cupom de desconto
 * - calculate_shipping: Calcular frete (integração futura)
 * - clear_cart: Limpar carrinho
 */

interface ManageCartRequest {
  action: "add_item" | "remove_item" | "update_quantity" | "apply_coupon" | "clear_cart";
  user_id: string;
  customer_id?: string;
  conversation_id?: string;
  cart_id?: string;
  product_id?: string;
  variant_id?: string;
  quantity?: number;
  coupon_code?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: ManageCartRequest = await req.json();

    console.log("🛒 Cart action:", request.action, {
      user_id: request.user_id,
      product_id: request.product_id,
    });

    // Buscar ou criar carrinho ativo
    let cart: any;

    if (request.cart_id) {
      const { data } = await supabase
        .from("shopping_carts")
        .select("*")
        .eq("id", request.cart_id)
        .single();
      cart = data;
    } else {
      const { data } = await supabase
        .from("shopping_carts")
        .select("*")
        .eq("user_id", request.user_id)
        .eq("customer_id", request.customer_id || null)
        .eq("status", "active")
        .maybeSingle();

      if (!data) {
        // Criar novo carrinho
        const { data: newCart, error } = await supabase
          .from("shopping_carts")
          .insert({
            user_id: request.user_id,
            customer_id: request.customer_id,
            conversation_id: request.conversation_id,
            status: "active",
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
          })
          .select()
          .single();

        if (error) throw error;
        cart = newCart;
        console.log("✅ New cart created:", cart.id);
      } else {
        cart = data;
      }
    }

    // Executar ação
    switch (request.action) {
      case "add_item": {
        if (!request.product_id || !request.quantity) {
          throw new Error("product_id and quantity are required");
        }

        // Buscar produto
        const { data: product, error: prodError } = await supabase
          .from("products")
          .select("id, name, price, stock_quantity, track_inventory, max_quantity_per_order")
          .eq("id", request.product_id)
          .eq("is_active", true)
          .single();

        if (prodError || !product) {
          return new Response(
            JSON.stringify({ error: "Produto não encontrado ou inativo" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 404,
            }
          );
        }

        // Validar estoque
        if (product.track_inventory && product.stock_quantity < request.quantity) {
          return new Response(
            JSON.stringify({
              error: "Estoque insuficiente",
              available: product.stock_quantity,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        // Validar limite por pedido
        if (product.max_quantity_per_order && request.quantity > product.max_quantity_per_order) {
          return new Response(
            JSON.stringify({
              error: "Quantidade máxima excedida",
              max_allowed: product.max_quantity_per_order,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        // Verificar se item já existe no carrinho
        const { data: existingItem } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("cart_id", cart.id)
          .eq("product_id", request.product_id)
          .eq("variant_id", request.variant_id || null)
          .maybeSingle();

        if (existingItem) {
          // Atualizar quantidade
          const newQty = existingItem.quantity + request.quantity;
          await supabase
            .from("cart_items")
            .update({
              quantity: newQty,
              subtotal: newQty * product.price,
            })
            .eq("id", existingItem.id);
        } else {
          // Adicionar novo item
          await supabase.from("cart_items").insert({
            cart_id: cart.id,
            product_id: request.product_id,
            variant_id: request.variant_id,
            quantity: request.quantity,
            unit_price: product.price,
            subtotal: request.quantity * product.price,
            product_snapshot: {
              name: product.name,
              price: product.price,
            },
          });
        }

        console.log("✅ Item added to cart");
        break;
      }

      case "remove_item": {
        if (!request.product_id) {
          throw new Error("product_id is required");
        }

        await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cart.id)
          .eq("product_id", request.product_id)
          .eq("variant_id", request.variant_id || null);

        console.log("✅ Item removed from cart");
        break;
      }

      case "update_quantity": {
        if (!request.product_id || !request.quantity) {
          throw new Error("product_id and quantity are required");
        }

        if (request.quantity === 0) {
          // Remover item
          await supabase
            .from("cart_items")
            .delete()
            .eq("cart_id", cart.id)
            .eq("product_id", request.product_id);
        } else {
          // Atualizar quantidade
          const { data: product } = await supabase
            .from("products")
            .select("price")
            .eq("id", request.product_id)
            .single();

          await supabase
            .from("cart_items")
            .update({
              quantity: request.quantity,
              subtotal: request.quantity * (product?.price || 0),
            })
            .eq("cart_id", cart.id)
            .eq("product_id", request.product_id);
        }

        console.log("✅ Quantity updated");
        break;
      }

      case "apply_coupon": {
        if (!request.coupon_code) {
          throw new Error("coupon_code is required");
        }

        // Buscar cupom
        const { data: coupon } = await supabase
          .from("coupons")
          .select("*")
          .eq("code", request.coupon_code)
          .eq("status", "active")
          .eq("user_id", request.user_id)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (!coupon) {
          return new Response(
            JSON.stringify({ error: "Cupom inválido ou expirado" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        // Calcular desconto
        const subtotal = parseFloat(cart.subtotal || "0");
        let discountAmount = 0;

        if (coupon.discount_type === "percentage") {
          discountAmount = (subtotal * coupon.discount_value) / 100;
        } else {
          discountAmount = coupon.discount_value;
        }

        // Aplicar ao carrinho
        await supabase
          .from("shopping_carts")
          .update({
            coupon_id: coupon.id,
            coupon_discount: discountAmount,
          })
          .eq("id", cart.id);

        console.log("✅ Coupon applied:", discountAmount);
        break;
      }

      case "clear_cart": {
        await supabase.from("cart_items").delete().eq("cart_id", cart.id);

        await supabase
          .from("shopping_carts")
          .update({
            status: "abandoned",
          })
          .eq("id", cart.id);

        console.log("✅ Cart cleared");
        break;
      }
    }

    // Recalcular totais
    const { data: items } = await supabase
      .from("cart_items")
      .select("subtotal")
      .eq("cart_id", cart.id);

    const subtotal =
      items?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0) || 0;

    const couponDiscount = parseFloat(cart.coupon_discount || "0");
    const shippingCost = parseFloat(cart.shipping_cost || "0");
    const total = subtotal - couponDiscount + shippingCost;

    await supabase
      .from("shopping_carts")
      .update({
        subtotal,
        total,
      })
      .eq("id", cart.id);

    // Retornar carrinho atualizado
    const { data: updatedCart } = await supabase
      .from("shopping_carts")
      .select(
        `
        *,
        cart_items (
          *,
          product:products (name, short_description, price),
          variant:product_variants (name)
        )
      `
      )
      .eq("id", cart.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        cart: updatedCart,
        totals: {
          subtotal,
          discount: couponDiscount,
          shipping: shippingCost,
          total,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Cart error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
