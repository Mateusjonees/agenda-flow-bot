import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const META_PIXEL_ID = "802636102825782";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

const CookieIcon = () => (
  <svg className="h-5 w-5 text-primary mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
    <path d="M8.5 8.5v.01"/>
    <path d="M16 15.5v.01"/>
    <path d="M12 12v.01"/>
    <path d="M11 17v.01"/>
    <path d="M7 14v.01"/>
  </svg>
);

const initMetaPixel = () => {
  if (window.fbq && typeof window.fbq === 'function') return;
  
  const n: any = (window.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  });
  
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode?.insertBefore(script, firstScript);
  
  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
  
  addNoscriptFallback();
};

const addNoscriptFallback = () => {
  if (document.getElementById('meta-pixel-noscript')) return;
  
  const noscript = document.createElement('noscript');
  noscript.id = 'meta-pixel-noscript';
  
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`;
  img.alt = '';
  
  noscript.appendChild(img);
  document.body.appendChild(noscript);
};

const usePageViewTracking = () => {
  const location = useLocation();
  
  useEffect(() => {
    if (typeof window.fbq === 'function' && localStorage.getItem("cookie_consent") === "accepted") {
      window.fbq("track", "PageView");
    }
  }, [location.pathname]);
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  
  usePageViewTracking();

  useEffect(() => {
    const timer = setTimeout(() => {
      const consent = localStorage.getItem("cookie_consent");
      
      if (consent === "accepted") {
        initMetaPixel();
      } else if (consent !== "rejected") {
        setShowBanner(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShowBanner(false);
    initMetaPixel();
    
    if (typeof window.fbq === 'function') {
      setTimeout(() => {
        window.fbq('track', 'Lead', { content_name: 'cookie_consent', content_category: 'engagement' });
      }, 500);
    }
  };

  const handleReject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
      <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <CookieIcon />
          <p className="text-sm text-muted-foreground">
            Utilizamos cookies para melhorar sua experiência e analisar o tráfego do site. 
            Ao clicar em "Aceitar", você concorda com o uso de cookies de análise.{" "}
            <a href="/politica-privacidade" className="text-primary underline hover:no-underline">
              Política de Privacidade
            </a>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleReject}>Recusar</Button>
          <Button size="sm" onClick={handleAccept}>Aceitar</Button>
        </div>
      </div>
    </div>
  );
}

export const PIXEL_ID = META_PIXEL_ID;