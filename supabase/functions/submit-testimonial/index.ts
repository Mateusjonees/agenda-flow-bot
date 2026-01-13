import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestimonialPayload {
  name: string;
  business_name: string;
  business_type: string;
  content: string;
  rating: number;
  highlight?: string;
  photo_url?: string;
}

// Simple spam detection
function isSpammy(content: string, name: string): boolean {
  const lowerContent = content.toLowerCase();
  const lowerName = name.toLowerCase();
  
  // Check for excessive links
  const linkCount = (content.match(/https?:\/\//gi) || []).length;
  if (linkCount > 2) return true;
  
  // Check for spam keywords
  const spamKeywords = ['casino', 'viagra', 'crypto', 'bitcoin', 'forex', 'click here', 'free money'];
  if (spamKeywords.some(kw => lowerContent.includes(kw))) return true;
  
  // Check for repeated characters (e.g., "aaaaaaaa")
  if (/(.)\1{7,}/.test(content)) return true;
  
  // Check if name looks fake (all numbers or very short)
  if (/^\d+$/.test(name) || name.length < 2) return true;
  
  return false;
}

// Validate payload
function validatePayload(payload: TestimonialPayload): { valid: boolean; error?: string } {
  if (!payload.name || payload.name.trim().length < 2) {
    return { valid: false, error: "Nome muito curto" };
  }
  
  if (!payload.business_name || payload.business_name.trim().length < 2) {
    return { valid: false, error: "Nome do negócio muito curto" };
  }
  
  if (!payload.content || payload.content.trim().length < 20) {
    return { valid: false, error: "Depoimento muito curto (mínimo 20 caracteres)" };
  }
  
  if (payload.content.length > 1500) {
    return { valid: false, error: "Depoimento muito longo (máximo 1500 caracteres)" };
  }
  
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    return { valid: false, error: "Avaliação inválida" };
  }
  
  return { valid: true };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role to bypass RLS and insert with is_approved=true
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const payload: TestimonialPayload = await req.json();
    
    // Validate
    const validation = validatePayload(payload);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check for spam
    const isSuspicious = isSpammy(payload.content, payload.name);
    
    // Insert testimonial
    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        name: payload.name.trim(),
        business_name: payload.business_name.trim(),
        business_type: payload.business_type || "Outro",
        content: payload.content.trim(),
        rating: payload.rating,
        highlight: payload.highlight?.trim() || null,
        photo_url: payload.photo_url || null,
        is_approved: !isSuspicious, // Auto-approve if not suspicious
        is_featured: false,
        is_hidden: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting testimonial:", error);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar depoimento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Testimonial submitted: ${data.id} (approved: ${!isSuspicious})`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        testimonial: data,
        message: isSuspicious 
          ? "Seu depoimento foi enviado e está em análise" 
          : "Seu depoimento foi publicado com sucesso!"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing testimonial:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
