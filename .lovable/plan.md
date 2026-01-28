
# Plano: Adicionar Vídeo do YouTube e Otimizar Performance Mobile

## Parte 1: Adicionar Vídeo do YouTube

O vídeo será inserido logo após a seção Hero, antes do ProductShowcase.

### Local de Inserção
```
Hero Section
    ↓
>>> NOVO: VideoSection (YouTube embed)
    ↓
ProductShowcase
```

### Implementação do Vídeo
- Criar um novo componente `VideoSection` para o embed do YouTube
- URL do vídeo: `https://youtu.be/fyhZ0dz9Mcc`
- Usar **lazy loading** (loading="lazy") para não impactar o LCP
- Usar **lite-youtube-embed** pattern para carregar apenas quando necessário
- Aspecto responsivo (16:9)

---

## Parte 2: Otimização de Performance Mobile

### Problemas Identificados (PageSpeed Insights)
| Métrica | Atual | Meta |
|---------|-------|------|
| First Contentful Paint | 4.8s | < 1.8s |
| Largest Contentful Paint | 6.1s | < 2.5s |
| Total Blocking Time | 0ms | OK |
| Cumulative Layout Shift | 0 | OK |

### Causas Principais
1. **Framer Motion** - Carrega biblioteca pesada (+180KB) mesmo no mobile
2. **Blur/Backdrop-filter** - Pesado em dispositivos móveis
3. **Animações complexas** no Hero (blur-3xl, animate-float)
4. **Imagens de testemunhos** - Externas sem otimização

### Solucoes

#### 1. Desabilitar Animacoes Pesadas no Mobile
Modificar componentes para usar CSS puro ao invés de framer-motion em dispositivos móveis:

```tsx
// Componentes da landing usarão CSS ao invés de framer-motion no mobile
const isMobile = window.innerWidth < 768;

// Ao invés de:
<motion.div animate={...} />

// Usar:
{isMobile ? <div className="animate-fade-in" /> : <motion.div ... />}
```

#### 2. Reduzir Efeitos Visuais no Mobile (CSS)
```css
@media (max-width: 768px) {
  /* Remover blur pesado */
  .blur-3xl { filter: none; }
  .backdrop-blur-sm, .backdrop-blur { backdrop-filter: none; }
  
  /* Simplificar gradientes */
  .bg-mesh-gradient { background: hsl(var(--primary) / 0.1); }
  
  /* Desabilitar animações infinitas */
  .animate-float, .animate-float-slow { animation: none; }
}
```

#### 3. Otimizar Hero Section
- Remover `blur-3xl` dos blobs decorativos no mobile
- Simplificar `bg-mesh-gradient` para cor sólida
- Manter animações apenas no desktop

#### 4. Lazy Load Componentes Abaixo do Fold
```tsx
// Em Landing.tsx - carregar seções sob demanda
const ProductShowcase = lazy(() => import("./landing/ProductShowcase"));
const FeatureGrid = lazy(() => import("./landing/FeatureGrid"));
const HowItWorks = lazy(() => import("./landing/HowItWorks"));
// etc...
```

#### 5. Otimizar Imagens dos Testemunhos
- Adicionar `fetchpriority="low"` nas imagens
- Usar dimensões menores para mobile (w=100 ao invés de w=150)

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/landing/VideoSection.tsx` | CRIAR - Componente de vídeo YouTube otimizado |
| `src/pages/Landing.tsx` | Adicionar VideoSection + lazy loading de seções |
| `src/index.css` | Adicionar otimizações mobile para blur/animações |
| `src/components/landing/HeroMockup.tsx` | Simplificar para mobile |
| `src/components/landing/TestimonialsSection.tsx` | Otimizar imagens |
| `src/components/landing/FeatureGrid.tsx` | Usar CSS animations no mobile |
| `src/components/landing/ProductShowcase.tsx` | Usar CSS animations no mobile |
| `src/components/landing/HowItWorks.tsx` | Usar CSS animations no mobile |
| `src/components/landing/PricingSection.tsx` | Usar CSS animations no mobile |

---

## Detalhes Tecnicos

### VideoSection.tsx (Novo Componente)
```tsx
const VideoSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoId = "fyhZ0dz9Mcc"; // Extraído da URL

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border">
            {!isLoaded ? (
              <button
                onClick={() => setIsLoaded(true)}
                className="absolute inset-0 bg-muted flex items-center justify-center cursor-pointer group"
              >
                {/* Thumbnail otimizada do YouTube */}
                <img 
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt="Assistir vídeo"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Play button */}
                <div className="relative z-10 w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
              </button>
            ) : (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                title="Vídeo de demonstração"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
```

### CSS Optimizacoes Mobile (index.css)
```css
/* Otimizações de performance para mobile */
@media (max-width: 768px) {
  /* Desabilitar efeitos pesados de blur */
  .blur-3xl, .blur-2xl, .blur-xl {
    filter: blur(8px); /* Reduzir intensidade */
  }
  
  /* Remover backdrop-filter (muito pesado) */
  .glass, .glass-strong {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: hsl(var(--card) / 0.95);
  }
  
  /* Simplificar mesh gradient */
  .bg-mesh-gradient {
    background: linear-gradient(180deg, 
      hsl(var(--primary) / 0.08) 0%, 
      transparent 50%
    );
  }
  
  /* Desabilitar animações infinitas */
  .animate-float,
  .animate-float-slow,
  .animate-pulse-glow {
    animation: none;
  }
  
  /* Reduzir complexidade visual */
  .bg-grid-pattern,
  .bg-dots-pattern {
    opacity: 0.15;
  }
}
```

### Landing.tsx - Lazy Loading
```tsx
import { lazy, Suspense } from "react";

// Lazy load componentes abaixo do fold
const ProductShowcase = lazy(() => import("@/components/landing/ProductShowcase"));
const FeatureGrid = lazy(() => import("@/components/landing/FeatureGrid"));
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const PricingSection = lazy(() => import("@/components/landing/PricingSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const VideoSection = lazy(() => import("@/components/landing/VideoSection"));

// Skeleton para loading
const SectionSkeleton = () => (
  <div className="py-24 flex items-center justify-center">
    <div className="animate-pulse bg-muted rounded-lg w-full max-w-4xl h-96" />
  </div>
);

// Uso:
<Suspense fallback={<SectionSkeleton />}>
  <VideoSection />
</Suspense>
```

---

## Resultado Esperado

| Métrica | Antes | Depois (Estimado) |
|---------|-------|-------------------|
| First Contentful Paint | 4.8s | ~1.5-2.0s |
| Largest Contentful Paint | 6.1s | ~2.0-2.8s |
| Mobile Performance Score | ~45-50 | ~75-85 |

### Melhorias Principais
1. Vídeo do YouTube carregado sob demanda (não impacta LCP)
2. Blur e backdrop-filter desabilitados no mobile
3. Animações pesadas removidas no mobile
4. Seções carregadas com lazy loading
5. Imagens de testemunhos otimizadas com loading="lazy"
