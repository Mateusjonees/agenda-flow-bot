import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

// Meta Pixel ID
const META_PIXEL_ID = "802636102825782";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

/**
 * Inicializa o Meta Pixel seguindo a documentação oficial
 * https://developers.facebook.com/docs/meta-pixel/get-started
 */
const initMetaPixel = () => {
  // Evita inicialização duplicada
  if (window.fbq && typeof window.fbq === 'function') {
    console.log('[Meta Pixel] Already initialized');
    return;
  }
  
  console.log('[Meta Pixel] Initializing with ID:', META_PIXEL_ID);
  
  // Código base do Meta Pixel (conforme documentação oficial)
  const n: any = (window.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  });
  
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  
  // Carrega o script do Meta Pixel
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  
  script.onload = () => {
    console.log('[Meta Pixel] Script loaded successfully');
  };
  
  script.onerror = () => {
    console.error('[Meta Pixel] Failed to load script');
  };
  
  const firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode?.insertBefore(script, firstScript);
  
  // Inicializa o pixel e dispara o primeiro PageView
  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
  
  console.log('[Meta Pixel] Initialized and PageView tracked');
  
  // Adiciona o noscript fallback para rastreamento sem JavaScript
  addNoscriptFallback();
};

/**
 * Adiciona o fallback noscript conforme documentação do Meta
 */
const addNoscriptFallback = () => {
  // Verifica se já existe
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

/**
 * Hook para rastrear mudanças de página em SPAs
 */
const usePageViewTracking = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Só rastreia se o pixel estiver disponível e o usuário tiver aceito cookies
    if (typeof window.fbq === 'function' && localStorage.getItem("cookie_consent") === "accepted") {
      window.fbq("track", "PageView");
      console.log('[Meta Pixel] PageView tracked for:', location.pathname);
    }
  }, [location.pathname]);
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  
  // Rastreia mudanças de página
  usePageViewTracking();

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    
    if (consent === "accepted") {
      // Usuário já aceitou - inicializa o pixel
      initMetaPixel();
    } else if (consent !== "rejected") {
      // Ainda não decidiu - mostra o banner
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShowBanner(false);
    initMetaPixel();
    
    // Dispara evento de Lead quando o usuário aceita cookies
    if (typeof window.fbq === 'function') {
      setTimeout(() => {
        window.fbq('track', 'Lead', {
          content_name: 'cookie_consent',
          content_category: 'engagement'
        });
        console.log('[Meta Pixel] Lead tracked for cookie consent');
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
          <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Utilizamos cookies para melhorar sua experiência e analisar o tráfego do site. 
            Ao clicar em "Aceitar", você concorda com o uso de cookies de análise.{" "}
            <a href="/politica-privacidade" className="text-primary underline hover:no-underline">
              Política de Privacidade
            </a>
          </p>
        </div>
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
}

/**
 * Exporta o ID do pixel para uso em outros componentes
 */
export const PIXEL_ID = META_PIXEL_ID;
