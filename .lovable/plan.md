
# Plano: Melhorias no Módulo Financeiro para Contabilidade + APIs Gratuitas

## Diagnóstico Atual

O sistema já possui um módulo financeiro funcional com:
- Registro de receitas e despesas
- Categorias financeiras
- Fechamento diário
- Relatórios básicos (DRE simplificado)
- Exportação para Excel/PDF

### O que falta para uso contábil profissional:

| Funcionalidade | Status Atual | Impacto |
|----------------|--------------|---------|
| Centro de Custos | Ausente | Essencial para contabilidade |
| Plano de Contas | Ausente | Essencial para DRE formal |
| Contas a Pagar/Receber | Parcial | Não há gestão de vencimentos |
| Conciliação Bancária | Ausente | Importante para controle |
| Notas Fiscais | Ausente | Necessário para MEI/ME |
| Impostos | Ausente | Essencial para declarações |

---

## APIs Gratuitas Disponíveis

### 1. APIs que JÁ ESTÃO em uso no sistema:
- **ViaCEP** - Busca de endereços (já implementado)
- **ReceitaWS** - Consulta CNPJ (já implementado)

### 2. APIs Gratuitas que podem ser integradas:

| API | Finalidade | Limite Gratuito |
|-----|------------|-----------------|
| **BrasilAPI** | CNPJ, CEP, Bancos, Feriados | Ilimitado |
| **Open Exchange Rates** | Cotação de moedas (USD, EUR) | 1.000 req/mês |
| **Alpha Vantage** | Cotação de ações | 5 req/min |
| **Economia AwesomeAPI** | Dólar, Euro em tempo real | Ilimitado |
| **IBGE API** | Estados, municípios, dados demográficos | Ilimitado |

---

## Proposta de Implementação

### Fase 1: Estrutura Contábil Básica

**1.1 - Plano de Contas Simplificado**

Criar estrutura padrão para MEI/ME:
```text
1. RECEITAS
   1.1 Receita Operacional
   1.2 Receita Financeira
   1.3 Outras Receitas

2. DESPESAS
   2.1 Despesas Operacionais
   2.2 Despesas Administrativas
   2.3 Despesas Financeiras
   2.4 Impostos e Taxas

3. CUSTOS
   3.1 Custo dos Produtos
   3.2 Custo dos Serviços
```

**1.2 - Centro de Custos**

Permitir classificar transacoes por departamento/projeto:
- Marketing
- Operacional
- Administrativo
- Projetos específicos

**1.3 - Nova tabela: `accounting_accounts`**

Schema proposto:
- id, user_id, code (ex: "1.1"), name, type, parent_id

---

### Fase 2: Contas a Pagar e Receber

**2.1 - Campos adicionais em `financial_transactions`:**
- `due_date` - Data de vencimento
- `paid_date` - Data de pagamento
- `recurrence` - Mensal, semanal, etc.
- `supplier_name` - Fornecedor
- `document_number` - Número da nota fiscal
- `cost_center_id` - Centro de custo
- `account_id` - Conta contábil

**2.2 - Interface de Contas a Pagar:**
- Lista de contas pendentes
- Alertas de vencimento (hoje, próximos 7 dias, atrasadas)
- Parcelamentos
- Lançamentos recorrentes automáticos

---

### Fase 3: Integrações com APIs Gratuitas

**3.1 - Dashboard de Cotações (Economia AwesomeAPI)**

Mostrar no dashboard financeiro:
- Dólar comercial (compra/venda)
- Euro
- Bitcoin

**3.2 - Validação Avancada de Fornecedores (BrasilAPI)**

Ao cadastrar fornecedor:
- Validar CNPJ automaticamente
- Preencher dados (razão social, endereço)
- Verificar situação cadastral

**3.3 - Feriados Automáticos**

Usar API de feriados para:
- Calcular dias úteis em prazos
- Avisar sobre vencimentos em feriados

---

### Fase 4: Relatórios Contábeis

**4.1 - DRE Completo**

```text
DEMONSTRATIVO DE RESULTADOS (DRE)
Período: Janeiro/2026

(+) Receita Bruta de Vendas.............. R$ 15.000,00
(-) Deduções e Impostos.................. R$ 1.500,00
(=) Receita Líquida...................... R$ 13.500,00
(-) Custo dos Produtos/Serviços.......... R$ 4.000,00
(=) Lucro Bruto.......................... R$ 9.500,00
(-) Despesas Operacionais................ R$ 3.000,00
(-) Despesas Administrativas............. R$ 1.500,00
(-) Despesas Financeiras................. R$ 200,00
(=) Lucro Operacional.................... R$ 4.800,00
(-) IR/CSLL (estimado)................... R$ 480,00
(=) LUCRO LÍQUIDO........................ R$ 4.320,00
```

**4.2 - Fluxo de Caixa**

Relatório de entradas e saídas por período com projeção futura.

**4.3 - Exportação para Contabilidade**

Formato compatível com:
- OFX (para conciliação bancária)
- CSV padronizado (para importação em sistemas contábeis)

---

## Implementação Técnica

### Novas Tabelas no Banco de Dados

```sql
-- Plano de Contas
CREATE TABLE accounting_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- receita, despesa, custo
  parent_id UUID REFERENCES accounting_accounts(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Centros de Custo
CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fornecedores
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name VARCHAR(200) NOT NULL,
  document VARCHAR(20), -- CPF ou CNPJ
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Alterações em `financial_transactions`

```sql
ALTER TABLE financial_transactions 
ADD COLUMN due_date TIMESTAMPTZ,
ADD COLUMN paid_date TIMESTAMPTZ,
ADD COLUMN recurrence VARCHAR(20),
ADD COLUMN supplier_id UUID REFERENCES suppliers(id),
ADD COLUMN document_number VARCHAR(50),
ADD COLUMN cost_center_id UUID REFERENCES cost_centers(id),
ADD COLUMN account_id UUID REFERENCES accounting_accounts(id);
```

### Nova Edge Function para Cotações

```typescript
// supabase/functions/fetch-exchange-rates/index.ts
// Buscar cotações da Economia AwesomeAPI (gratuita)
const response = await fetch(
  "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL"
);
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/ContasPagar.tsx` | Criar - Interface de contas a pagar |
| `src/pages/ContasReceber.tsx` | Criar - Interface de contas a receber |
| `src/components/AccountingDashboard.tsx` | Criar - Dashboard com cotações e resumo |
| `src/pages/Financeiro.tsx` | Modificar - Adicionar nova estrutura |
| `src/components/FinancialTransactionDialog.tsx` | Modificar - Novos campos |
| `src/components/DREReport.tsx` | Criar - DRE completo |
| `src/components/CashFlowReport.tsx` | Criar - Fluxo de caixa |
| `src/components/SupplierDialog.tsx` | Criar - Cadastro de fornecedores |
| `supabase/functions/fetch-exchange-rates/` | Criar - Edge function |

---

## Cronograma Sugerido

| Fase | Entregas | Prioridade |
|------|----------|------------|
| **1** | Plano de Contas + Centros de Custo | Alta |
| **2** | Contas a Pagar/Receber | Alta |
| **3** | Fornecedores + APIs de cotação | Média |
| **4** | DRE Completo + Fluxo de Caixa | Média |
| **5** | Exportação OFX/CSV contábil | Baixa |

---

## Resultado Final

Com essas melhorias, o contador poderá:

1. Visualizar o DRE mensal/anual completo
2. Acompanhar contas a pagar e receber
3. Classificar despesas por centro de custo
4. Exportar dados em formato compatível com sistemas contábeis
5. Ver cotações de moedas em tempo real
6. Gerar relatórios de fluxo de caixa

O sistema passará de um controle financeiro básico para uma ferramenta de gestão contábil completa para pequenas empresas.
