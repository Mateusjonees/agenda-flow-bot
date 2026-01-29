import { useEffect, useRef } from "react";
import { fbPixel } from "@/hooks/useFacebookPixel";

export const AuthTracker = () => {
  const hasTrackedNewUser = useRef<string | null>(null);
  const supabaseRef = useRef<typeof import("@/integrations/supabase/client").supabase | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    
    const timer = setTimeout(async () => {
      const mod = await import("@/integrations/supabase/client");
      supabaseRef.current = mod.supabase;
      
      const { data } = mod.supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("[AuthTracker] Auth event:", event, session?.user?.id);

          if (event === 'SIGNED_IN' && session?.user) {
            const user = session.user;
            const provider = user.app_metadata?.provider || 'email';
            const isOAuth = provider !== 'email';
            
            const createdAt = new Date(user.created_at).getTime();
            const isNewUser = Date.now() - createdAt < 60000;
            
            const trackingKey = `${user.id}-${isNewUser ? 'new' : 'existing'}`;
            if (hasTrackedNewUser.current === trackingKey) {
              console.log("[AuthTracker] Already tracked this user, skipping");
              return;
            }
            
            hasTrackedNewUser.current = trackingKey;

            if (isOAuth && isNewUser) {
              console.log("[AuthTracker] New OAuth user detected, tracking CompleteRegistration");
              
              fbPixel.track('CompleteRegistration', { 
                content_name: provider,
                status: 'completed'
              });
              
              fbPixel.track('StartTrial', { 
                value: 0, 
                currency: 'BRL',
                content_name: 'trial_7_days'
              });
            }

            console.log("[AuthTracker] Tracking Login event");
            fbPixel.trackCustom('Login', { 
              method: provider,
              is_new_user: isNewUser
            });
          }
        }
      );
      subscription = data.subscription;
    }, 2500);

    return () => {
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, []);

  return null;
};
