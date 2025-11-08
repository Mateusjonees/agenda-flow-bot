import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TaskList } from "@/components/TaskList";
import { ListTodo, CheckCircle2, Clock, XCircle, Plus, Search, CalendarIcon, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Tarefas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    overdue: 0,
  });
  const [typeStats, setTypeStats] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    related_entity_id: "",
    priority: "medium",
    status: "pending",
    type: "manual",
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
    fetchCustomers();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchStats = async () => {
    const now = new Date().toISOString();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count: pendingCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["pending", "in_progress"]);

    const { count: completedCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed");

    const { count: overdueCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lt("due_date", now);

    // Buscar estatísticas por tipo
    const { data: typeData } = await supabase
      .from("tasks")
      .select("type")
      .eq("user_id", user.id)
      .in("status", ["pending", "in_progress"]);

    const typeCounts: Record<string, number> = {};
    typeData?.forEach((task) => {
      typeCounts[task.type] = (typeCounts[task.type] || 0) + 1;
    });

    setStats({
      pending: pendingCount || 0,
      completed: completedCount || 0,
      overdue: overdueCount || 0,
    });
    setTypeStats(typeCounts);
  };

  // Atualizar estatísticas quando mudar de aba
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, name")
      .order("name");
    
    if (data) {
      setCustomers(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.due_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a data de vencimento",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .insert({
          user_id: session.user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          due_date: new Date(formData.due_date).toISOString(),
          priority: formData.priority,
          status: formData.status,
          type: formData.type,
          related_entity_type: formData.related_entity_id ? "customer" : null,
          related_entity_id: formData.related_entity_id || null,
        });

      if (error) {
        console.error("Erro ao criar tarefa:", error);
        toast({
          title: "Erro ao criar tarefa",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tarefa criada com sucesso!",
        });
        setOpen(false);
        setFormData({
          title: "",
          description: "",
          due_date: "",
          related_entity_id: "",
          priority: "medium",
          status: "pending",
          type: "manual",
        });
        fetchStats();
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      toast({
        title: "Erro ao criar tarefa",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      manual: "Manual",
      post_sale: "Pós-venda",
      followup: "Follow-up",
      payment: "Pagamento",
      reactivation: "Reativação",
      restock: "Reposição",
      preparation: "Preparação",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      manual: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      post_sale: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      followup: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      payment: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      reactivation: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      restock: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
      preparation: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    };
    return colors[type] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Tarefas+
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {stats.pending} {stats.pending === 1 ? 'tarefa pendente' : 'tarefas pendentes'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
              <DialogDescription>
                Adicione uma nova tarefa manual ao sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento *</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Responsável (Cliente)</Label>
                <Select
                  value={formData.related_entity_id}
                  onValueChange={(value) => setFormData({ ...formData, related_entity_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Categoria</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="post_sale">Pós-venda</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="payment">Pagamento</SelectItem>
                    <SelectItem value="reactivation">Reativação</SelectItem>
                    <SelectItem value="restock">Reposição</SelectItem>
                    <SelectItem value="preparation">Preparação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Tarefa</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium">
                Data Inicial
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium">
                Data Final
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm font-medium">
                Status
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-filter" className="h-10">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority-filter" className="text-sm font-medium">
                Prioridade
              </Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger id="priority-filter" className="h-10">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">Pendentes</CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">aguardando conclusão</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-destructive bg-gradient-to-br from-destructive/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">Atrasadas</CardTitle>
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground mt-1">necessitam atenção</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">Concluídas</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">finalizadas com sucesso</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros por Categoria */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtrar por Categoria</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedType === null ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 text-sm hover:scale-105 transition-transform"
              onClick={() => setSelectedType(null)}
            >
              Todas ({stats.pending})
            </Badge>
            {Object.entries(typeStats)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <Badge
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 text-sm hover:scale-105 transition-transform ${
                    selectedType === type ? "" : getTypeColor(type)
                  }`}
                  onClick={() => setSelectedType(type)}
                >
                  {getTypeLabel(type)} ({count})
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
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
              <TaskList 
                key={`today-${selectedType}-${selectedStatus}-${selectedPriority}-${startDate?.toISOString()}-${endDate?.toISOString()}`}
                showAll={false} 
                maxItems={50} 
                searchQuery={searchQuery} 
                selectedType={selectedType} 
                selectedPriority={selectedPriority} 
                selectedStatus={selectedStatus}
                startDate={startDate}
                endDate={endDate}
              />
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
              <TaskList 
                key={`all-${selectedType}-${selectedStatus}-${selectedPriority}-${startDate?.toISOString()}-${endDate?.toISOString()}`}
                showAll={true} 
                maxItems={100} 
                searchQuery={searchQuery} 
                selectedType={selectedType} 
                selectedPriority={selectedPriority} 
                selectedStatus={selectedStatus}
                startDate={startDate}
                endDate={endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <CardTitle>Histórico de Tarefas</CardTitle>
              </div>
              <CardDescription>
                Tarefas concluídas e canceladas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList 
                key={`history-${selectedType}-${selectedStatus}-${selectedPriority}-${startDate?.toISOString()}-${endDate?.toISOString()}`}
                showCompleted={true} 
                maxItems={100} 
                searchQuery={searchQuery} 
                selectedType={selectedType} 
                selectedPriority={selectedPriority} 
                selectedStatus={selectedStatus}
                startDate={startDate}
                endDate={endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Sugestões de Follow-up e Marketing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground mb-4">
              O sistema gera sugestões automáticas de ações de relacionamento:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                <span><strong>Follow-up pós-venda:</strong> Contato 24h após atendimento para avaliar satisfação</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                <span><strong>Acompanhamento de orçamento:</strong> Lembrete 48h após envio sem resposta</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                <span><strong>Reativação de clientes:</strong> Sugestão de contato para clientes inativos há mais de 60 dias</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                <span><strong>Marketing programado:</strong> Lembretes para campanhas e promoções</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tarefas;
