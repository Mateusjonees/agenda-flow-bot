

## Objetivo

Remover o banner de cookies da tela de login (`/auth`) para que ele apareça apenas nas páginas de marketing do site.

---

## Problema Identificado

O banner de cookies está configurado para aparecer em todas as "rotas públicas", incluindo `/auth`:

```javascript
const PUBLIC_ROUTES = ['/', '/auth', '/pricing', '/precos', ...];
```

O usuário quer uma interface limpa na tela de login, sem o banner de cookies interrompendo a experiência.

---

## Solução

Remover `/auth` da lista de rotas públicas do componente `CookieConsent.tsx`.

### O que será alterado

**Arquivo:** `src/components/CookieConsent.tsx`

- Linha 67: Remover `/auth` da lista `PUBLIC_ROUTES`

```text
Antes:
const PUBLIC_ROUTES = ['/', '/auth', '/pricing', '/precos', '/faq', ...];

Depois:
const PUBLIC_ROUTES = ['/', '/pricing', '/precos', '/faq', ...];
```

---

## Resultado Esperado

- A tela de login ficará limpa, sem o banner de cookies
- O banner continuará aparecendo apenas nas páginas de marketing (Home, Preços, FAQ, Recursos, etc.)
- Após aceitar/recusar uma vez, não aparecerá novamente (já funciona assim)

---

## Detalhes Técnicos

| Item | Descrição |
|------|-----------|
| Arquivo modificado | `src/components/CookieConsent.tsx` |
| Tipo de mudança | Remoção de 1 item do array |
| Risco | Nenhum - mudança isolada |
| Tempo estimado | 1 minuto |

