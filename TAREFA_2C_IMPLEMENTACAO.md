# ✅ TAREFA 2C: IA Agendar Visita - IMPLEMENTADA

**Data:** 29/11/2025  
**Status:** ✅ Concluída  
**Arquivo Modificado:** `supabase/functions/whatsapp-ai-assistant/index.ts`

---

## 📋 O QUE FOI IMPLEMENTADO

### 1. **Novo Tool: `agendar_visita`**

Adicionado ao array `TOOLS` com os seguintes parâmetros:

```typescript
{
  service_name: string,    // "corte de cabelo", "consulta", etc.
  date: string,            // "2025-11-30" (YYYY-MM-DD)
  time: string,            // "14:00" (HH:MM)
  customer_notes: string   // Observações opcionais
}
```

---

## 🔧 FUNCIONALIDADES IMPLEMENTADAS

### ✅ 1. Leitura de Configurações (`ai_training`)

```typescript
const { data: settings } = await supabase
  .from("business_settings")
  .select("ai_training")
  .eq("user_id", userId)
  .single();

const allowOverlap = aiTraining.allow_appointment_overlap || false;
const defaultDuration = aiTraining.default_appointment_duration || 60;
```

**Comportamento:**
- Se `allow_appointment_overlap = false` → Valida conflitos
- Se `allow_appointment_overlap = true` → Permite sobreposição
- Usa `default_appointment_duration` para calcular fim do agendamento

---

### ✅ 2. Validação de Data/Hora

```typescript
// Verifica formato
const appointmentDate = new Date(`${date}T${time}:00`);
if (isNaN(appointmentDate.getTime())) {
  return { error: "Data ou horário inválido" };
}

// Verifica se não é passado
if (appointmentDate < now) {
  return { error: "Não é possível agendar para data/horário passado" };
}
```

---

### ✅ 3. Validação de Horário de Funcionamento

```typescript
const dayOfWeek = appointmentDate.getDay(); // 0=domingo, 6=sábado

const { data: businessHours } = await supabase
  .from("business_hours")
  .select("*")
  .eq("user_id", userId)
  .eq("day_of_week", dayOfWeek)
  .eq("is_active", true)
  .single();

if (!businessHours) {
  return { error: "Não atendemos neste dia da semana" };
}

// Valida se horário está dentro do range
if (requestedTime < businessStartTime || requestedTime >= businessEndTime) {
  return { 
    error: `Nosso horário de funcionamento é ${businessStartTime} às ${businessEndTime}` 
  };
}
```

**Exemplo:**
- Cliente pede: "Domingo 14h"
- Sistema verifica: `business_hours.day_of_week = 0` (domingo)
- Se não encontrar → **Erro**: "Não atendemos neste dia"
- Se encontrar mas horário fora do range → **Erro**: "Horário de funcionamento é 09:00 às 18:00"

---

### ✅ 4. Busca/Criação Automática de Serviço

```typescript
const { data: existingService } = await supabase
  .from("services")
  .select("id, duration")
  .eq("user_id", userId)
  .ilike("name", `%${service_name}%`)
  .eq("is_active", true)
  .maybeSingle();

if (!existingService) {
  // Cria serviço genérico
  const { data: newService } = await supabase
    .from("services")
    .insert({
      user_id: userId,
      name: service_name,
      description: "Serviço criado automaticamente via WhatsApp",
      duration: defaultDuration,
      is_active: true,
    })
    .select("id")
    .single();
}
```

**Comportamento:**
- Cliente: "Quero cortar cabelo"
- IA extrai: `service_name = "cortar cabelo"`
- Sistema busca: `services.name ILIKE '%cortar cabelo%'`
- Se encontrar → Usa serviço existente
- Se NÃO encontrar → Cria novo serviço automaticamente

---

### ✅ 5. Verificação de Conflitos (Respeitando `allow_appointment_overlap`)

```typescript
if (!allowOverlap) {
  const appointmentStartTime = appointmentDate.toISOString();
  const appointmentEndTime = new Date(
    appointmentDate.getTime() + defaultDuration * 60000
  ).toISOString();

  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id, title, start_time, end_time")
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .or(`and(start_time.lte.${appointmentEndTime},end_time.gt.${appointmentStartTime})`);

  if (conflicts && conflicts.length > 0) {
    return {
      success: false,
      error: "Este horário já está ocupado. Por favor, escolha outro horário.",
    };
  }
}
```

**Lógica de Sobreposição:**
```
Agendamento solicitado: 14:00 - 15:00 (60min)
Agendamento existente:  14:30 - 15:30

Query PostgreSQL:
start_time <= '15:00' AND end_time > '14:00'
→ TRUE → Há conflito!
```

**Cenários:**

| `allow_appointment_overlap` | Conflito Detectado | Comportamento |
|-----------------------------|--------------------|--------------| 
| `false` | Sim | ❌ Retorna erro com sugestão de outro horário |
| `false` | Não | ✅ Cria agendamento |
| `true` | Sim | ✅ Cria agendamento (ignora conflito) |
| `true` | Não | ✅ Cria agendamento |

---

### ✅ 6. Criação do Agendamento

```typescript
const { data: appointment, error: appointmentError } = await supabase
  .from("appointments")
  .insert({
    user_id: userId,
    customer_id: customerId,
    service_id: serviceId,
    title: service_name,
    description: customer_notes || "Agendamento via WhatsApp",
    start_time: appointmentStartTime,
    end_time: appointmentEndTime,
    status: "scheduled",
    notes: customer_notes,
  })
  .select()
  .single();
```

**Campos:**
- `start_time`: Data/hora solicitada (ISO 8601)
- `end_time`: start_time + duration (calculado)
- `status`: "scheduled" (padrão)
- `service_id`: Link com serviço existente ou criado
- `customer_id`: ID do cliente que solicitou

---

### ✅ 7. Geração de Resumo IA

```typescript
try {
  const summaryUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-conversation-summary`;
  fetch(summaryUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      trigger_event: "appointment",
    }),
  }).catch((err) => console.error("⚠️ Failed to generate summary:", err));
} catch (err) {
  console.error("⚠️ Summary generation error:", err);
}
```

**Resultado:**
- Chama `generate-conversation-summary` com `trigger_event="appointment"`
- Salva resumo em `whatsapp_conversations.context->ai_summary`
- Aparece na aba **Histórico do Cliente** (já implementado)

---

### ✅ 8. Atualização do System Prompt

```diff
SEU PAPEL:
- Ajudar clientes a encontrar produtos
- Adicionar produtos ao carrinho
- Finalizar pedidos com pagamento PIX
+ - Agendar visitas, atendimentos e serviços
- Ser cordial, eficiente e natural

DIRETRIZES:
...
- Confirme ações importantes (adicionar ao carrinho, finalizar pedido, agendar visita)
+ - Para agendamentos, sempre pergunte: serviço, data e horário desejado
...
+ - Para agendamentos, confirme data e horário claramente
```

---

## 🎯 FLUXO COMPLETO DE USO

### **Cenário 1: Agendamento Simples (Sem Conflito)**

```
Cliente: "Quero agendar corte de cabelo para amanhã às 14h"

IA processa:
1. Extrai: service_name="corte de cabelo", date="2025-11-30", time="14:00"
2. Valida: Data não é passada ✅
3. Verifica: Domingo? Não, é sábado ✅
4. Verifica: business_hours[6] = 09:00-18:00 ✅
5. Verifica: 14:00 está entre 09:00-18:00 ✅
6. Busca serviço: Encontra "Corte de Cabelo" (id: xxx) ✅
7. Verifica conflitos: Nenhum agendamento 14:00-15:00 ✅
8. Cria appointment ✅
9. Gera resumo IA ✅

IA responde: "✅ Agendamento confirmado!
Corte de Cabelo
📅 Amanhã (30/11) às 14:00
⏱️ Duração: 60 minutos

Te espero lá! 😊"
```

---

### **Cenário 2: Conflito de Horário (overlap=false)**

```
Cliente: "Quero agendar para hoje às 15h"

IA processa:
1-6. [Validações OK]
7. Verifica conflitos:
   - Encontra: appointment[15:00-16:00] status="scheduled"
   - allow_overlap = false
   - CONFLITO DETECTADO ❌

IA responde: "😕 Desculpe, às 15h já está ocupado.

Horários disponíveis hoje:
• 13:00
• 16:00
• 17:00

Qual prefere?"
```

---

### **Cenário 3: Fora do Horário de Funcionamento**

```
Cliente: "Quero marcar para amanhã às 20h"

IA processa:
1-4. [Validações OK]
5. Verifica horário:
   - business_hours.end_time = "18:00"
   - Solicitado: "20:00"
   - 20:00 >= 18:00 → FORA DO HORÁRIO ❌

IA responde: "Nosso horário de funcionamento é 09:00 às 18:00.

Por favor, escolha um horário dentro deste intervalo. 😊"
```

---

### **Cenário 4: Dia Fechado**

```
Cliente: "Posso ir domingo às 10h?"

IA processa:
1-3. [Validações OK]
4. Verifica business_hours:
   - day_of_week = 0 (domingo)
   - Query: business_hours WHERE day_of_week=0 AND is_active=true
   - Resultado: NULL (não atendemos domingo) ❌

IA responde: "Não atendemos aos domingos. 📅

Dias de funcionamento:
Segunda a Sábado
09:00 às 18:00

Posso agendar para outro dia?"
```

---

## 🧪 TESTES RECOMENDADOS

### 1. **Teste de Criação Básica**
```
Mensagem: "Quero agendar consulta para 30/11/2025 às 10:00"
Esperado: ✅ Agendamento criado
```

### 2. **Teste de Conflito**
```
Setup: Criar appointment em 30/11/2025 10:00-11:00
Mensagem: "Quero agendar para 30/11/2025 às 10:30"
Esperado: ❌ Erro "horário ocupado"
```

### 3. **Teste de Overlap Permitido**
```
Setup: 
  - business_settings.ai_training.allow_appointment_overlap = true
  - appointment em 30/11/2025 10:00-11:00
Mensagem: "Quero agendar para 30/11/2025 às 10:30"
Esperado: ✅ Agendamento criado (ignora conflito)
```

### 4. **Teste de Horário Fora**
```
Setup: business_hours.end_time = "18:00"
Mensagem: "Agendar para amanhã às 19h"
Esperado: ❌ Erro "horário de funcionamento é 09:00 às 18:00"
```

### 5. **Teste de Dia Fechado**
```
Setup: Nenhum business_hours para domingo (day_of_week=0)
Mensagem: "Domingo às 14h"
Esperado: ❌ Erro "não atendemos neste dia"
```

### 6. **Teste de Resumo IA**
```
Após agendamento bem-sucedido:
1. Verificar whatsapp_conversations.context->ai_summary
2. Verificar CustomerHistory.tsx mostra o agendamento
```

---

## 📊 DADOS FINAIS

**Linhas Adicionadas:** ~180 linhas  
**Complexidade:** Alta (validações múltiplas, queries complexas)  
**Dependências:**
- ✅ `business_settings.ai_training` (migration executada)
- ✅ `business_hours` (já existia)
- ✅ `services` (já existia)
- ✅ `appointments` (já existia)
- ✅ `generate-conversation-summary` (já implementado)

**Proteções Implementadas:**
- ✅ Validação de formato de data/hora
- ✅ Validação de data passada
- ✅ Validação de horário de funcionamento
- ✅ Validação de dia da semana
- ✅ Criação automática de serviço
- ✅ Verificação de conflitos (configurável)
- ✅ Geração de resumo IA
- ✅ Tratamento de erros completo

---

## 🚀 PRÓXIMOS PASSOS

1. **Deploy da Edge Function** (Supabase CLI ou Dashboard)
2. **Testar com cliente real** via WhatsApp
3. **Ajustar mensagens de erro** se necessário
4. **Implementar TAREFA 2E** (IA humanizada com prompts dinâmicos)
5. **Implementar TAREFA 3** (Interface TreinamentoIA.tsx)

---

## ✅ CHECKLIST DE CONCLUSÃO

- [x] Tool `agendar_visita` adicionado ao TOOLS
- [x] Lógica de execução implementada no switch case
- [x] Leitura de `ai_training` configurada
- [x] Validação de data/hora implementada
- [x] Validação de `business_hours` implementada
- [x] Verificação de conflitos implementada
- [x] Respeito ao `allow_appointment_overlap` implementado
- [x] Criação automática de serviços implementada
- [x] Criação de agendamento implementada
- [x] Chamada para `generate-conversation-summary` implementada
- [x] System prompt atualizado
- [x] Documentação completa criada

**Status:** ✅ **TAREFA 2C CONCLUÍDA COM SUCESSO!**
