import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface EmailLogEntry {
  user_id: string;
  email_type: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  status: "sent" | "delivered" | "bounced" | "failed";
  resend_email_id?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

export async function logEmailSent(entry: EmailLogEntry): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.warn("⚠️ Supabase credentials not configured for email logging");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from("email_logs").insert({
      user_id: entry.user_id,
      email_type: entry.email_type,
      recipient_email: entry.recipient_email,
      recipient_name: entry.recipient_name || null,
      subject: entry.subject,
      status: entry.status,
      resend_email_id: entry.resend_email_id || null,
      error_message: entry.error_message || null,
      metadata: entry.metadata || {},
    });

    if (error) {
      console.error("❌ Failed to log email:", error.message);
    } else {
      console.log(`📧 Email logged: ${entry.email_type} -> ${entry.recipient_email}`);
    }
  } catch (err) {
    console.error("❌ Error logging email:", err);
  }
}
