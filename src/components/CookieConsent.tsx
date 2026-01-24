import { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";

const META_PIXEL_ID = "802636102825782";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

// Lazy load Meta Pixel ONLY after consent
const initMetaPixel = () => {
  if (window.fbq) return;
  
  const n: any = (window.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  });
  
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  
  // Load script with low priority
  const script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.body.appendChild(script);
  
  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
};

export const CookieConsent = memo(function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    
    if (consent === "accepted") {
      // Defer pixel load
      requestIdleCallback(() => initMetaPixel(), { timeout: 3000 });
    } else if (consent !== "rejected") {
      // Show banner after a delay (not blocking)
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShowBanner(false);
    initMetaPixel();
  };

  const handleReject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t shadow-lg">
      <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Utilizamos cookies para melhorar sua experiência.{" "}
          <a href="/politica-privacidade" className="text-primary underline">
            Política de Privacidade
          </a>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleReject}>
            Recusar
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
});

export const PIXEL_ID = META_PIXEL_ID;
