
# Plano: Otimização de Performance Agressiva para Mobile e Desktop

## Análise dos Relatórios de Performance

### GTmetrix (Desktop)
| Métrica | Atual | Meta |
|---------|-------|------|
| Performance | 54% (Nota D) | > 80% |
| LCP | 2.9s | < 2.5s |
| TBT | 855ms | < 200ms |
| Total Page Size | 1.06MB | < 800KB |
| Total Requests | 68 | < 40 |

### Lighthouse (Mobile)
| Métrica | Atual | Meta |
|---------|-------|------|
| Performance | 64 | > 85 |
| FCP | 4.8s | < 1.8s |
| LCP | 6.9s | < 2.5s |
| Speed Index | 4.8s | < 3.0s |

### Problemas Identificados
1. **JavaScript não usado**: 386 KB podem ser economizados
2. **Imagens sem width/height**: Causa layout shift e recálculos
3. **DOM excessivo**: Muitos elementos afetam renderização
4. **Framer Motion ainda em uso**: Páginas como FAQ.tsx, Recursos.tsx, Precos.tsx, Depoimentos.tsx ainda usam framer-motion (180KB+)
5. **Vite ainda agrupa framer-motion**: Configurado para criar chunk separado, mas ainda é carregado
6. **Múltiplos redirects**: Afeta tempo de carregamento inicial
7. **Imagens externas (Unsplash)**: Sem controle de cache, sem dimensões

---

## Soluções Propostas

### 1. Remover Framer Motion Completamente das Páginas Públicas
O bundle ainda inclui framer-motion (180KB+). Vamos remover de:
- `src/pages/FAQ.tsx`
- `src/pages/Recursos.tsx`
- `src/pages/Precos.tsx`
- `src/pages/Depoimentos.tsx`
- `src/components/TestimonialCard.tsx`

Substituir por animações CSS puras (já temos no index.css).

### 2. Otimizar Carregamento Inicial da Landing Page
Problema: Navbar e Footer são carregados síncronos mesmo que o Hero seja o que importa.

```tsx
// Antes: Carrega tudo de uma vez
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

// Depois: Carrega componentes não-críticos depois do primeiro paint
const PublicNavbar = lazy(() => import("@/components/PublicNavbar"));
const PublicFooter = lazy(() => import("@/components/PublicFooter"));
```

### 3. Otimizar Imagens com Width e Height Explícitos
Adicionar dimensões fixas em todas as imagens:

```tsx
// TestimonialsSection.tsx - Imagens de perfil
<img 
  src={testimonial.photo} 
  alt={testimonial.name}
  width={40}
  height={40}
  className="w-10 h-10 rounded-full object-cover"
  loading="lazy"
/>

// VideoSection.tsx - Thumbnail
<img 
  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
  width={480}
  height={360}
  alt="Thumbnail do vídeo"
  loading="lazy"
/>

// PublicNavbar.tsx e PublicFooter.tsx - Logos
<img 
  src="/lovable-uploads/80412b3c-5edc-43b9-ab6d-a607dcdc2156.png" 
  alt="Foguete"
  width={64}
  height={64}
  className="h-16 w-auto"
/>
```

### 4. Otimizar Vite Config - Remover Framer Motion do Bundle de Landing
Modificar `vite.config.ts` para code-split mais agressivo:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        // Isolar framer-motion - só carrega se necessário
        if (id.includes('framer-motion')) {
          return 'vendor-animations';
        }
        // React core
        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
          return 'vendor-react';
        }
        // Charts - só em páginas protegidas
        if (id.includes('recharts')) {
          return 'vendor-charts';
        }
        // Supabase
        if (id.includes('@supabase')) {
          return 'vendor-supabase';
        }
      }
    }
  }
}
```

### 5. Simplificar Hero Section para Mobile
Reduzir elementos decorativos que aumentam o DOM:

```tsx
// Landing.tsx - Hero Section simplificado para mobile
<section id="home" className="relative min-h-[90vh] flex items-center py-16 md:py-24 overflow-hidden">
  {/* Decorativos apenas no desktop */}
  <div className="hidden md:block absolute inset-0 bg-mesh-gradient opacity-60" />
  <div className="hidden md:block absolute inset-0 bg-grid-pattern opacity-30" />
  <div className="hidden md:block absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
  <div className="hidden md:block absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
  
  {/* Conteúdo */}
  ...
</section>
```

### 6. Lazy Load de Botão WhatsApp
O botão flutuante não precisa carregar no primeiro paint:

```tsx
// Landing.tsx
useEffect(() => {
  // Carrega o botão WhatsApp após 2 segundos
  const timer = setTimeout(() => {
    setShowWhatsApp(true);
  }, 2000);
  return () => clearTimeout(timer);
}, []);

{showWhatsApp && (
  <button className="fixed bottom-6 right-6 ...">
    <MessageCircle />
  </button>
)}
```

### 7. Preconnect para Recursos Externos
Adicionar hints no `index.html`:

```html
<head>
  <!-- Preconnect para Supabase -->
  <link rel="preconnect" href="https://pnwelorcrncqltqiyxwx.supabase.co" crossorigin />
  
  <!-- Preconnect para YouTube (thumbnail) -->
  <link rel="preconnect" href="https://img.youtube.com" />
  
  <!-- Preconnect para Unsplash (testimonials) -->
  <link rel="preconnect" href="https://images.unsplash.com" />
  
  <!-- DNS Prefetch -->
  <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
</head>
```

### 8. Otimizar CSS - Remover Classes Não Usadas no Mobile
Adicionar CSS crítico inline para FCP mais rápido:

```css
/* index.css - Adicionar critical CSS */
@layer base {
  /* Critical: apenas o necessário para primeiro paint */
  body {
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
  }
}

/* Non-critical: defer */
@media (max-width: 768px) {
  /* Esconder elementos pesados até scroll */
  .defer-mobile {
    content-visibility: auto;
    contain-intrinsic-size: auto 500px;
  }
}
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Landing.tsx` | Lazy load navbar/footer, defer decorativos mobile, lazy WhatsApp |
| `src/pages/FAQ.tsx` | Remover framer-motion, usar CSS |
| `src/pages/Recursos.tsx` | Remover framer-motion, usar CSS |
| `src/pages/Precos.tsx` | Remover framer-motion, usar CSS |
| `src/pages/Depoimentos.tsx` | Remover framer-motion, usar CSS |
| `src/components/TestimonialCard.tsx` | Remover framer-motion, usar CSS |
| `src/components/landing/TestimonialsSection.tsx` | Adicionar width/height nas imagens |
| `src/components/landing/VideoSection.tsx` | Adicionar width/height na thumbnail |
| `src/components/PublicNavbar.tsx` | Adicionar width/height nos logos |
| `src/components/PublicFooter.tsx` | Adicionar width/height nos logos |
| `index.html` | Adicionar preconnect hints |
| `vite.config.ts` | Melhorar code splitting |
| `src/index.css` | Adicionar content-visibility para mobile |

---

## Resultado Esperado

| Métrica | Antes | Depois (Estimado) |
|---------|-------|-------------------|
| FCP (Mobile) | 4.8s | ~1.5-2.0s |
| LCP (Mobile) | 6.9s | ~2.0-3.0s |
| TBT | 855ms | < 200ms |
| JS não usado | 386 KB | < 100 KB |
| Performance Score | 54-64 | 80-90 |

### Principais Ganhos
1. **-180KB+**: Remoção de framer-motion das páginas públicas
2. **-50% DOM mobile**: Elementos decorativos ocultos
3. **-0 CLS**: Imagens com dimensões explícitas
4. **Faster FCP**: Preconnect + lazy loading de não-críticos
5. **Faster LCP**: Hero inline, resto lazy
