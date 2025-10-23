import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, CheckCircle2, TrendingUp } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Stats {
  todayAppointments: number;
  weekAppointments: number;
  totalCustomers: number;
  completedToday: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    todayAppointments: 0,
    weekAppointments: 0,
    totalCustomers: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao SmartAgenda+</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">
              Sistema completo de gestão para pequenos negócios com automação inteligente.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Agenda inteligente com controle de horários
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Gestão completa de clientes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Controle de status de pagamentos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Dashboard com métricas em tempo real
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground mb-4">
              Configure seu negócio e comece a agendar!
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Configure seu negócio</p>
                  <p className="text-sm text-muted-foreground">Defina horários e informações</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Adicione seus clientes</p>
                  <p className="text-sm text-muted-foreground">Cadastre seus clientes ativos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Crie agendamentos</p>
                  <p className="text-sm text-muted-foreground">Comece a organizar sua agenda</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
