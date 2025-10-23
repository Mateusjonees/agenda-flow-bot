import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CheckCircle2, TrendingUp, ListTodo, Plus, Clock, DollarSign, Package } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TaskList } from "@/components/TaskList";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

interface Stats {
  todayAppointments: number;
  weekAppointments: number;
  totalCustomers: number;
  completedToday: number;
}

type Appointment = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  customers?: {
    name: string;
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    todayAppointments: 0,
    weekAppointments: 0,
    totalCustomers: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  // Buscar agendamentos de hoje
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["today-appointments"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          customers(name)
        `)
        .eq("user_id", user.id)
        .gte("start_time", todayStart.toISOString())
        .lte("start_time", todayEnd.toISOString())
        .order("start_time");

      if (error) throw error;
      return data as Appointment[];
    },
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);

      // Today's appointments
      const { count: todayCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("start_time", todayStart.toISOString())
        .lte("start_time", todayEnd.toISOString());

      // This week's appointments
      const { count: weekCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("start_time", weekStart.toISOString())
        .lte("start_time", weekEnd.toISOString());

      // Total customers
      const { count: customersCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Completed today
      const { count: completedCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("start_time", todayStart.toISOString())
        .lte("start_time", todayEnd.toISOString());

      setStats({
        todayAppointments: todayCount || 0,
        weekAppointments: weekCount || 0,
        totalCustomers: customersCount || 0,
        completedToday: completedCount || 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Agendamentos Hoje",
      value: stats.todayAppointments,
      icon: Calendar,
      gradient: "from-primary to-primary-hover",
    },
    {
      title: "Agendamentos Semana",
      value: stats.weekAppointments,
      icon: TrendingUp,
      gradient: "from-primary to-primary-hover",
    },
    {
      title: "Total de Clientes",
      value: stats.totalCustomers,
      icon: Users,
      gradient: "from-accent to-green-500",
    },
    {
      title: "Concluídos Hoje",
      value: stats.completedToday,
      icon: CheckCircle2,
      gradient: "from-accent to-green-500",
    },
  ];

  const quickActions = [
    {
      title: "Novo Agendamento",
      icon: Calendar,
      color: "from-primary to-primary-hover",
      action: () => navigate("/agendamentos"),
    },
    {
      title: "Novo Cliente",
      icon: Users,
      color: "from-accent to-green-500",
      action: () => navigate("/clientes"),
    },
    {
      title: "Movimentação Financeira",
      icon: DollarSign,
      color: "from-blue-500 to-blue-600",
      action: () => navigate("/financeiro"),
    },
    {
      title: "Registrar Estoque",
      icon: Package,
      color: "from-purple-500 to-purple-600",
      action: () => navigate("/estoque"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {loading ? "-" : stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all"
                  onClick={action.action}
                >
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${action.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center">{action.title}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agendamentos de Hoje */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Agendamentos de Hoje</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/agendamentos")}>
              Ver Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum agendamento para hoje
            </p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{apt.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.customers?.name}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {format(parseISO(apt.start_time), "HH:mm")} - {format(parseISO(apt.end_time), "HH:mm")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarefas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              <CardTitle>Tarefas Pendentes</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/tarefas")}>
              Ver Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TaskList maxItems={5} />
        </CardContent>
      </Card>

    </div>
  );
};

export default Dashboard;
