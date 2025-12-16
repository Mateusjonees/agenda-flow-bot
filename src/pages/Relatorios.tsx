import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign,
  MessageSquare,
  AlertCircle,
  Clock,
  Target,
  Loader2,
  Package,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  CalendarIcon,
  Download,
  FileSpreadsheet,
  FileText,
  Activity,
  Star,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Sparkles
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart } from "recharts";
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface InactiveCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  last_visit: string;
  days_inactive: number;
  total_visits: number;
  total_spent: number;
}

interface TimeSlotAnalysis {
  day_of_week: string;
  hour: number;
  appointment_count: number;
  revenue: number;
  conversion_rate: number;
}

interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  profit: number;
  canceled_appointments: number;
  pending_payments: number;
  income_transactions: Array<{
    id: string;
    amount: number;
    description: string;
    transaction_date: string;
    payment_method: string;
  }>;
  expense_transactions: Array<{
    id: string;
    amount: number;
    description: string;
    transaction_date: string;
    payment_method: string;
  }>;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_quantity: number;
  cost_price: number;
}

interface InventoryChartData {
  name: string;
  value: number;
  cost: number;
}

interface ServiceStats {
  service_name: string;
  total_appointments: number;
  total_revenue: number;
  avg_rating: number;
}

interface AppointmentStats {
  total_appointments: number;
  completed: number;
  canceled: number;
  pending: number;
  completion_rate: number;
  cancellation_rate: number;
}

interface ComparisonData {
  current_revenue: number;
  previous_revenue: number;
  revenue_growth: number;
  current_appointments: number;
  previous_appointments: number;
  appointments_growth: number;
}

const Relatorios = () => {
  const navigate = useNavigate();
  const [inactiveCustomers, setInactiveCustomers] = useState<InactiveCustomer[]>([]);
  const [timeSlotAnalysis, setTimeSlotAnalysis] = useState<TimeSlotAnalysis[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [loading, setLoading] = useState(true);
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<"7" | "30" | "90" | "custom">("30");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, [dateFilter, customStartDate, customEndDate, paymentMethodFilter]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    if (dateFilter === "custom") {
      if (!customStartDate || !customEndDate) {
        return { startDate: subDays(now, 30), endDate };
      }
      startDate = startOfDay(new Date(customStartDate));
      endDate = endOfDay(new Date(customEndDate));
    } else {
      const days = parseInt(dateFilter);
      startDate = subDays(now, days);
    }

    return { startDate, endDate };
  };

  const fetchReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    try {
      const { startDate: filterStartDate, endDate: filterEndDate } = getDateRange();
      
      // Buscar clientes inativos (otimizado - uma única query)
      const sixtyDaysAgo = subDays(new Date(), 60);
      
      // Buscar todos os appointments completados com customer info em uma query
      const { data: completedAppointments } = await supabase
        .from("appointments")
        .select(`
          customer_id,
          end_time,
          price,
          customers!inner (
            id,
            name,
            phone,
            email
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("end_time", { ascending: false });

      if (completedAppointments) {
        // Agrupar dados por cliente
        const customerMap = new Map<string, {
          customer: any;
          lastVisit: string;
          totalVisits: number;
          totalSpent: number;
        }>();

        completedAppointments.forEach(apt => {
          const customerId = apt.customer_id;
          if (!customerId || !apt.customers) return;

          const existing = customerMap.get(customerId);
          const visitDate = apt.end_time;
          const price = Number(apt.price || 0);

          if (existing) {
            existing.totalVisits++;
            existing.totalSpent += price;
            // Manter a visita mais recente
            if (new Date(visitDate) > new Date(existing.lastVisit)) {
              existing.lastVisit = visitDate;
            }
          } else {
            customerMap.set(customerId, {
              customer: apt.customers,
              lastVisit: visitDate,
              totalVisits: 1,
              totalSpent: price,
            });
          }
        });

        // Filtrar apenas clientes inativos há mais de 60 dias
        const inactiveList: InactiveCustomer[] = [];
        customerMap.forEach((data, customerId) => {
          const lastVisitDate = new Date(data.lastVisit);
          if (lastVisitDate < sixtyDaysAgo) {
            const daysInactive = Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
            
            inactiveList.push({
              id: customerId,
              name: data.customer.name,
              phone: data.customer.phone,
              email: data.customer.email,
              last_visit: data.lastVisit,
              days_inactive: daysInactive,
              total_visits: data.totalVisits,
              total_spent: data.totalSpent,
            });
          }
        });

        setInactiveCustomers(inactiveList.sort((a, b) => b.total_spent - a.total_spent));
      }

      // Análise de horários (últimos 90 dias)
      const ninetyDaysAgo = subDays(new Date(), 90);
      const { data: appointments } = await supabase
        .from("appointments")
        .select("start_time, end_time, status, price")
        .eq("user_id", user.id)
        .gte("start_time", ninetyDaysAgo.toISOString());

      if (appointments) {
        const slotMap = new Map<string, { count: number; revenue: number }>();
        
        appointments.forEach(apt => {
          const date = new Date(apt.start_time);
          const dayOfWeek = format(date, "EEEE", { locale: ptBR });
          const hour = date.getHours();
          const key = `${dayOfWeek}-${hour}`;
          
          const current = slotMap.get(key) || { count: 0, revenue: 0 };
          slotMap.set(key, {
            count: current.count + 1,
            revenue: current.revenue + (apt.status === "completed" ? Number(apt.price || 0) : 0)
          });
        });

        const analysis: TimeSlotAnalysis[] = [];
        slotMap.forEach((value, key) => {
          const [dayOfWeek, hourStr] = key.split("-");
          const hour = parseInt(hourStr);
          
          // Validar se o hour é um número válido
          if (!isNaN(hour) && hour >= 0 && hour <= 23) {
            analysis.push({
              day_of_week: dayOfWeek,
              hour: hour,
              appointment_count: value.count,
              revenue: value.revenue,
              conversion_rate: value.count > 0 ? (value.revenue / value.count) : 0
            });
          }
        });

        setTimeSlotAnalysis(
          analysis.sort((a, b) => b.appointment_count - a.appointment_count).slice(0, 10)
        );
      }

      // Resumo financeiro (com filtros aplicados) - excluir transações de assinatura de plataforma
      let incomeQuery = supabase
        .from("financial_transactions")
        .select("id, amount, description, transaction_date, payment_method")
        .eq("user_id", user.id)
        .eq("type", "income")
        .eq("status", "completed")
        .not("description", "ilike", "%assinatura monthly%")
        .not("description", "ilike", "%assinatura mensal%")
        .not("description", "ilike", "%assinatura semestral%")
        .not("description", "ilike", "%assinatura anual%")
        .not("description", "ilike", "%plano foguete%")
        .gte("transaction_date", filterStartDate.toISOString())
        .lte("transaction_date", filterEndDate.toISOString())
        .order("transaction_date", { ascending: false });

      let expenseQuery = supabase
        .from("financial_transactions")
        .select("id, amount, description, transaction_date, payment_method")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .eq("status", "completed")
        .gte("transaction_date", filterStartDate.toISOString())
        .lte("transaction_date", filterEndDate.toISOString())
        .order("transaction_date", { ascending: false });

      // Aplicar filtro de método de pagamento se não for "all"
      if (paymentMethodFilter !== "all") {
        incomeQuery = incomeQuery.eq("payment_method", paymentMethodFilter);
        expenseQuery = expenseQuery.eq("payment_method", paymentMethodFilter);
      }

      const { data: incomeData } = await incomeQuery;
      const { data: expenseData } = await expenseQuery;

      const { data: canceledApts } = await supabase
        .from("appointments")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "canceled")
        .gte("created_at", filterStartDate.toISOString())
        .lte("created_at", filterEndDate.toISOString());

      // Buscar propostas pendentes ao invés de transações financeiras
      const { data: pendingProposals } = await supabase
        .from("proposals")
        .select("final_amount")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .gte("created_at", filterStartDate.toISOString())
        .lte("created_at", filterEndDate.toISOString());

      const totalRevenue = incomeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const pendingAmount = pendingProposals?.reduce((sum, p) => sum + Number(p.final_amount || 0), 0) || 0;

      console.log("Dados financeiros carregados:", {
        incomeRecords: incomeData?.length || 0,
        expenseRecords: expenseData?.length || 0,
        totalRevenue,
        totalExpenses,
      });

      setFinancialSummary({
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        profit: totalRevenue - totalExpenses,
        canceled_appointments: canceledApts?.length || 0,
        pending_payments: pendingAmount,
        income_transactions: incomeData || [],
        expense_transactions: expenseData || [],
      });

      // Buscar dados do estoque
      const { data: inventory } = await supabase
        .from("inventory_items")
        .select("id, name, category, current_stock, min_quantity, cost_price")
        .eq("user_id", user.id)
        .order("current_stock", { ascending: false });

      if (inventory) {
        setInventoryData(inventory);
      }

      // Buscar estatísticas de serviços
      const { data: services } = await supabase
        .from("appointments")
        .select("title, price")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("start_time", filterStartDate.toISOString())
        .lte("start_time", filterEndDate.toISOString());

      if (services) {
        const serviceMap = new Map<string, { count: number; revenue: number; ratings: number[] }>();
        
        services.forEach(apt => {
          const serviceName = apt.title || "Sem título";
          const current = serviceMap.get(serviceName) || { count: 0, revenue: 0, ratings: [] };
          
          current.count += 1;
          current.revenue += Number(apt.price || 0);
          
          serviceMap.set(serviceName, current);
        });

        const stats: ServiceStats[] = [];
        serviceMap.forEach((value, key) => {
          stats.push({
            service_name: key,
            total_appointments: value.count,
            total_revenue: value.revenue,
            avg_rating: 0, // Rating não está disponível na tabela appointments
          });
        });

        setServiceStats(stats.sort((a, b) => b.total_revenue - a.total_revenue));
      }

      // Buscar estatísticas de agendamentos
      const { data: allApts } = await supabase
        .from("appointments")
        .select("status")
        .eq("user_id", user.id)
        .gte("start_time", filterStartDate.toISOString())
        .lte("start_time", filterEndDate.toISOString());

      if (allApts) {
        const total = allApts.length;
        const completed = allApts.filter(a => a.status === "completed").length;
        const canceled = allApts.filter(a => a.status === "canceled").length;
        const pending = allApts.filter(a => a.status === "pending").length;

        setAppointmentStats({
          total_appointments: total,
          completed,
          canceled,
          pending,
          completion_rate: total > 0 ? (completed / total) * 100 : 0,
          cancellation_rate: total > 0 ? (canceled / total) * 100 : 0,
        });
      }

      // Comparação com período anterior
      const daysDiff = differenceInDays(filterEndDate, filterStartDate);
      const previousStartDate = subDays(filterStartDate, daysDiff);
      const previousEndDate = filterStartDate;

      const { data: previousIncome } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "income")
        .eq("status", "completed")
        .not("description", "ilike", "%assinatura monthly%")
        .not("description", "ilike", "%assinatura mensal%")
        .not("description", "ilike", "%assinatura semestral%")
        .not("description", "ilike", "%assinatura anual%")
        .not("description", "ilike", "%plano foguete%")
        .gte("transaction_date", previousStartDate.toISOString())
        .lte("transaction_date", previousEndDate.toISOString());

      const { data: previousApts } = await supabase
        .from("appointments")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("start_time", previousStartDate.toISOString())
        .lte("start_time", previousEndDate.toISOString());

      const previousRevenue = previousIncome?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const previousAppointmentsCount = previousApts?.length || 0;

      setComparisonData({
        current_revenue: totalRevenue,
        previous_revenue: previousRevenue,
        revenue_growth: previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0,
        current_appointments: appointmentStats?.completed || 0,
        previous_appointments: previousAppointmentsCount,
        appointments_growth: previousAppointmentsCount > 0 
          ? (((appointmentStats?.completed || 0) - previousAppointmentsCount) / previousAppointmentsCount) * 100 
          : 0,
      });

    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateCustomer = async (customer: InactiveCustomer) => {
    setReactivating(customer.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.functions.invoke("reactivate-customer", {
        body: { 
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          daysInactive: customer.days_inactive
        },
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada!",
        description: `Mensagem de reativação enviada para ${customer.name}`,
      });
    } catch (error) {
      console.error("Erro ao reativar cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem de reativação.",
        variant: "destructive",
      });
    } finally {
      setReactivating(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getFilterLabel = () => {
    if (dateFilter === "custom" && customStartDate && customEndDate) {
      return `${format(new Date(customStartDate), "dd/MM/yyyy")} - ${format(new Date(customEndDate), "dd/MM/yyyy")}`;
    }
    const labels = { "7": "7 dias", "30": "30 dias", "90": "90 dias" };
    return `Últimos ${labels[dateFilter as keyof typeof labels]}`;
  };

  const exportToExcel = () => {
    if (!financialSummary) return;

    const { startDate, endDate } = getDateRange();
    
    // Criar dados do CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Cabeçalho
    csvContent += `Relatório Financeiro - ${format(startDate, "dd/MM/yyyy")} até ${format(endDate, "dd/MM/yyyy")}\n\n`;
    
    // Resumo
    csvContent += "RESUMO FINANCEIRO\n";
    csvContent += `Receita Total,${formatCurrency(financialSummary.total_revenue)}\n`;
    csvContent += `Despesas Totais,${formatCurrency(financialSummary.total_expenses)}\n`;
    csvContent += `Lucro,${formatCurrency(financialSummary.profit)}\n`;
    csvContent += `Cancelamentos,${financialSummary.canceled_appointments}\n`;
    csvContent += `Propostas Pendentes,${formatCurrency(financialSummary.pending_payments)}\n\n`;
    
    // Receitas
    csvContent += "RECEITAS\n";
    csvContent += "Data,Descrição,Valor,Método de Pagamento\n";
    financialSummary.income_transactions.forEach(t => {
      csvContent += `${format(new Date(t.transaction_date), "dd/MM/yyyy")},${t.description},${formatCurrency(t.amount)},${t.payment_method}\n`;
    });
    
    csvContent += "\n";
    
    // Despesas
    csvContent += "DESPESAS\n";
    csvContent += "Data,Descrição,Valor,Método de Pagamento\n";
    financialSummary.expense_transactions.forEach(t => {
      csvContent += `${format(new Date(t.transaction_date), "dd/MM/yyyy")},${t.description},${formatCurrency(t.amount)},${t.payment_method}\n`;
    });

    // Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportado com sucesso!",
      description: "O relatório foi exportado para Excel.",
    });
  };

  const exportToPDF = async () => {
    if (!financialSummary) return;

    const { startDate, endDate } = getDateRange();

    try {
      const { data, error } = await supabase.functions.invoke("generate-report-pdf", {
        body: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          summary: {
            total_revenue: financialSummary.total_revenue,
            total_expenses: financialSummary.total_expenses,
            profit: financialSummary.profit,
            canceled_appointments: financialSummary.canceled_appointments,
            pending_payments: financialSummary.pending_payments,
          },
          income_transactions: financialSummary.income_transactions,
          expense_transactions: financialSummary.expense_transactions,
          inactive_customers: inactiveCustomers.slice(0, 10),
        },
      });

      if (error) throw error;

      // O edge function retorna HTML base64, vamos abrir em nova janela para impressão
      const htmlContent = atob(data.pdf);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Aguardar carregar e então imprimir
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast({
        title: "PDF pronto para impressão!",
        description: "O relatório foi aberto em uma nova janela. Use Ctrl+P ou Cmd+P para salvar como PDF.",
      });
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">Relatórios Inteligentes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Insights e ações para o crescimento do seu negócio</p>
        </div>
        
        {/* Filtros e Exportação */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Botões de Exportação */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            disabled={!financialSummary}
            className="gap-2 flex-1 sm:flex-initial"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={!financialSummary}
            className="gap-2 flex-1 sm:flex-initial"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                <CalendarIcon className="w-4 h-4" />
                <span className="text-xs sm:text-sm truncate">{getFilterLabel()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <Label>Período</Label>
                  <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="custom">Período personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {dateFilter === "custom" && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="start-date">Data Inicial</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">Data Final</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-9">
              <SelectValue placeholder="Método de pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os métodos</SelectItem>
              <SelectItem value="money">Dinheiro</SelectItem>
              <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
              <SelectItem value="debit_card">Cartão de Débito</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="bank_transfer">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2">Geral</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs sm:text-sm px-2 py-2">Financeiro</TabsTrigger>
          <TabsTrigger value="services" className="text-xs sm:text-sm px-2 py-2">Serviços</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs sm:text-sm px-2 py-2">Estoque</TabsTrigger>
          <TabsTrigger value="inactive" className="text-xs sm:text-sm px-2 py-2">Clientes</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm px-2 py-2">Performance</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          {/* Comparação com Período Anterior */}
          {comparisonData && (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      <span className="text-xs sm:text-base">Receita vs Período Anterior</span>
                    </span>
                    {comparisonData.revenue_growth >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Período Atual</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">
                        {formatCurrency(comparisonData.current_revenue)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm text-muted-foreground">Período Anterior</p>
                      <p className="text-base sm:text-lg font-semibold text-muted-foreground">
                        {formatCurrency(comparisonData.previous_revenue)}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg ${
                    comparisonData.revenue_growth >= 0 
                      ? 'bg-accent/10 text-accent' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    <Percent className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-bold text-base sm:text-lg">
                      {comparisonData.revenue_growth >= 0 ? '+' : ''}
                      {comparisonData.revenue_growth.toFixed(1)}%
                    </span>
                    <span className="text-xs sm:text-sm">
                      {comparisonData.revenue_growth >= 0 ? 'de crescimento' : 'de queda'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                      <span className="text-xs sm:text-base">Agendamentos Concluídos</span>
                    </span>
                    {comparisonData.appointments_growth >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Período Atual</p>
                      <p className="text-xl sm:text-2xl font-bold text-accent">
                        {comparisonData.current_appointments}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm text-muted-foreground">Período Anterior</p>
                      <p className="text-base sm:text-lg font-semibold text-muted-foreground">
                        {comparisonData.previous_appointments}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg ${
                    comparisonData.appointments_growth >= 0 
                      ? 'bg-accent/10 text-accent' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    <Percent className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-bold text-base sm:text-lg">
                      {comparisonData.appointments_growth >= 0 ? '+' : ''}
                      {comparisonData.appointments_growth.toFixed(1)}%
                    </span>
                    <span className="text-xs sm:text-sm">
                      {comparisonData.appointments_growth >= 0 ? 'de crescimento' : 'de queda'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cards de Resumo */}
          {financialSummary && appointmentStats && (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total de Agendamentos</CardTitle>
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold">{appointmentStats.total_appointments}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {appointmentStats.completed} concluídos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-accent">
                    {appointmentStats.completion_rate.toFixed(1)}%
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {appointmentStats.completed} de {appointmentStats.total_appointments}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Taxa de Cancelamento</CardTitle>
                  <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-destructive">
                    {appointmentStats.cancellation_rate.toFixed(1)}%
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {appointmentStats.canceled} cancelados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Ticket Médio</CardTitle>
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {appointmentStats.completed > 0
                      ? formatCurrency(financialSummary.total_revenue / appointmentStats.completed)
                      : formatCurrency(0)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Por agendamento concluído
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Insights e Recomendações */}
          {financialSummary && appointmentStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Insights e Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appointmentStats.cancellation_rate > 20 && (
                    <div className="flex items-start gap-3 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Alta Taxa de Cancelamento</p>
                        <p className="text-sm text-muted-foreground">
                          {appointmentStats.cancellation_rate.toFixed(1)}% dos agendamentos estão sendo cancelados. 
                          Configure lembretes automáticos para reduzir este número.
                        </p>
                      </div>
                    </div>
                  )}

                  {comparisonData && comparisonData.revenue_growth < -10 && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <TrendingDown className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Queda na Receita</p>
                        <p className="text-sm text-muted-foreground">
                          Sua receita caiu {Math.abs(comparisonData.revenue_growth).toFixed(1)}% comparado ao período anterior. 
                          Revise sua estratégia de preços e considere campanhas promocionais.
                        </p>
                      </div>
                    </div>
                  )}

                  {comparisonData && comparisonData.revenue_growth >= 10 && (
                    <div className="flex items-start gap-3 p-4 bg-accent/5 rounded-lg border border-accent/20">
                      <TrendingUp className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Excelente Crescimento!</p>
                        <p className="text-sm text-muted-foreground">
                          Parabéns! Sua receita cresceu {comparisonData.revenue_growth.toFixed(1)}% comparado ao período anterior. 
                          Continue investindo nas estratégias que estão funcionando.
                        </p>
                      </div>
                    </div>
                  )}

                  {financialSummary.pending_payments > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Propostas Pendentes</p>
                        <p className="text-sm text-muted-foreground">
                          Você tem {formatCurrency(financialSummary.pending_payments)} em propostas aguardando resposta. 
                          Entre em contato com os clientes para converter essas propostas em vendas.
                        </p>
                      </div>
                    </div>
                  )}

                  {inactiveCustomers.length > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Clientes Inativos</p>
                        <p className="text-sm text-muted-foreground">
                          Você tem {inactiveCustomers.length} clientes inativos há mais de 60 dias. 
                          Envie mensagens personalizadas para reativá-los.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Serviços */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Ranking de Serviços
              </CardTitle>
              <CardDescription>
                Serviços mais solicitados e rentáveis no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serviceStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum serviço encontrado no período selecionado.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceStats.map((service, index) => (
                    <div
                      key={service.service_name}
                      className="flex items-center gap-4 p-4 bg-card rounded-lg border hover:shadow-md transition-shadow"
                    >
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${
                        index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600' :
                        index === 1 ? 'bg-gray-100 dark:bg-gray-800 text-gray-600' :
                        index === 2 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}º
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg truncate">{service.service_name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {service.total_appointments} agendamentos
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(service.total_revenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(service.total_revenue / service.total_appointments)}/serviço
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Serviços */}
          {serviceStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Receita por Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceStats.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="service_name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(Number(value))}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="total_revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Resumo Financeiro */}
        <TabsContent value="financial" className="space-y-4">
          {financialSummary ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Receita</CardTitle>
                    <TrendingUp className="w-4 h-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">
                      {formatCurrency(financialSummary.total_revenue)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {formatCurrency(financialSummary.total_expenses)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Lucro</CardTitle>
                    <DollarSign className="w-4 h-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${financialSummary.profit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {formatCurrency(financialSummary.profit)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Cancelamentos</CardTitle>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{financialSummary.canceled_appointments}</div>
                  </CardContent>
                </Card>
              </div>

              {financialSummary.total_revenue === 0 && financialSummary.total_expenses === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <DollarSign className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum dado financeiro encontrado</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-4">
                      Comece registrando suas transações na página de Financeiro para visualizar relatórios detalhados aqui.
                    </p>
                    <Button onClick={() => navigate("/financeiro")}>
                      Ir para Financeiro
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Próximos Passos Recomendados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {financialSummary.pending_payments > 0 && (
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">Propostas Pendentes</p>
                            <p className="text-sm text-muted-foreground">
                              Você tem {formatCurrency(financialSummary.pending_payments)} em propostas aguardando resposta. 
                              Entre em contato com os clientes para fechar essas vendas.
                            </p>
                          </div>
                        </div>
                      )}

                      {financialSummary.profit < 0 && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                          <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">Atenção ao Prejuízo</p>
                            <p className="text-sm text-muted-foreground">
                              Suas despesas estão superiores às receitas. Revise seus custos e considere ajustar preços.
                            </p>
                          </div>
                        </div>
                      )}

                      {financialSummary.canceled_appointments > 5 && (
                        <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">Taxa de Cancelamento Alta</p>
                            <p className="text-sm text-muted-foreground">
                              {financialSummary.canceled_appointments} cancelamentos nos últimos 30 dias. 
                              Considere enviar lembretes automáticos antes dos agendamentos.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de Transações */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Entradas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-accent">
                      <TrendingUp className="w-5 h-5" />
                      Entradas (30 dias)
                    </CardTitle>
                    <CardDescription>
                      Total: {formatCurrency(financialSummary.total_revenue)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {financialSummary.income_transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma entrada registrada
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {financialSummary.income_transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-start justify-between p-3 bg-accent/5 rounded-lg border"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {transaction.description || "Sem descrição"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {transaction.payment_method || "N/A"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(transaction.transaction_date), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-accent">
                                {formatCurrency(Number(transaction.amount))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Saídas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <TrendingDown className="w-5 h-5" />
                      Saídas (30 dias)
                    </CardTitle>
                    <CardDescription>
                      Total: {formatCurrency(financialSummary.total_expenses)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {financialSummary.expense_transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma saída registrada
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {financialSummary.expense_transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-start justify-between p-3 bg-destructive/5 rounded-lg border"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {transaction.description || "Sem descrição"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {transaction.payment_method || "N/A"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(transaction.transaction_date), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-destructive">
                                {formatCurrency(Number(transaction.amount))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* Relatório de Estoque */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Relatório de Estoque
                  </CardTitle>
                  <CardDescription>
                    Visualização do estoque atual por categoria e produto
                  </CardDescription>
                </div>
                <Select value={chartType} onValueChange={(value: "pie" | "bar") => setChartType(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pie">
                      <div className="flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4" />
                        Gráfico Pizza
                      </div>
                    </SelectItem>
                    <SelectItem value="bar">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Gráfico Barras
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {inventoryData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum item em estoque encontrado.</p>
                  <Button 
                    onClick={() => navigate("/estoque")} 
                    className="mt-4"
                    variant="outline"
                  >
                    Adicionar Itens ao Estoque
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Gráfico */}
                  <div className="h-[400px]">
                    {chartType === "pie" ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(() => {
                              const categoryMap = new Map<string, { value: number; cost: number }>();
                              inventoryData.forEach(item => {
                                const category = item.category || "Sem categoria";
                              const current = categoryMap.get(category) || { value: 0, cost: 0 };
                              categoryMap.set(category, {
                                value: current.value + item.current_stock,
                                cost: current.cost + (item.current_stock * (item.cost_price || 0))
                              });
                              });
                              return Array.from(categoryMap.entries()).map(([name, data]) => ({
                                name,
                                value: data.value,
                                cost: data.cost
                              }));
                            })()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {(() => {
                              const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
                              const categoryMap = new Map<string, { value: number; cost: number }>();
                              inventoryData.forEach(item => {
                                const category = item.category || "Sem categoria";
                                const current = categoryMap.get(category) || { value: 0, cost: 0 };
                                categoryMap.set(category, {
                                  value: current.value + item.current_stock,
                                  cost: current.cost + (item.current_stock * (item.cost_price || 0))
                                });
                              });
                              return Array.from(categoryMap.entries()).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ));
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number, name: string, props: any) => [
                              `${value} unidades (${formatCurrency(props.payload.cost)})`,
                              name
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(() => {
                            const categoryMap = new Map<string, { value: number; cost: number }>();
                            inventoryData.forEach(item => {
                              const category = item.category || "Sem categoria";
                              const current = categoryMap.get(category) || { value: 0, cost: 0 };
                              categoryMap.set(category, {
                                value: current.value + item.current_stock,
                                cost: current.cost + (item.current_stock * (item.cost_price || 0))
                              });
                            });
                            return Array.from(categoryMap.entries()).map(([name, data]) => ({
                              name,
                              quantity: data.value,
                              cost: data.cost
                            }));
                          })()}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="quantity" fill="hsl(var(--primary))" name="Quantidade" />
                          <Bar yAxisId="right" dataKey="cost" fill="hsl(var(--accent))" name="Valor Total" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Estatísticas */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Total de Itens
                        </div>
                        <div className="text-2xl font-bold">
                          {inventoryData.length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Qtd. Total em Estoque
                        </div>
                        <div className="text-2xl font-bold">
                          {inventoryData.reduce((sum, item) => sum + item.current_stock, 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Valor Total (Custo)
                        </div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(
                            inventoryData.reduce((sum, item) => 
                              sum + (item.current_stock * (item.cost_price || 0)), 0
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Alertas de estoque baixo */}
                  {inventoryData.some(item => item.current_stock <= item.min_quantity) && (
                    <Card className="border-destructive/50 bg-destructive/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="w-5 h-5" />
                          Itens com Estoque Baixo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {inventoryData
                            .filter(item => item.current_stock <= item.min_quantity)
                            .map(item => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.category || "Sem categoria"}
                                  </p>
                                </div>
                                <Badge variant="destructive">
                                  {item.current_stock} / {item.min_quantity}
                                </Badge>
                              </div>
                            ))
                          }
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clientes Inativos */}
        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Clientes Inativos há 60+ dias ({inactiveCustomers.length})
              </CardTitle>
              <CardDescription>
                Clientes que não retornam há mais de 60 dias - hora de reconquistar!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inactiveCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Ótimo! Nenhum cliente inativo encontrado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inactiveCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{customer.name}</p>
                          <Badge variant="outline">{customer.days_inactive} dias</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {customer.total_visits} visitas • {formatCurrency(customer.total_spent)} gasto total
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Última visita: {format(new Date(customer.last_visit), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleReactivateCustomer(customer)}
                        disabled={reactivating === customer.id}
                        className="gap-2"
                        size="sm"
                      >
                        {reactivating === customer.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4" />
                            Reativar
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance e Horários */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Horários de Maior Conversão
              </CardTitle>
              <CardDescription>
                Análise dos últimos 90 dias - horários com mais agendamentos e receita
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeSlotAnalysis.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Dados insuficientes para análise. Continue registrando agendamentos!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {timeSlotAnalysis.map((slot, idx) => (
                      <div
                        key={`${slot.day_of_week}-${slot.hour}`}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium capitalize">
                              {slot.day_of_week} às {String(slot.hour).padStart(2, '0')}:00
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {slot.appointment_count} agendamentos • {formatCurrency(slot.revenue)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {((slot.appointment_count / timeSlotAnalysis[0].appointment_count) * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {timeSlotAnalysis.length >= 2 && (
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Sugestão Automática
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Seus horários de maior movimento são{" "}
                        <strong className="text-foreground capitalize">
                          {timeSlotAnalysis[0].day_of_week} às {String(timeSlotAnalysis[0].hour).padStart(2, '0')}:00
                        </strong>{" "}
                        e{" "}
                         <strong className="text-foreground capitalize">
                          {timeSlotAnalysis[1]?.day_of_week} às {String(timeSlotAnalysis[1]?.hour).padStart(2, '0')}:00
                         </strong>
                        . Considere:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                        <li>Aumentar disponibilidade nesses horários</li>
                        <li>Oferecer promoções em horários menos movimentados</li>
                        <li>Alocar funcionários extras nos picos</li>
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;