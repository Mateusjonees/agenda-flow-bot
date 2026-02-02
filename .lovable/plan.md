

# Plano: Melhorias na Autenticação e Cookie Consent

## Resumo das Alterações

Vou implementar 3 melhorias solicitadas:

1. **Login com Google mais rápido** - Remover o atraso de carregamento do Supabase client
2. **Cookie Consent apenas no site público** - Mover o banner de cookies para aparecer apenas nas páginas públicas (landing, pricing, etc.), não dentro do sistema logado
3. **Notificação profissional de verificação de email** - Melhorar a experiência ao criar conta manualmente com mensagem mais clara e profissional

---

## Detalhes das Mudanças

### 1. Login Google mais Rápido

**Problema atual:** O Supabase client é carregado com um `setTimeout` de 100ms, o que causa um pequeno delay.

**Solução:** Carregar o Supabase client imediatamente na montagem do componente, sem delay artificial.

```text
┌─────────────────────────────────────────────┐
│ ANTES                                       │
├─────────────────────────────────────────────┤
│ Clique → Aguardar 100ms → Carregar Supabase │
│        → Iniciar OAuth → Redirecionar       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ DEPOIS                                      │
├─────────────────────────────────────────────┤
│ Clique → OAuth imediato → Redirecionar      │
└─────────────────────────────────────────────┘
```

### 2. Cookie Consent Apenas no Site Público

**Problema atual:** O `CookieConsent` aparece em todas as páginas via `GlobalProviders`.

**Solução:** Criar dois componentes separados:
- `PublicGlobalProviders` - Para páginas públicas (com CookieConsent)
- `PrivateGlobalProviders` - Para páginas privadas (sem CookieConsent)

**Páginas que terão Cookie Consent:**
- `/` (Landing)
- `/auth`
- `/pricing`
- `/precos`
- `/faq`
- `/recursos`
- `/depoimentos`
- `/politica-privacidade`
- `/termos-servico`

**Páginas que NÃO terão Cookie Consent:**
- `/dashboard`
- `/agendamentos`
- `/clientes`
- E todas as outras rotas privadas

### 3. Notificação Profissional de Verificação de Email

**Problema atual:** A notificação atual usa emojis e é informal.

**Solução:** Criar uma notificação mais limpa e profissional:

```text
┌───────────────────────────────────────────────────────┐
│ ✓ Conta criada com sucesso!                           │
│                                                        │
│ Enviamos um email de verificação para [email].        │
│ Por favor, verifique sua caixa de entrada para        │
│ ativar sua conta. Lembre-se de checar também a        │
│ pasta de spam ou lixo eletrônico.                     │
└───────────────────────────────────────────────────────┘
```

- Remover emojis excessivos
- Texto mais claro e direto
- Duração adequada (8 segundos)
- Usar um único toast bem formatado ao invés de dois

---

## Arquivos a Serem Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Auth.tsx` | Carregar Supabase imediatamente + melhorar notificação de signup |
| `src/components/CookieConsent.tsx` | Adicionar verificação de rota para exibir apenas em páginas públicas |
| `src/components/GlobalProviders.tsx` | Nenhuma alteração necessária (CookieConsent se auto-ocultará) |

---

## Detalhes Técnicos

### Auth.tsx - Carregamento Imediato
```typescript
// Carregar Supabase no topo, sem setTimeout
useEffect(() => {
  const loadSupabase = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    setSupabaseClient(supabase);
    // ... resto da lógica
  };
  loadSupabase(); // Sem delay
}, [navigate]);
```

### CookieConsent.tsx - Verificação de Rota
```typescript
const PUBLIC_ROUTES = ['/', '/auth', '/pricing', '/precos', '/faq', '/recursos', '/depoimentos', '/politica-privacidade', '/termos-servico'];

export function CookieConsent() {
  const location = useLocation();
  
  // Só mostrar em rotas públicas
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );
  
  if (!isPublicRoute) return null;
  // ... resto do componente
}
```

### Auth.tsx - Notificação Profissional
```typescript
toast.success("Conta criada com sucesso!", {
  duration: 8000,
  description: `Enviamos um email de verificação para ${email}. Verifique sua caixa de entrada e também a pasta de spam para ativar sua conta.`,
});
```

---

## Resultado Esperado

1. **Google Login** - Clique responde instantaneamente, sem delay perceptível
2. **Cookie Banner** - Aparece apenas na landing page e páginas públicas
3. **Cadastro Manual** - Mensagem clara e profissional orientando o usuário a verificar o email

