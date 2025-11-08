import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, DollarSign, CheckCircle, ListTodo, Search, Eye, FileCheck, Receipt, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface CustomerHistoryProps {
  customerId: string;
}

interface HistoryEvent {
  id: string;
  type: "appointment" | "proposal" | "transaction" | "task";
  title: string;
  description?: string;
  date: string;
  status?: string;
  amount?: number;
  icon: any;
  color: string;
  fullData?: any; // Dados completos para ações
}

export const CustomerHistory = ({ customerId }: CustomerHistoryProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [generating, setGenerating] = useState<string | null>(null);

  // Usar useQuery para gerenciar o histórico com cache e atualização automática
  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: ["customer-history", customerId],
    queryFn: async () => {
    try {
      // Buscar agendamentos
      const { data: appointments } = await supabase
        .from("appointments")
        .select("*")
        .eq("customer_id", customerId)
        .order("start_time", { ascending: false });

      // Buscar propostas
      const { data: proposals } = await supabase
        .from("proposals")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      // Buscar transações relacionadas aos agendamentos deste cliente
      const appointmentIds = appointments?.map(a => a.id) || [];
      const { data: transactions } = appointmentIds.length > 0
        ? await supabase
            .from("financial_transactions")
            .select("*")
            .in("appointment_id", appointmentIds)
            .order("transaction_date", { ascending: false })
        : { data: [] };

      // Buscar tarefas
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("metadata->>customer_id", customerId)
        .order("created_at", { ascending: false });

      // Combinar e ordenar todos os eventos
      const allEvents: HistoryEvent[] = [];

      // Adicionar agendamentos
      appointments?.forEach(apt => {
        allEvents.push({
          id: apt.id,
          type: "appointment",
          title: apt.title,
          description: apt.notes,
          date: apt.start_time,
          status: apt.status,
          icon: Calendar,
          color: "text-blue-500",
          fullData: apt,
        });
      });

      // Adicionar propostas
      proposals?.forEach(prop => {
        allEvents.push({
          id: prop.id,
          type: "proposal",
          title: prop.title,
          description: prop.description,
          date: prop.created_at,
          status: prop.status,
          amount: prop.final_amount,
          icon: FileText,
          color: "text-purple-500",
          fullData: prop,
        });
      });

      // Adicionar transações
      transactions?.forEach(trans => {
        allEvents.push({
          id: trans.id,
          type: "transaction",
          title: trans.description || "Transação",
          date: trans.transaction_date,
          status: trans.status,
          amount: trans.amount,
          icon: DollarSign,
          color: trans.type === "income" ? "text-green-500" : "text-red-500",
        });
      });

      // Adicionar tarefas
      tasks?.forEach(task => {
        allEvents.push({
          id: task.id,
          type: "task",
          title: task.title,
          description: task.description,
          date: task.created_at,
          status: task.status,
          icon: ListTodo,
          color: "text-orange-500",
        });
      });

      // Ordenar por data (mais recente primeiro)
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return allEvents;
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return [];
    }
    },
  });

  const getStatusBadge = (type: string, status?: string) => {
    if (!status) return null;

    const statusConfig: Record<string, { label: string; variant: any; className?: string }> = {
      // Agendamentos
      scheduled: { label: "Agendado", variant: "secondary" },
      completed: { label: "Concluído", variant: "default", className: "bg-green-500 hover:bg-green-600" },
      cancelled: { label: "Cancelado", variant: "destructive" },
      // Propostas
      pending: { label: "Pendente", variant: "secondary" },
      sent: { label: "Enviada", variant: "default" },
      confirmed: { label: "Confirmada", variant: "default" },
      rejected: { label: "Recusada", variant: "destructive" },
      // Transações
      paid: { label: "Pago", variant: "default" },
      // Tarefas
      pending_task: { label: "Pendente", variant: "secondary" },
      completed_task: { label: "Concluída", variant: "default" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleViewProposalPdf = async (proposalId: string) => {
    setGenerating(`proposal-${proposalId}`);
    try {
      const { data, error } = await supabase.functions.invoke("generate-proposal-pdf", {
        body: { proposalId },
      });

      if (error) throw error;

      const blob = new Blob([data], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast({
        title: "Orçamento gerado!",
        description: "Abrindo em nova aba...",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o orçamento.",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleViewServiceDocument = async (appointmentId: string, documentType: "contract" | "receipt") => {
    setGenerating(`service-${documentType}-${appointmentId}`);
    try {
      const { data, error } = await supabase.functions.invoke("generate-service-document", {
        body: { appointmentId, documentType },
      });

      if (error) throw error;

      const blob = new Blob([data], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast({
        title: "Documento gerado!",
        description: `${documentType === "contract" ? "Contrato" : "Comprovante"} de serviço aberto em nova aba.`,
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o documento.",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  // Filtrar eventos
  const filteredEvents = events.filter((event) => {
    // Filtro por tipo
    if (filterType !== "all" && event.type !== filterType) {
      return false;
    }

    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        event.title.toLowerCase().includes(searchLower) ||
        (event.description?.toLowerCase() || "").includes(searchLower)
      );
    }

    return true;
  });

  if (loading) {
    return <div className="text-center py-6 text-muted-foreground">Carregando histórico...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no histórico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="appointment">Agendamentos</SelectItem>
            <SelectItem value="proposal">Orçamentos</SelectItem>
            <SelectItem value="transaction">Transações</SelectItem>
            <SelectItem value="task">Tarefas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumo de Atividades */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Resumo de Atividades</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <Calendar className="w-4 h-4 text-blue-500 inline mr-1" />
            <span className="font-semibold">{events.filter(e => e.type === "appointment").length}</span>
            <span className="text-muted-foreground ml-1">Agendamentos</span>
          </div>
          <div>
            <FileText className="w-4 h-4 text-purple-500 inline mr-1" />
            <span className="font-semibold">{events.filter(e => e.type === "proposal").length}</span>
            <span className="text-muted-foreground ml-1">Orçamentos</span>
          </div>
          <div>
            <DollarSign className="w-4 h-4 text-green-500 inline mr-1" />
            <span className="font-semibold">{events.filter(e => e.type === "transaction" && e.amount).length}</span>
            <span className="text-muted-foreground ml-1">Transações</span>
          </div>
          <div>
            <ListTodo className="w-4 h-4 text-orange-500 inline mr-1" />
            <span className="font-semibold">{events.filter(e => e.type === "task").length}</span>
            <span className="text-muted-foreground ml-1">Tarefas</span>
          </div>
        </div>
      </div>

      {/* Lista de eventos */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || filterType !== "all" 
              ? "Nenhum evento encontrado com esses filtros" 
              : "Nenhum evento no histórico."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const Icon = event.icon;
            return (
              <Card key={`${event.type}-${event.id}`} className="hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`p-2 rounded-lg bg-muted/50`}>
                        <Icon className={`w-4 h-4 ${event.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{event.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(event.type, event.status)}
                      {event.amount && (
                        <span className={`text-sm font-bold ${event.color}`}>
                          {formatCurrency(event.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {(event.description || event.type === "proposal" || (event.type === "appointment" && event.status === "completed")) && (
                  <CardContent className="pt-0 space-y-3">
                    {event.description && (
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                        {event.description}
                      </p>
                    )}
                    
                    {/* Botões de ação para orçamentos */}
                    {event.type === "proposal" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewProposalPdf(event.id)}
                          disabled={generating === `proposal-${event.id}`}
                          className="gap-2"
                        >
                          {generating === `proposal-${event.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          Ver Orçamento
                        </Button>
                      </div>
                    )}
                    
                    {/* Botões de ação para serviços concluídos */}
                    {event.type === "appointment" && event.status === "completed" && (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewServiceDocument(event.id, "contract")}
                          disabled={generating === `service-contract-${event.id}`}
                          className="gap-2"
                        >
                          {generating === `service-contract-${event.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileCheck className="w-4 h-4" />
                          )}
                          Contrato
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewServiceDocument(event.id, "receipt")}
                          disabled={generating === `service-receipt-${event.id}`}
                          className="gap-2"
                        >
                          {generating === `service-receipt-${event.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Receipt className="w-4 h-4" />
                          )}
                          Comprovante
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};