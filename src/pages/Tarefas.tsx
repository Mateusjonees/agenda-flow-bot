import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskList } from "@/components/TaskList";
import { ListTodo, CheckCircle2, Clock, XCircle } from "lucide-react";

const Tarefas = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    overdue: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchStats = async () => {
    const now = new Date().toISOString();

    const { count: pendingCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "in_progress"]);

    const { count: completedCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    const { count: overdueCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("due_date", now);

    setStats({
      pending: pendingCount || 0,
      completed: completedCount || 0,
      overdue: overdueCount || 0,
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tarefas</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas tarefas e atividades automatizadas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                <CardTitle>Tarefas de Hoje</CardTitle>
              </div>
              <CardDescription>
                Tarefas com vencimento para hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList showAll={false} maxItems={50} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                <CardTitle>Todas as Tarefas</CardTitle>
              </div>
              <CardDescription>
                Todas as tarefas pendentes e em progresso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList showAll={true} maxItems={100} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Tarefas Automáticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground mb-4">
              O sistema gera tarefas automaticamente baseado em eventos:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                <span><strong>Pós-venda:</strong> 24h após cada agendamento concluído</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                <span><strong>Follow-up de proposta:</strong> 48h após envio sem resposta</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                <span><strong>Cobrança:</strong> Quando Pix expira sem pagamento</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                <span><strong>Reativação:</strong> Clientes inativos há mais de 60 dias</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tarefas;
