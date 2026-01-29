import React, { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";

const CACHE_VERSION = "v3.1.0-static-hero";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const TermosServico = lazy(() => import("./pages/TermosServico"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Recursos = lazy(() => import("./pages/Recursos"));
const Depoimentos = lazy(() => import("./pages/Depoimentos"));
const Precos = lazy(() => import("./pages/Precos"));
const Maintenance = lazy(() => import("./pages/Maintenance"));

const PrivateRoutes = lazy(() => import("./components/PrivateRoutes"));
const GlobalProviders = lazy(() => import("./components/GlobalProviders"));

const CacheBuster = () => {
  useEffect(() => {
    const storedVersion = localStorage.getItem("app_cache_version");
    if (storedVersion !== CACHE_VERSION) {
      const cookieConsent = localStorage.getItem("cookie_consent");
      localStorage.clear();
      if (cookieConsent) localStorage.setItem("cookie_consent", cookieConsent);
      sessionStorage.clear();
      if ('caches' in window) caches.keys().then(names => names.forEach(n => caches.delete(n)));
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.update()));
      }
      localStorage.setItem("app_cache_version", CACHE_VERSION);
      window.location.reload();
    }
  }, []);
  return null;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30, refetchOnWindowFocus: false },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <CacheBuster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Suspense fallback={null}><Index /></Suspense>} />
          <Route path="/auth" element={<Suspense fallback={null}><Auth /></Suspense>} />
          <Route path="/pricing" element={<Suspense fallback={null}><Pricing /></Suspense>} />
          <Route path="/politica-privacidade" element={<Suspense fallback={null}><PoliticaPrivacidade /></Suspense>} />
          <Route path="/termos-servico" element={<Suspense fallback={null}><TermosServico /></Suspense>} />
          <Route path="/faq" element={<Suspense fallback={null}><FAQ /></Suspense>} />
          <Route path="/recursos" element={<Suspense fallback={null}><Recursos /></Suspense>} />
          <Route path="/depoimentos" element={<Suspense fallback={null}><Depoimentos /></Suspense>} />
          <Route path="/precos" element={<Suspense fallback={null}><Precos /></Suspense>} />
          <Route path="/manutencao" element={<Suspense fallback={null}><Maintenance /></Suspense>} />
          
          <Route path="/*" element={<Suspense fallback={<PageLoader />}><PrivateRoutes /></Suspense>} />
        </Routes>
        
        {/* GlobalProviders INSIDE BrowserRouter so useLocation() works */}
        <Suspense fallback={null}>
          <GlobalProviders />
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
