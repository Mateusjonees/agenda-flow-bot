
## Plano Definitivo: Performance 90+ no Mobile

### Diagnostico REAL do Problema

O LCP de 7.1s acontece porque o **App.tsx importa estaticamente** varios componentes que, por sua vez, importam bibliotecas pesadas. Isso cria uma **cadeia de imports bloqueantes**:

```text
App.tsx
  ├── PasswordResetGuard.tsx (BLOQUEIA)
  │     ├── supabase/client.ts (~50KB)
  │     ├── lucide-react (Loader2, Lock) (~15KB)
  │     └── Dialog.tsx
  │           └── lucide-react (X) (+5KB)
  │           └── @radix-ui/react-dialog (~20KB)
  ├── Toaster (toaster.tsx)
  │     └── toast.tsx
  │           ├── lucide-react (X)
  │           └── class-variance-authority (~8KB)
  ├── Button.tsx
  │     ├── class-variance-authority (~8KB)
  │     └── @radix-ui/react-slot (~3KB)
  └── TooltipProvider
        └── @radix-ui/react-tooltip (~12KB)
```

**Total bloqueante: ~120KB+ de JavaScript que precisa ser parseado ANTES de pintar qualquer pixel!**

---

## Estrategia: "Zero Blocking Imports"

Vamos eliminar TODOS os imports bloqueantes do critical path usando:

1. **Lazy load do PasswordResetGuard inteiro**
2. **Substituir lucide-react por SVGs inline nos componentes UI**
3. **Lazy load do sistema de Toasts**
4. **Defer TooltipProvider para depois do mount**

---

## Fase 1: PasswordResetGuard Lazy (PRIORIDADE MAXIMA)

O PasswordResetGuard faz import estatico do Supabase e so e usado em casos de recovery. Vamos tornar ele 100% dinamico.

**Mudanca no App.tsx:**

```tsx
const PasswordResetGuard = lazy(() => import("./components/PasswordResetGuard"));
```

E na rota:
```tsx
<Suspense fallback={null}>
  <PasswordResetGuard>
    <MaintenanceGuard>
      ...
    </MaintenanceGuard>
  </PasswordResetGuard>
</Suspense>
```

---

## Fase 2: Remover lucide-react dos Componentes UI Criticos

Os componentes `dialog.tsx` e `toast.tsx` usam o icone `X` do lucide. Vamos substituir por SVG inline.

**dialog.tsx (linha 3 e 46):**
```tsx
const XIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

// Usar: <XIcon /> em vez de <X className="h-4 w-4" />
```

**toast.tsx (linha 4 e 76):**
Mesma substituicao.

---

## Fase 3: Lazy Load dos Toasters

Os Toasters (Toaster e Sonner) sao necessarios apenas quando ha notificacoes. Vamos carregar lazy.

**App.tsx:**
```tsx
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));

// No render:
<Suspense fallback={null}>
  <Toaster />
  <Sonner />
</Suspense>
```

---

## Fase 4: Defer TooltipProvider

O TooltipProvider nao e necessario no primeiro render. Podemos adiar.

**App.tsx:**
```tsx
const [tooltipReady, setTooltipReady] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setTooltipReady(true), 1000);
  return () => clearTimeout(timer);
}, []);

// No render:
{tooltipReady ? (
  <TooltipProvider>
    ...routes...
  </TooltipProvider>
) : (
  <div>...routes sem tooltip...</div>
)}
```

Alternativamente, podemos simplesmente lazy load do TooltipProvider.

---

## Fase 5: Otimizar PasswordResetGuard Interno

Se a Fase 1 nao for suficiente, tambem refatoramos o PasswordResetGuard para usar imports dinamicos internamente (como fizemos com MaintenanceGuard).

**PasswordResetGuard.tsx:**
```tsx
export const PasswordResetGuard = ({ children }: PasswordResetGuardProps) => {
  const [needsReset, setNeedsReset] = useState(false);
  const [DialogComponent, setDialogComponent] = useState(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.recovery_sent_at) {
        const { Dialog, DialogContent } = await import("@/components/ui/dialog");
        setDialogComponent({ Dialog, DialogContent });
        setNeedsReset(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Renderiza children IMEDIATAMENTE
  return (
    <>
      {needsReset && DialogComponent && <ResetPasswordModal />}
      {children}
    </>
  );
};
```

---

## Arquivos a Modificar

| Arquivo | Acao | Impacto |
|---------|------|---------|
| `src/App.tsx` | Lazy load PasswordResetGuard, Toasters | CRITICO |
| `src/components/PasswordResetGuard.tsx` | Imports dinamicos, SVGs inline | CRITICO |
| `src/components/ui/dialog.tsx` | Trocar X do lucide por SVG | ALTO |
| `src/components/ui/toast.tsx` | Trocar X do lucide por SVG | ALTO |
| `src/components/ui/button.tsx` | Considerar remover Slot (opcional) | MEDIO |

---

## Detalhes Tecnicos

### App.tsx (Nova Versao Otimizada)

```tsx
import React, { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

const CACHE_VERSION = "v2.3.0-zero-blocking";

// Componentes lazy - NAO bloqueiam o render inicial
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const PasswordResetGuard = lazy(() => import("./components/PasswordResetGuard").then(m => ({ default: m.PasswordResetGuard })));
const CookieConsent = lazy(() => import("./components/CookieConsent").then(m => ({ default: m.CookieConsent })));
const PWAUpdatePrompt = lazy(() => import("./components/PWAUpdatePrompt").then(m => ({ default: m.PWAUpdatePrompt })));
const AuthTracker = lazy(() => import("./components/AuthTracker").then(m => ({ default: m.AuthTracker })));

// Componentes de erro/offline sao leves, podem ficar estaticos
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MaintenanceGuard } from "./components/MaintenanceGuard";

// Pages lazy
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
// ... resto das pages
```

### dialog.tsx (Sem lucide-react)

```tsx
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const XIcon = () => (
  <svg className="h-5 w-5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

// ... resto do codigo, usando <XIcon /> em vez de <X />
```

### toast.tsx (Sem lucide-react)

```tsx
// Mesma abordagem - SVG inline para o X
const XIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);
```

### PasswordResetGuard.tsx (Imports Dinamicos)

```tsx
import { useState, useEffect, ReactNode } from "react";

interface PasswordResetGuardProps {
  children: ReactNode;
}

const LoaderIcon = () => (
  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export const PasswordResetGuard = ({ children }: PasswordResetGuardProps) => {
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [supabaseClient, setSupabaseClient] = useState<any>(null);
  const [UIComponents, setUIComponents] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      setSupabaseClient(supabase);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.recovery_sent_at) {
        const [dialogModule, buttonModule, inputModule, labelModule] = await Promise.all([
          import("@/components/ui/dialog"),
          import("@/components/ui/button"),
          import("@/components/ui/input"),
          import("@/components/ui/label")
        ]);
        
        setUIComponents({
          Dialog: dialogModule.Dialog,
          DialogContent: dialogModule.DialogContent,
          Button: buttonModule.Button,
          Input: inputModule.Input,
          Label: labelModule.Label
        });
        setNeedsPasswordReset(true);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setNeedsPasswordReset(true);
        }
      });

      return () => subscription.unsubscribe();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient) return;
    // ... logica de reset (mesma de antes)
  };

  // Renderiza children IMEDIATAMENTE
  // Modal so aparece quando necessario E componentes carregados
  return (
    <>
      {needsPasswordReset && UIComponents && (
        <UIComponents.Dialog open={needsPasswordReset} onOpenChange={() => {}}>
          <UIComponents.DialogContent>
            {/* Formulario de reset */}
          </UIComponents.DialogContent>
        </UIComponents.Dialog>
      )}
      {children}
    </>
  );
};

export default PasswordResetGuard;
```

---

## Impacto Esperado

| Metrica | Atual | Apos Otimizacao |
|---------|-------|-----------------|
| FCP Mobile | 3.2s | ~1.2s |
| LCP Mobile | 7.1s | ~2.0s |
| Speed Index | 3.6s | ~1.8s |
| Performance Score | ~70 | 90-95 |
| Bundle Inicial | ~200KB | ~60KB |

---

## Por que VAI funcionar desta vez

1. **PasswordResetGuard** era import ESTATICO que puxava Supabase + Lucide + Dialog - agora e lazy
2. **Toasters** eram imports estaticos - agora sao lazy
3. **Lucide-react** estava em 4 componentes UI criticos - agora e SVG inline
4. **TooltipProvider** ainda e estatico mas Radix tooltip e relativamente leve
5. O pattern e o MESMO usado por Next.js, Remix e sites de alta performance

---

## Ordem de Implementacao

1. Substituir X do lucide por SVG em `dialog.tsx` e `toast.tsx`
2. Lazy load do PasswordResetGuard no App.tsx
3. Lazy load dos Toasters no App.tsx
4. Refatorar PasswordResetGuard para imports dinamicos
5. Lazy load de CookieConsent, PWAUpdatePrompt, AuthTracker
6. Atualizar CACHE_VERSION
7. Testar no PageSpeed Insights

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Toasts nao aparecem | Fallback null, toast aparece apos carregamento (~100ms) |
| Modal de reset demora | Delay de 500ms e aceitavel para caso raro de recovery |
| SVGs diferentes | Usando paths exatos do Lucide, visual identico |
| ErrorBoundary nao pega lazy | ErrorBoundary continua estatico, e leve |
