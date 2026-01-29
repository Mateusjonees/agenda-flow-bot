import React, { useEffect, useState } from "react";

const GlobalProviders = () => {
  const [components, setComponents] = useState<{
    Toaster: React.ComponentType | null;
    Sonner: React.ComponentType | null;
    CookieConsent: React.ComponentType | null;
    PWAUpdatePrompt: React.ComponentType | null;
    AuthTracker: React.ComponentType | null;
  }>({
    Toaster: null,
    Sonner: null,
    CookieConsent: null,
    PWAUpdatePrompt: null,
    AuthTracker: null,
  });

  useEffect(() => {
    const timer = setTimeout(async () => {
      const [toaster, sonner, cookie, pwa, auth] = await Promise.all([
        import("@/components/ui/toaster").then(m => m.Toaster),
        import("@/components/ui/sonner").then(m => m.Toaster),
        import("./CookieConsent").then(m => m.CookieConsent),
        import("./PWAUpdatePrompt").then(m => m.PWAUpdatePrompt),
        import("./AuthTracker").then(m => m.AuthTracker),
      ]);
      
      setComponents({
        Toaster: toaster,
        Sonner: sonner,
        CookieConsent: cookie,
        PWAUpdatePrompt: pwa,
        AuthTracker: auth,
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {components.Toaster && <components.Toaster />}
      {components.Sonner && <components.Sonner />}
      {components.CookieConsent && <components.CookieConsent />}
      {components.PWAUpdatePrompt && <components.PWAUpdatePrompt />}
      {components.AuthTracker && <components.AuthTracker />}
    </>
  );
};

export default GlobalProviders;
