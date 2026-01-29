import { useEffect, useRef } from "react";

export const AuthTracker = () => {
  const hasTrackedNewUser = useRef<string | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const timer = setTimeout(async () => {
      const [{ supabase }, { fbPixel }] = await Promise.all([
        import("@/integrations/supabase/client"),
        import("@/hooks/useFacebookPixel")
      ]);

      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          const provider = user.app_metadata?.provider || 'email';
          const isNewUser = Date.now() - new Date(user.created_at).getTime() < 60000;

          const trackingKey = `${user.id}-${isNewUser ? 'new' : 'existing'}`;
          if (hasTrackedNewUser.current === trackingKey) return;
          hasTrackedNewUser.current = trackingKey;

          if (provider !== 'email' && isNewUser) {
            fbPixel.track('CompleteRegistration', { content_name: provider, status: 'completed' });
            fbPixel.track('StartTrial', { value: 0, currency: 'BRL', content_name: 'trial_7_days' });
          }

          fbPixel.trackCustom('Login', { method: provider, is_new_user: isNewUser });
        }
      });
      subscription = data.subscription;
    }, 2500);

    return () => {
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, []);

  return null;
};
