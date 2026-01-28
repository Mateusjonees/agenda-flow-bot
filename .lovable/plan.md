
## Diagnóstico (por que quebrou na Vercel)

O erro principal que você reportou na Vercel:

- `vendor-charts-CP6X5Rtg.js:1 Uncaught ReferenceError: Cannot access 'e' before initialization`

Isso é típico de **dependência circular entre chunks ESM** (um chunk importando o outro e vice‑versa), gerada pelo `manualChunks` no `vite.config.ts`.

Eu consegui confirmar isso buscando os arquivos publicados no seu domínio:

- `vendor-charts-*.js` começa com:
  - `import { ... } from "./vendor-react-*.js"`
- e o `vendor-react-*.js` começa com:
  - `import { ... } from "./vendor-charts-*.js"`

Ou seja: **React → Charts → React**.  
Quando isso acontece, alguns bindings ficam em “temporal dead zone” e o app trava antes de montar (fica só no loader).

O outro erro `webpage_content_reporter.js: Unexpected token 'export'` não existe no seu código (não aparece em busca no repo). Quase sempre é:
- script injetado por extensão do navegador / ferramenta de auditoria, ou
- algum script externo/gerenciador que injeta assets.
Mas, mesmo que exista, o que derruba mesmo é a circularidade `vendor-react` ↔ `vendor-charts`.

---

## O que vou fazer (correção segura e rápida)

### 1) Corrigir o `vite.config.ts` para eliminar a dependência circular
A forma mais segura e rápida (para “voltar a ficar no ar”):

- **Remover o `manualChunks` customizado** (ou pelo menos remover o chunk separado de `recharts` e o chunk separado de `react`) e deixar o Rollup/Vite fazer a divisão automaticamente.
- (Opcional e recomendado) usar o plugin oficial do Vite `splitVendorChunkPlugin()` para manter algum benefício de cache sem criar ciclos.

Resultado esperado: os bundles param de se importar em círculo e o app volta a montar.

### 2) Adicionar um “fallback de recuperação” no `index.html` (para casos de cache/SW)
Como o app nem chega a montar, o `CacheBuster` do `App.tsx` não roda. Então um Service Worker/caches antigos podem manter o site preso no loader.

Vou adicionar um script pequeno no `index.html` que:
- após X segundos, se ainda estiver no loader,
- mostra um aviso e um botão “Recarregar sem cache”
- e tenta **limpar caches + desregistrar service worker** (quando possível) e recarrega.

Isso não substitui a correção do bundle, mas **evita ficar “morto”** caso algum visitante esteja preso em cache antigo.

### 3) Bump do `CACHE_VERSION` no `App.tsx`
Depois que o app voltar a montar, o `CacheBuster` vai limpar o que restar.
Vou atualizar `CACHE_VERSION` (ex: `v2.1.1-hotfix-vercel`) para forçar limpeza completa.

---

## Arquivos que serão alterados

1. `vite.config.ts`
   - Remover/ajustar `rollupOptions.output.manualChunks` (principal causa do crash)
   - (Opcional) adicionar `splitVendorChunkPlugin()` no `plugins`

2. `index.html`
   - Adicionar script de “fallback anti-loader infinito” (limpa SW/cache e recarrega)

3. `src/App.tsx`
   - Incrementar `CACHE_VERSION` para forçar limpeza após o app montar

---

## Como vamos validar (checklist objetivo)

### No domínio Vercel (https://www.sistemafoguete.com.br)
1. Abrir em aba anônima
2. Confirmar que **sai do loader** e renderiza a home
3. Abrir Console e confirmar que **sumiu**:
   - `Cannot access 'e' before initialization`
4. Testar navegação:
   - Home → /auth → (se logar) → /dashboard
5. No Network:
   - verificar que JS/CSS estão retornando 200 e sem “loops” de reload

### Extra (se ainda houver algum usuário preso)
- Abrir DevTools > Application > Service Workers:
  - “Unregister”
- Application > Storage:
  - “Clear site data”
E recarregar.

---

## Observação importante (sobre performance)
Essa correção vai priorizar **estabilidade**.  
Depois que o site estiver 100% no ar na Vercel, a gente volta a otimizar chunking com segurança (sem criar ciclos), por exemplo separando somente rotas pesadas via lazy import (que você já tem) e evitando “forçar” React em chunk manual.

---

## Próximo passo
Se você aprovar, eu aplico as mudanças acima e você só precisa fazer um novo deploy na Vercel (ou puxar a última versão do projeto, dependendo do seu fluxo lá).
