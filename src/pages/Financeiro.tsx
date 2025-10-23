import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DailyClosing } from "@/components/DailyClosing";

interface FinancialSummary {
  income: number;
  expenses: number;
  balance: number;
}

const Financeiro = () => {
  const [summary, setSummary] = useState<FinancialSummary>({
    income: 0,
    expenses: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      // Fetch income
      const { data: incomeData } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "income")
        .eq("status", "completed")
        .gte("transaction_date", monthStart.toISOString())
        .lte("transaction_date", monthEnd.toISOString());

      // Fetch expenses
      const { data: expenseData } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .eq("status", "completed")
        .gte("transaction_date", monthStart.toISOString())
        .lte("transaction_date", monthEnd.toISOString());

      const totalIncome = incomeData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      setSummary({
        income: totalIncome,
        expenses: totalExpenses,
        balance: totalIncome - totalExpenses,
      });
      setLoading(false);
    };

    fetchFinancialData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Financeiro</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-3">
          <DailyClosing />
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas do Mês
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent to-green-500">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {loading ? "-" : formatCurrency(summary.income)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do Mês
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-destructive to-red-600">
              <TrendingDown className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {loading ? "-" : formatCurrency(summary.expenses)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo do Mês
            </CardTitle>
            <div className={`p-2 rounded-lg bg-gradient-to-br ${summary.balance >= 0 ? 'from-primary to-primary-hover' : 'from-destructive to-red-600'}`}>
              <DollarSign className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {loading ? "-" : formatCurrency(summary.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="pix">Cobranças Pix</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>
                Histórico de entradas e saídas do seu negócio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>Nenhuma transação encontrada. Adicione sua primeira transação!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pix" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cobranças Pix</CardTitle>
                  <CardDescription>
                    Gerencie suas cobranças via Pix com QR Code dinâmico
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Gerar Cobrança
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center space-y-2">
                  <p>Nenhuma cobrança Pix ativa.</p>
                  <p className="text-sm">
                    Configure sua integração com um provedor de pagamentos para começar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Categorias Financeiras</CardTitle>
                  <CardDescription>
                    Organize suas transações por categoria
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Receitas
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">Serviços</span>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">Produtos</span>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-destructive" />
                    Despesas
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">Aluguel</span>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">Salários</span>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios e DRE</CardTitle>
              <CardDescription>
                Demonstrativo de Resultados do Exercício (DRE) simplificado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">DRE - {format(new Date(), "MMMM/yyyy", { locale: ptBR })}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-accent font-medium">Receitas Totais</span>
                      <span className="font-bold text-accent">{formatCurrency(summary.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-destructive font-medium">Despesas Totais</span>
                      <span className="font-bold text-destructive">- {formatCurrency(summary.expenses)}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="font-bold">Resultado Líquido</span>
                      <span className={`font-bold ${summary.balance >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {formatCurrency(summary.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financeiro;
