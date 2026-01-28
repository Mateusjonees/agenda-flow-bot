
## Plano de Otimização de Performance Mobile (64 → 80+)

### Objetivo
Melhorar a nota de performance mobile (Lighthouse) de 64 para 80+ pontos, **sem mexer na configuração de build** do Vite que causa problemas na Vercel.

---

## O que NÃO vou mexer (para não derrubar o site)
- **vite.config.ts** - Não vou alterar nada do build/chunking
- **Estrutura de rotas** - Permanece igual
- **Dependências** - Nenhuma instalação ou remoção

---

## Otimizações Seguras (apenas CSS, HTML e componentes leves)

### 1. Reduzir JavaScript no Carregamento Inicial

**Arquivo: `src/pages/Landing.tsx`**
- Remover `useFacebookPixel` do carregamento imediato (tracking pode ser deferido)
- Adiar verificação de autenticação (`supabase.auth.getSession`) para depois do LCP
- Remover animações CSS complexas do Hero (já temos desabilitadas no mobile, mas ainda processam)

### 2. Otimizar o Hero Section (Above the Fold)

**Arquivo: `src/pages/Landing.tsx`**
- Simplificar os `guaranteeBadges` - usar texto estático em vez de renderização dinâmica com `.map()`
- Remover uso de ícones Lucide no Hero mobile (muito peso de JS para ícones SVG)
- Usar CSS puro para o badge "Sistema de Gestão Completo"

### 3. Otimizar Imagens e Recursos

**Arquivo: `index.html`**
- Adicionar `fetchpriority="high"` no preload crítico
- Remover preconnect de recursos não utilizados no LCP (youtube, unsplash)
- Adicionar `media` query nos preconnects para priorizar mobile

**Arquivo: `src/components/PublicNavbar.tsx`**
- Usar `loading="eager"` apenas para logo visível, `loading="lazy"` para logo dark mode
- Otimizar tamanho da imagem do logo (64x64 pode ser menor)

### 4. Reduzir CSS Crítico

**Arquivo: `src/index.css`**
- Mover mais estilos de animação para serem carregados depois
- Simplificar gradientes no mobile
- Reduzir quantidade de keyframes definidos

### 5. Otimizar Componentes Below-the-fold

**Arquivo: `src/components/landing/VideoSection.tsx`**
- Remover import de ícone `Play` do lucide - usar SVG inline simples
- Reduzir peso do componente

**Arquivo: `src/components/landing/TestimonialsSection.tsx`**
- Reduzir quantidade de testimonials iniciais no mobile (4 em vez de 6)
- Usar `content-visibility: auto` para economizar renderização

**Arquivo: `src/components/landing/ProductShowcase.tsx`**
- Simplificar mockups no mobile
- Usar placeholder estático em vez de animações

### 6. Adiar Scripts Externos

**Arquivo: `index.html`**
- Mover script do Mercado Pago para carregar apenas quando necessário
- Usar `data-*` attributes para lazy loading de scripts de terceiros

---

## Resumo de Arquivos a Alterar

1. `index.html` - Otimizar preloads e defer de scripts
2. `src/pages/Landing.tsx` - Simplificar Hero, adiar tracking
3. `src/components/landing/VideoSection.tsx` - SVG inline em vez de lucide
4. `src/components/landing/TestimonialsSection.tsx` - Menos itens no mobile
5. `src/index.css` - Remover animações não usadas do bundle crítico

---

## Impacto Esperado

| Métrica | Antes | Depois (estimado) |
|---------|-------|-------------------|
| Performance | 64 | 75-85 |
| FCP | ~2.5s | ~1.8s |
| LCP | ~4.0s | ~2.8s |
| TBT | alto | -40% |

---

## Detalhes Técnicos

### Landing.tsx - Mudanças
```tsx
// ANTES: Tracking no mount
useEffect(() => {
  trackViewContent(...);
  checkAuth();
}, []);

// DEPOIS: Tracking adiado
useEffect(() => {
  // Defer non-critical auth check
  const timer = setTimeout(() => {
    checkAuth();
    trackViewContent(...);
  }, 1000);
  return () => clearTimeout(timer);
}, []);
```

### index.html - Mudanças
```html
<!-- ANTES -->
<script src="https://www.mercadopago.com/v2/security.js" async defer></script>

<!-- DEPOIS: Só carrega quando necessário -->
<!-- Removido do index.html, será carregado dinamicamente nas páginas de pagamento -->
```

### VideoSection.tsx - Mudanças
```tsx
// ANTES: Import do lucide
import { Play } from "lucide-react";

// DEPOIS: SVG inline leve
const PlayIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);
```

---

## Risco: Muito Baixo
- Nenhuma alteração no build
- Nenhuma alteração em dependências
- Alterações são 100% retrocompatíveis
- Se algo der errado, é fácil reverter

---

## Próximos Passos
1. Aprovar este plano
2. Implementar as mudanças
3. Fazer deploy na Vercel
4. Testar com Lighthouse no PageSpeed Insights
