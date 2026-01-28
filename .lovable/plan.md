
## Plano: Integração Completa do Meta Pixel para Todos os Eventos

Identifiquei os pontos onde o rastreamento do Meta Pixel está faltando ou incompleto.

### Problemas Encontrados

| Local | Problema |
|-------|----------|
| `Auth.tsx` - Login com Email | Sem rastreamento ao fazer login com sucesso |
| `Auth.tsx` - Login com Google | Sem rastreamento ao iniciar login OAuth |
| `App.tsx` - Auth State Change | Sem detecção de primeiro login (Google OAuth retorna para dashboard) |
| `ScheduleAppointmentDialog.tsx` | Sem evento Schedule |
| `PixPaymentDialog.tsx` | Sem eventos Purchase/Subscribe ao confirmar pagamento |
| `SubscriptionManager.tsx` | Sem eventos de checkout e pagamento |
| `FAQSection.tsx` | Sem evento Contact no botão de suporte |
| `SearchBar.tsx` | Sem evento Search |

### Solução Proposta

**1. Rastrear Login com Email (`Auth.tsx`)**
Adicionar evento customizado `Login` quando o login com email for bem-sucedido.

**2. Rastrear Login com Google (`Auth.tsx`)**
Adicionar evento `Lead` ao clicar em "Continuar com Google".

**3. Detectar Primeiro Acesso (OAuth) (`App.tsx`)**
Criar um listener global que detecta quando um usuário novo faz login via OAuth e dispara `CompleteRegistration`.

**4. Adicionar Eventos de Pagamento (`PixPaymentDialog.tsx`)**
Disparar eventos `Purchase` e `Subscribe` quando o pagamento PIX for confirmado.

**5. Adicionar Eventos no `SubscriptionManager.tsx`**
Disparar `InitiateCheckout` ao selecionar um plano.

**6. Adicionar Search no `SearchBar.tsx`**
Disparar evento `Search` quando o usuário fizer uma busca.

**7. Adicionar Contact no `FAQSection.tsx`**
Disparar evento `Contact` ao clicar em "Falar com Suporte".

**8. Adicionar Schedule no `ScheduleAppointmentDialog.tsx`**
Disparar evento `Schedule` ao criar agendamento via proposta.

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Auth.tsx` | Adicionar tracking para login email + Google OAuth |
| `src/App.tsx` | Adicionar detecção de primeiro login OAuth |
| `src/components/PixPaymentDialog.tsx` | Adicionar Purchase/Subscribe no sucesso |
| `src/components/SubscriptionManager.tsx` | Adicionar InitiateCheckout |
| `src/components/SearchBar.tsx` | Adicionar evento Search |
| `src/components/landing/FAQSection.tsx` | Adicionar evento Contact |
| `src/components/ScheduleAppointmentDialog.tsx` | Adicionar evento Schedule |
| `src/hooks/useFacebookPixel.tsx` | Adicionar novo evento `trackLogin` |

---

### Detalhes Tecnicos

#### 1. Novo Evento Login (`useFacebookPixel.tsx`)

```tsx
const trackLogin = (method?: string) => {
  trackEvent('Login', {
    content_name: method || 'email',
  });
};
```

#### 2. Auth.tsx - Login Email e Google

```tsx
// No sucesso do handleSignIn:
trackLogin('email');

// No handleGoogleLogin antes do OAuth:
trackLead({ content_name: 'google_oauth', content_category: 'authentication' });
```

#### 3. App.tsx - Deteccao de Primeiro Login OAuth

Criar um componente `AuthTracker` que escuta `onAuthStateChange`:

```tsx
const AuthTracker = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const isOAuth = session.user.app_metadata?.provider !== 'email';
          const isNewUser = new Date(session.user.created_at).getTime() > 
                           Date.now() - 60000; // Criado ha menos de 1 min
          
          if (isOAuth && isNewUser) {
            fbPixel.track('CompleteRegistration', { 
              content_name: session.user.app_metadata?.provider || 'oauth' 
            });
            fbPixel.track('StartTrial', { value: 0, currency: 'BRL' });
          }
          
          fbPixel.trackCustom('Login', { 
            method: session.user.app_metadata?.provider || 'email' 
          });
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);
  return null;
};
```

#### 4. PixPaymentDialog.tsx

```tsx
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

// Dentro do componente:
const { trackPurchase, trackSubscribe } = useFacebookPixel();

// No handlePaymentSuccess:
trackPurchase({ value: amount, content_name: 'PIX Subscription' });
trackSubscribe({ value: amount });
```

#### 5. SubscriptionManager.tsx

```tsx
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

const { trackInitiateCheckout } = useFacebookPixel();

// No handleSubscribe:
trackInitiateCheckout({
  value: plan.totalPrice,
  content_name: plan.name,
});
```

#### 6. SearchBar.tsx

```tsx
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

const { trackSearch } = useFacebookPixel();

// Ao executar busca:
trackSearch({ search_string: search });
```

#### 7. FAQSection.tsx

```tsx
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

const { trackContact } = useFacebookPixel();

// No botao de suporte:
onClick={() => {
  trackContact('whatsapp_faq');
  window.open("https://wa.me/554899075189", "_blank");
}}
```

#### 8. ScheduleAppointmentDialog.tsx

```tsx
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

const { trackSchedule } = useFacebookPixel();

// No sucesso do agendamento:
trackSchedule({ content_name: proposal.title, value: proposal.final_amount });
```

### Resultado Esperado

Apos implementacao, o Meta Pixel ira rastrear:

| Evento | Quando Dispara |
|--------|----------------|
| `PageView` | Toda navegacao (ja funciona) |
| `ViewContent` | Pagina de Auth (ja funciona) |
| `CompleteRegistration` | Cadastro email + primeiro login Google |
| `Lead` | Clique em CTA, cadastro, aceite de cookies |
| `StartTrial` | Novo cadastro |
| `Login` (custom) | Login email + Google |
| `InitiateCheckout` | Selecionar plano |
| `AddPaymentInfo` | Escolher forma pagamento |
| `Purchase` | Pagamento PIX confirmado + cartao |
| `Subscribe` | Assinatura ativada |
| `Schedule` | Novo agendamento |
| `Contact` | Clique em WhatsApp suporte |
| `Search` | Busca no sistema |
