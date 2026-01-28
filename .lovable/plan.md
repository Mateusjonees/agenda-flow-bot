
# Plano: Corrigir Site Que Não Carrega (Lazy Loading Quebrado)

## Problema Identificado

O site está travado no spinner de loading porque o lazy loading dos componentes `PublicNavbar` e `PublicFooter` está falhando silenciosamente.

### Causa Raiz
Os componentes `PublicNavbar` e `PublicFooter` usam **named exports** (`export function PublicNavbar()`), mas o `React.lazy()` só funciona nativamente com **default exports**.

A sintaxe atual no `Landing.tsx`:
```tsx
const PublicNavbar = lazy(() => import("@/components/PublicNavbar").then(m => ({ default: m.PublicNavbar })));
```

Essa sintaxe pode falhar silenciosamente em alguns cenários, deixando o `Suspense` eternamente em estado de loading.

---

## Solução

### Opção Escolhida: Adicionar `export default` nos componentes

Vou adicionar `export default` em `PublicNavbar` e `PublicFooter` para que o lazy loading funcione corretamente, mantendo também o named export para compatibilidade com outros arquivos que já importam assim.

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/PublicNavbar.tsx` | Adicionar `export default PublicNavbar` no final |
| `src/components/PublicFooter.tsx` | Adicionar `export default PublicFooter` no final |
| `src/pages/Landing.tsx` | Simplificar syntax do lazy loading |

---

## Detalhes Técnicos

### 1. PublicNavbar.tsx (Adicionar export default)
```tsx
// Manter o named export existente
export function PublicNavbar() {
  // ... código existente
}

// Adicionar ao final do arquivo:
export default PublicNavbar;
```

### 2. PublicFooter.tsx (Adicionar export default)
```tsx
// Manter o named export existente
export function PublicFooter() {
  // ... código existente
}

// Adicionar ao final do arquivo:
export default PublicFooter;
```

### 3. Landing.tsx (Simplificar lazy loading)
```tsx
// Antes (problemático):
const PublicNavbar = lazy(() => import("@/components/PublicNavbar").then(m => ({ default: m.PublicNavbar })));
const PublicFooter = lazy(() => import("@/components/PublicFooter").then(m => ({ default: m.PublicFooter })));

// Depois (funcional):
const PublicNavbar = lazy(() => import("@/components/PublicNavbar"));
const PublicFooter = lazy(() => import("@/components/PublicFooter"));
```

---

## Resultado Esperado

Após as correções:
- O site carregará normalmente
- O Navbar e Footer serão carregados via lazy loading (melhor performance)
- O spinner desaparecerá e o conteúdo será exibido
- As otimizações de performance anteriores continuarão funcionando
