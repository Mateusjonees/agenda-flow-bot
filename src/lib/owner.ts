import { supabase } from "@/integrations/supabase/client";

let cached: { userId: string; ownerId: string } | null = null;

/**
 * Retorna o user_id do dono (owner) da equipe.
 * - Se o usuário logado for o dono, retorna o próprio id
 * - Se for colaborador, retorna o created_by (dono)
 */
export async function getOwnerUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  if (cached?.userId === user.id) {
    return cached.ownerId;
  }

  const { data, error } = await supabase.rpc("get_owner_user_id", {
    _user_id: user.id,
  });

  const ownerId = !error && data ? (data as string) : user.id;
  cached = { userId: user.id, ownerId };

  return ownerId;
}
