

## Solucao para Atingir Performance 90+ no Mobile

### Diagnostico dos Problemas Raiz

A pagina `/auth?mode=signup` esta demorando porque:

| Problema | Impacto | Bloqueio |
|----------|---------|----------|
| `MaintenanceGuard` importa Supabase estaticamente | CRITICO | Bloqueia render inicial - faz query ANTES de mostrar qualquer coisa |
| `react-icons/fa` (FaGoogle) | ALTO | Biblioteca react-icons pesa ~30KB para 1 icone |
| `AuthTracker` importa `fbPixel` estaticamente | MEDIO | Carrega no bundle principal |
| Componentes shadcn (Button, Card, Input) usam CVA | MEDIO | CVA (~8KB) no bundle critico |

---

## Estrategia: "Skeleton-First Rendering"

A ideia e mostrar a UI IMEDIATAMENTE e carregar o Supabase em background. O usuario ve o formulario, mas o botao fica desabilitado ate o Supabase estar pronto.

### Fase 1: MaintenanceGuard Assíncrono (PRIORIDADE MAXIMA)

O MaintenanceGuard atual BLOQUEIA tudo ate consultar o banco. Vamos mudar para "assumir que NAO esta em manutencao" e verificar em background.

```text
ANTES:
- Import estatico do Supabase
- Query ANTES de renderizar children
- Loading state bloqueia tudo

DEPOIS:
- Import dinamico do Supabase
- Renderiza children IMEDIATAMENTE
- Verifica manutencao em background (2s delay)
- Se estiver em manutencao, troca para pagina de manutencao
```

### Fase 2: Substituir FaGoogle por SVG Inline

O icone do Google e simples e pode ser substituido por SVG inline.

```tsx
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
```

### Fase 3: AuthTracker com Import Totalmente Dinamico

O AuthTracker importa `fbPixel` estaticamente. Vamos mudar para import totalmente dinamico.

```text
ANTES:
import { fbPixel } from "@/hooks/useFacebookPixel";

DEPOIS:
// Sem import estatico - tudo dinamico dentro do useEffect
```

### Fase 4: Inline CSS Critico no index.html

Adicionar estilos criticos para a pagina de Auth diretamente no HTML para que o layout apareca antes do CSS carregar.

```html
<style>
  .auth-card { /* estilos inline criticos */ }
  .auth-input { /* estilos inline criticos */ }
</style>
```

---

## Arquivos a Modificar

| Arquivo | Acao | Prioridade |
|---------|------|------------|
| `src/components/MaintenanceGuard.tsx` | Import dinamico, render children primeiro | CRITICO |
| `src/pages/Auth.tsx` | Trocar FaGoogle por SVG inline | ALTA |
| `src/components/AuthTracker.tsx` | Remover import estatico de fbPixel | ALTA |
| `index.html` | Adicionar CSS inline para Auth | MEDIA |
| `src/App.tsx` | Atualizar CACHE_VERSION | BAIXA |

---

## Detalhes Tecnicos

### MaintenanceGuard.tsx (Nova Versao)

```tsx
import { ReactNode, useEffect, useState } from "react";

interface MaintenanceGuardProps {
  children: ReactNode;
}

export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const [MaintenancePage, setMaintenancePage] = useState<React.ComponentType<any> | null>(null);
  const [maintenanceData, setMaintenanceData] = useState<{ message: string; estimatedReturn: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const checkMaintenance = async () => {
        try {
          const { data } = await supabase
            .from("business_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (data && (data as any).is_maintenance_mode) {
            const Maintenance = (await import("@/pages/Maintenance")).default;
            setMaintenancePage(() => Maintenance);
            setMaintenanceData({
              message: (data as any).maintenance_message || "",
              estimatedReturn: (data as any).maintenance_estimated_return || ""
            });
          }
        } catch (error) {
          console.error("Erro ao verificar manutencao:", error);
        }
      };

      checkMaintenance();

      const channel = supabase
        .channel('maintenance-settings-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'business_settings' }, checkMaintenance)
        .subscribe();

      return () => supabase.removeChannel(channel);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (MaintenancePage && maintenanceData) {
    return <MaintenancePage message={maintenanceData.message} estimatedReturn={maintenanceData.estimatedReturn} showNotificationSignup />;
  }

  return <>{children}</>;
};
```

### Auth.tsx (Trocar FaGoogle)

```tsx
// REMOVER:
import { FaGoogle } from "react-icons/fa";

// ADICIONAR:
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Usar: <GoogleIcon /> em vez de <FaGoogle />
```

### AuthTracker.tsx (Sem Import Estatico)

```tsx
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
```

---

## Impacto Esperado

| Metrica | Atual | Apos Otimizacao |
|---------|-------|-----------------|
| FCP Mobile | 3.3s | ~1.5s |
| LCP Mobile | 7.2s | ~2.5s |
| Speed Index | 4.7s | ~2.5s |
| Performance Score | 70 | 88-92 |

---

## Por que vai funcionar

1. **MaintenanceGuard** atual faz QUERY BLOQUEANTE antes de renderizar - isso adiciona ~2-3s ao LCP
2. **react-icons** carrega ~30KB para 1 icone - SVG inline e ~500 bytes
3. **fbPixel** importado estaticamente adiciona peso ao bundle inicial
4. O pattern "render first, load data later" e o padrao usado por sites de alta performance

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Manutencao nao detectada imediatamente | Usuario vera a pagina por 2s antes de ser redirecionado (aceitavel) |
| Icone Google diferente | SVG oficial do Google, cores exatas |
| Tracking falhar | fbPixel so dispara apos 2.5s de qualquer forma |

