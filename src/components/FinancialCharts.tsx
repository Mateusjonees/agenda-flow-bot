import { memo, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart as PieChartIcon, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load recharts for better initial load performance
const LazyAreaChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.AreaChart }))
);
const LazyBarChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.BarChart }))
);
const LazyPieChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.PieChart }))
);

interface FinancialChartsProps {
  revenueData: Array<{ date: string; value: number }>;
  categoryData: Array<{ name: string; value: number }>;
  cashFlowData: Array<{ date: string; income: number; expense: number }>;
}

const COLORS = [
  "hsl(262.1 83.3% 57.8%)",
  "hsl(346.8 77.2% 49.8%)",
  "hsl(24.6 95% 53.1%)",
  "hsl(142.1 76.2% 36.3%)",
  "hsl(217.2 91.2% 59.8%)",
  "hsl(280.4 89.1% 65.5%)",
];

const ChartSkeleton = () => (
  <div className="w-full h-[300px] flex items-center justify-center">
    <Skeleton className="w-full h-full" />
  </div>
);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
};

// Separate component for revenue chart to enable code splitting
const RevenueChart = memo(({ data }: { data: Array<{ date: string; value: number }> }) => {
  // Dynamic import for chart components
  const { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
  } = require("recharts");

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
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
  );
});

RevenueChart.displayName = "RevenueChart";

// Separate component for category chart
const CategoryChart = memo(({ data }: { data: Array<{ name: string; value: number }> }) => {
  const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = require("recharts");

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
      </PieChart>
    </ResponsiveContainer>
  );
});

CategoryChart.displayName = "CategoryChart";

// Separate component for cash flow chart
const CashFlowChart = memo(({ data }: { data: Array<{ date: string; income: number; expense: number }> }) => {
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = require("recharts");

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
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
  );
});

CashFlowChart.displayName = "CashFlowChart";

export const FinancialCharts = memo(({ 
  revenueData, 
  categoryData, 
  cashFlowData 
}: FinancialChartsProps) => {
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
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChart data={revenueData} />
          </Suspense>
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
          <Suspense fallback={<ChartSkeleton />}>
            <CategoryChart data={categoryData} />
          </Suspense>
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
          <Suspense fallback={<ChartSkeleton />}>
            <CashFlowChart data={cashFlowData} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
});

FinancialCharts.displayName = "FinancialCharts";
