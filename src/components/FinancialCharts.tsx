import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity } from "lucide-react";

interface FinancialChartsProps {
  revenueData: Array<{ date: string; value: number }>;
  categoryData: Array<{ name: string; value: number }>;
  cashFlowData: Array<{ date: string; income: number; expense: number }>;
}

const COLORS = [
  "hsl(262.1 83.3% 57.8%)", // primary
  "hsl(346.8 77.2% 49.8%)", // secondary
  "hsl(24.6 95% 53.1%)",    // accent
  "hsl(142.1 76.2% 36.3%)", // green
  "hsl(217.2 91.2% 59.8%)", // blue
  "hsl(280.4 89.1% 65.5%)", // purple
];

export const FinancialCharts = ({ 
  revenueData, 
  categoryData, 
  cashFlowData 
}: FinancialChartsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Gráfico de Faturamento */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500 dark:bg-gradient-to-br dark:from-primary dark:to-secondary">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-lg font-bold">Faturamento por Período</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Categorias */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500 dark:bg-gradient-to-br dark:from-accent dark:to-primary">
              <PieChartIcon className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-lg font-bold">Despesas por Categoria</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Fluxo de Caixa */}
      <Card className="border-0 shadow-xl lg:col-span-2">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500 dark:bg-gradient-to-br dark:from-secondary dark:to-accent">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-lg font-bold">Fluxo de Caixa</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar 
                dataKey="income" 
                name="Receitas"
                fill="#10b981" 
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="expense" 
                name="Despesas"
                fill="#ef4444" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};