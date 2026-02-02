
# Plano: Assistente de IA Interno do Sistema

## Resumo
Vou criar um assistente de IA integrado no sistema que aparece como um botão flutuante. Este assistente funcionará como um agente inteligente que pode executar ações reais no banco de dados através de comandos em linguagem natural.

## O que o Assistente vai fazer

### Capacidades principais:
1. **Agendamentos**: Criar, listar e verificar compromissos
2. **Clientes**: Buscar e cadastrar clientes
3. **Financeiro**: Consultar saldo, registrar transações
4. **Estoque**: Verificar e ajustar itens do inventário  
5. **Tarefas**: Criar e listar tarefas pendentes
6. **Relatórios**: Gerar resumo diário do negócio

### Interface do usuário:
- Botão flutuante com ícone de IA (canto inferior direito)
- Chat em formato de drawer/modal
- Respostas em tempo real com streaming
- Design consistente com o tema do sistema

## Arquitetura Técnica

```text
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (React)                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  AIAssistantButton (Botão Flutuante)                   │  │
│  │         ↓                                               │  │
│  │  AIAssistantChat (Interface do Chat)                   │  │
│  │         ↓                                               │  │
│  │  Chamada para Edge Function                            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│               Edge Function: ai-agent-assistant              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  1. Recebe mensagem do usuário                         │  │
│  │  2. Carrega configurações da IA (business_settings)    │  │
│  │  3. Monta prompt com contexto do negócio               │  │
│  │  4. Chama Lovable AI Gateway com tools                 │  │
│  │  5. Executa function calls (criar agendamento, etc)    │  │
│  │  6. Retorna resposta (streaming)                       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    Supabase Database                          │
│  appointments, customers, tasks, financial_transactions,     │
│  inventory_items, business_settings, etc.                    │
└──────────────────────────────────────────────────────────────┘
```

## Arquivos a serem criados/modificados

### Novos arquivos:

1. **`supabase/functions/ai-agent-assistant/index.ts`**
   - Edge function principal do agente
   - 10 tools para operações no banco de dados
   - Usa Lovable AI Gateway (`google/gemini-3-flash-preview`)
   - Streaming de respostas

2. **`src/components/AIAssistantButton.tsx`**
   - Botão flutuante animado
   - Gerencia estado de aberto/fechado do chat
   - Posição fixa no canto inferior direito

3. **`src/components/AIAssistantChat.tsx`**
   - Interface completa do chat
   - Histórico de mensagens
   - Input de texto com envio
   - Renderização de markdown nas respostas
   - Loading state enquanto processa

### Arquivos modificados:

4. **`src/components/Layout.tsx`**
   - Adicionar o `<AIAssistantButton />` no layout principal

## Tools do Agente (10 capacidades)

| Tool | Descrição |
|------|-----------|
| `listar_agendamentos` | Lista agendamentos do dia/semana |
| `criar_agendamento` | Cria novo agendamento com cliente |
| `buscar_clientes` | Busca clientes por nome/telefone |
| `cadastrar_cliente` | Cadastra novo cliente |
| `consultar_financeiro` | Mostra saldo e últimas transações |
| `registrar_transacao` | Registra receita ou despesa |
| `verificar_estoque` | Lista itens do estoque |
| `ajustar_estoque` | Adiciona/remove quantidade de item |
| `criar_tarefa` | Cria nova tarefa |
| `gerar_resumo_diario` | Resume estatísticas do dia |

## Exemplos de uso

O usuário poderá dizer:
- *"Quais agendamentos tenho para hoje?"*
- *"Agende um corte de cabelo para João amanhã às 14h"*
- *"Cadastre o cliente Maria, telefone 48999001122"*
- *"Quanto entrou de dinheiro essa semana?"*
- *"Registre uma despesa de R$150 de material"*
- *"Tem shampoo no estoque?"*
- *"Crie uma tarefa para ligar para o cliente Pedro"*
- *"Como foi meu dia hoje?"*

## Segurança e Escopo

- Todas as operações usam o `owner_id` (dono da empresa) para garantir que colaboradores acessem os dados corretos
- A IA não pode acessar dados de outras empresas
- As configurações de personalidade da IA são respeitadas (mesmo treinamento do WhatsApp)

## Próximos passos após implementação

1. Testar todas as funcionalidades do agente
2. Verificar se os dados estão sendo salvos corretamente
3. Ajustar o prompt caso necessário
