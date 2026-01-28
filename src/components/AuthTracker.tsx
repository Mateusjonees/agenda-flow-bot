import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fbPixel } from "@/hooks/useFacebookPixel";

/**
 * AuthTracker - Global component that listens for auth state changes
 * and tracks authentication events to Meta Pixel.
 * 
 * Events tracked:
 * - CompleteRegistration: When a new OAuth user signs up
 * - StartTrial: When a new user starts their trial
 * - Login: Every successful login (OAuth or email)
 */
export const AuthTracker = () => {
  const hasTrackedNewUser = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthTracker] Auth event:", event, session?.user?.id);

        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          const provider = user.app_metadata?.provider || 'email';
          const isOAuth = provider !== 'email';
          
          // Check if this is a new user (created within the last 60 seconds)
          const createdAt = new Date(user.created_at).getTime();
          const isNewUser = Date.now() - createdAt < 60000;
          
          // Prevent duplicate tracking for the same user in the same session
          const trackingKey = `${user.id}-${isNewUser ? 'new' : 'existing'}`;
          if (hasTrackedNewUser.current === trackingKey) {
            console.log("[AuthTracker] Already tracked this user, skipping");
            return;
          }
          
          hasTrackedNewUser.current = trackingKey;

          // Track new OAuth user registration
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

          // Track login event for all users
          console.log("[AuthTracker] Tracking Login event");
          fbPixel.trackCustom('Login', { 
            method: provider,
            is_new_user: isNewUser
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
};
