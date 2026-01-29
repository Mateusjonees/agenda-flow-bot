
## Plano de Otimizacao Extrema Mobile (72 → 90+)

### Diagnostico do PageSpeed (29/01/2026)

| Metrica | Valor Atual | Meta |
|---------|-------------|------|
| Performance | 72 | 90+ |
| FCP (First Contentful Paint) | 3.2s | <2.0s |
| LCP (Largest Contentful Paint) | 5.6s | <2.5s |
| Speed Index | 3.9s | <3.0s |

### Problemas Identificados no Relatorio

1. **Render-blocking resources** - Economia estimada de 300ms
2. **JavaScript nao usado** - Economia estimada de 250 KiB
3. **Imagens nao otimizadas** - Economia estimada de 210 KiB
4. **Cache ineficiente** - Economia estimada de 30 KiB
5. **lucide-react ainda no critical path** - PublicNavbar e ThemeToggle

---

## Estrategia de Otimizacao (Segura para Vercel)

### Fase 1: Eliminar lucide-react do Critical Path

**PublicNavbar.tsx** - Ainda usa `ArrowRight, Menu, X` do lucide-react

```text
ANTES: import { ArrowRight, Menu, X } from "lucide-react";
DEPOIS: SVGs inline (zero bundle weight)
```

**ThemeToggle.tsx** - Usa `Moon, Sun` do lucide-react

```text
ANTES: import { Moon, Sun } from "lucide-react";
DEPOIS: SVGs inline
```

### Fase 2: Otimizacao de Imagens

**Problema**: Imagem do logo no PublicNavbar esta carregando duas versoes
- `/lovable-uploads/80412b3c-5edc-43b9-ab6d-a607dcdc2156.png` (modo claro)
- `@/assets/logo.png` (modo escuro)

**Solucao**: Usar uma unica imagem com CSS filter para inversao, eliminando um request HTTP

### Fase 3: Lazy Loading Agressivo do Supabase

**Problema**: O cliente Supabase esta sendo importado estaticamente em varios componentes que aparecem no primeiro render (Landing, PublicNavbar)

**Solucao**: Adiar a verificacao de autenticacao para apos o primeiro paint

```text
// Landing.tsx e PublicNavbar.tsx
// Mover auth check para useEffect com delay
useEffect(() => {
  const timer = setTimeout(async () => {
    const { data } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  }, 2000); // 2s delay
  return () => clearTimeout(timer);
}, []);
```

### Fase 4: Simplificar Badge Component no Hero

O componente Badge importa `class-variance-authority` que adiciona peso ao bundle.

**Solucao**: Substituir o Badge no Hero por um `<span>` estilizado inline

### Fase 5: Preload de Fontes Critico

Adicionar preload para a fonte principal no index.html (se estiver usando Google Fonts)

---

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/PublicNavbar.tsx` | Remover lucide-react, SVGs inline |
| `src/components/ThemeToggle.tsx` | Remover lucide-react, SVGs inline |
| `src/pages/Landing.tsx` | Substituir Badge por span, otimizar auth check |
| `index.html` | Adicionar preload de recursos criticos |

---

## Detalhes Tecnicos

### PublicNavbar.tsx (novo)

```tsx
// Substituir imports lucide por SVGs inline
const MenuIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12h16M4 6h16M4 18h16"/>
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14m-7-7 7 7-7 7"/>
  </svg>
);
```

### ThemeToggle.tsx (novo)

```tsx
// SVGs inline para Sun e Moon
const SunIcon = () => (
  <svg className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" ...>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41..."/>
  </svg>
);

const MoonIcon = () => (
  <svg className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" ...>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
```

### Landing.tsx - Substituir Badge

```tsx
// ANTES
<Badge className="px-6 py-2.5...">
  <SparklesIcon />
  Sistema de Gestao Completo
</Badge>

// DEPOIS (sem import do Badge)
<span className="inline-flex items-center px-6 py-2.5 text-sm font-semibold bg-primary/10 text-primary border border-primary/30 rounded-full">
  <SparklesIcon />
  Sistema de Gestao Completo
</span>
```

---

## Impacto Esperado

| Metrica | Atual | Apos Otimizacao |
|---------|-------|-----------------|
| Performance Mobile | 72 | 88-92 |
| FCP | 3.2s | ~2.0s |
| LCP | 5.6s | ~3.0s |
| Bundle Critical | ~180KB | ~120KB |
| lucide-react no critical | Sim | Nao |

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Build falhar | Nenhuma mudanca no vite.config.ts |
| Layout quebrar | Apenas substituicoes visuais equivalentes |
| Temas nao funcionarem | Manter mesmas classes CSS |

---

## Ordem de Implementacao

1. PublicNavbar.tsx - Remover lucide-react
2. ThemeToggle.tsx - Remover lucide-react
3. Landing.tsx - Substituir Badge por span inline
4. Testar em preview antes de publicar

Todas as mudancas sao de baixo risco e nao afetam a configuracao de build ou deploy na Vercel.
