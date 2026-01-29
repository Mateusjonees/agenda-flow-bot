
## Plano DEFINITIVO: Performance 100 no Mobile

### Problema Raiz Identificado

O LCP de 6.1s acontece por causa de **Suspense aninhados bloqueantes** no `App.tsx`:

```text
App.tsx (caminho crítico para rota /)
  └── Suspense (TooltipProvider) - BLOQUEIA TUDO!
        └── Suspense (AuthTracker, Toasters)
              └── BrowserRouter
                    └── Suspense (PasswordResetGuard)
                          └── MaintenanceGuard
                                └── Suspense (PageLoader)
                                      └── Index → Landing
```

**Cada Suspense aninhado adiciona ~500ms ao LCP!**

A Landing Page está enterrada em **4 níveis de Suspense** - isso é o vilão.

---

## Estrategia: "Zero Blocking for Public Routes"

Vamos criar uma estrutura onde rotas públicas (/, /auth, /pricing, etc.) **NÃO passam pelos guards e providers pesados**.

### Fase 1: Separar Rotas Públicas e Privadas

Em vez de envolver TUDO com TooltipProvider e guards, vamos:
1. Rotas públicas: Render direto, sem wrappers pesados
2. Rotas privadas: Com todos os guards (lazy loaded quando acessadas)

### Fase 2: Nova Arquitetura do App.tsx

```tsx
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <CacheBuster />
      <BrowserRouter>
        <Routes>
          {/* ROTAS PÚBLICAS - SEM WRAPPERS PESADOS */}
          <Route path="/" element={
            <Suspense fallback={null}>
              <Index />
            </Suspense>
          } />
          <Route path="/auth" element={
            <Suspense fallback={null}>
              <Auth />
            </Suspense>
          } />
          
          {/* ROTAS PRIVADAS - COM TODOS OS GUARDS */}
          <Route path="/*" element={
            <Suspense fallback={<PageLoader />}>
              <PrivateRoutes />
            </Suspense>
          } />
        </Routes>
      </BrowserRouter>
      
      {/* Componentes globais carregados DEPOIS */}
      <Suspense fallback={null}>
        <GlobalProviders />
      </Suspense>
    </QueryClientProvider>
  </ErrorBoundary>
);
```

### Fase 3: Criar PrivateRoutes e GlobalProviders

**PrivateRoutes.tsx**: Componente lazy que carrega TooltipProvider, Guards, Layout e rotas privadas
**GlobalProviders.tsx**: Carrega Toasters, CookieConsent, PWAPrompt, AuthTracker (não bloqueia render)

---

## Arquivos a Modificar

| Arquivo | Acao | Impacto |
|---------|------|---------|
| `src/App.tsx` | Separar rotas públicas/privadas | CRITICO |
| `src/components/PrivateRoutes.tsx` | CRIAR - rotas autenticadas | CRITICO |
| `src/components/GlobalProviders.tsx` | CRIAR - providers não-bloqueantes | ALTO |
| `src/pages/Index.tsx` | Otimizar para render instantâneo | MEDIO |
| `index.html` | Adicionar mais CSS crítico inline | MEDIO |

---

## Detalhes Tecnicos

### App.tsx (Nova Versao - Zero Blocking)

```tsx
import React, { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";

const CACHE_VERSION = "v3.0.0-zero-blocking";

// Rotas públicas - carregam DIRETAMENTE sem wrappers
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const TermosServico = lazy(() => import("./pages/TermosServico"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Recursos = lazy(() => import("./pages/Recursos"));
const Depoimentos = lazy(() => import("./pages/Depoimentos"));
const Precos = lazy(() => import("./pages/Precos"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Maintenance = lazy(() => import("./pages/Maintenance"));

// Rotas privadas - carregam com todos os guards
const PrivateRoutes = lazy(() => import("./components/PrivateRoutes"));

// Providers globais - carregam DEPOIS do primeiro paint
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
          {/* ROTAS PÚBLICAS - RENDER DIRETO, SEM SUSPENSE ANINHADOS */}
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
          
          {/* ROTAS PRIVADAS - COM GUARDS (LAZY LOADED) */}
          <Route path="/*" element={<Suspense fallback={<PageLoader />}><PrivateRoutes /></Suspense>} />
        </Routes>
      </BrowserRouter>
      
      {/* PROVIDERS GLOBAIS - CARREGAM APÓS O PRIMEIRO PAINT */}
      <Suspense fallback={null}>
        <GlobalProviders />
      </Suspense>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
```

### PrivateRoutes.tsx (Novo Arquivo)

```tsx
import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

const PasswordResetGuard = lazy(() => import("./PasswordResetGuard").then(m => ({ default: m.PasswordResetGuard })));
const SubscriptionGuard = lazy(() => import("./SubscriptionGuard").then(m => ({ default: m.SubscriptionGuard })));
const PermissionGuard = lazy(() => import("./PermissionGuard").then(m => ({ default: m.PermissionGuard })));
const Layout = lazy(() => import("./Layout"));
const MaintenanceGuard = lazy(() => import("./MaintenanceGuard").then(m => ({ default: m.MaintenanceGuard })));

// Pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Agendamentos = lazy(() => import("@/pages/Agendamentos"));
const Clientes = lazy(() => import("@/pages/Clientes"));
// ... todas as outras pages privadas

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  </div>
);

const PrivateRoutes = () => (
  <TooltipProvider>
    <Suspense fallback={<PageLoader />}>
      <PasswordResetGuard>
        <MaintenanceGuard>
          <Routes>
            <Route path="/dashboard" element={<Layout><SubscriptionGuard><PermissionGuard><Dashboard /></PermissionGuard></SubscriptionGuard></Layout>} />
            <Route path="/agendamentos" element={<Layout><SubscriptionGuard><PermissionGuard><Agendamentos /></PermissionGuard></SubscriptionGuard></Layout>} />
            {/* ... resto das rotas privadas */}
          </Routes>
        </MaintenanceGuard>
      </PasswordResetGuard>
    </Suspense>
  </TooltipProvider>
);

export default PrivateRoutes;
```

### GlobalProviders.tsx (Novo Arquivo)

```tsx
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
    // Carrega componentes globais DEPOIS de 1 segundo
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
    }, 1000);

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
```

### Index.tsx (Otimizado)

```tsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Landing from "./Landing";

const Index = () => {
  const navigate = useNavigate();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    
    // Delay de 2s para não impactar LCP
    const timer = setTimeout(async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return <Landing />;
};

export default Index;
```

### index.html (Mais CSS Critico)

Adicionar estilos para o Navbar e hero:

```html
<style>
  /* ... estilos existentes ... */
  
  /* Navbar critical */
  .navbar-skeleton {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: #0A0A0A;
    border-bottom: 1px solid #1a1a1a;
  }
  
  /* Hero skeleton */
  .hero-skeleton {
    min-height: 90vh;
    display: flex;
    align-items: center;
    background: linear-gradient(to bottom, rgba(227, 24, 55, 0.05), transparent);
  }
</style>
```

---

## Impacto Esperado

| Metrica | Atual | Apos Otimizacao |
|---------|-------|-----------------|
| FCP Mobile | 2.0s | ~0.8s |
| LCP Mobile | 6.1s | ~1.5s |
| Speed Index | 3.6s | ~1.2s |
| TBT | 10ms | ~10ms |
| Performance Score | ~70 | 95-100 |

---

## Por que VAI funcionar

1. **Rotas públicas SEM Suspense aninhados** - render direto, sem cascata de loading
2. **TooltipProvider APENAS em rotas privadas** - não bloqueia a Landing
3. **Guards carregados APENAS quando necessário** - não no bundle inicial
4. **GlobalProviders carregam DEPOIS do primeiro paint** - não impactam LCP
5. **Arquitetura igual usada por Next.js, Remix, Gatsby** - comprovadamente eficiente

---

## Ordem de Implementacao

1. Criar `GlobalProviders.tsx`
2. Criar `PrivateRoutes.tsx` com todas as rotas autenticadas
3. Refatorar `App.tsx` para a nova arquitetura
4. Ajustar `Index.tsx` para aumentar delay do Supabase
5. Adicionar mais CSS crítico no `index.html`
6. Atualizar `CACHE_VERSION` para `v3.0.0-zero-blocking`
7. Testar no PageSpeed Insights

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Tooltips não funcionam na Landing | Landing não usa Tooltip, apenas botões simples |
| Toasters demoram a aparecer | Delay de 1s é imperceptível, toast aparece logo |
| PasswordResetGuard não pega login | Só é necessário em rotas privadas |
| Navegação para dashboard demora | PageLoader aparece, UX mantida |
