import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, DollarSign, CheckCircle, ListTodo, Search, Eye, FileCheck, Receipt, Loader2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface CustomerHistoryProps {
  customerId: string;
}

interface HistoryEvent {
  id: string;
  type: "appointment" | "proposal" | "transaction" | "task" | "whatsapp";
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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState<any | null>(null);

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

      // 💬 Buscar conversas WhatsApp com resumo IA
      const { data: whatsappConversations } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("customer_id", customerId)
        .not("context->ai_summary", "is", null) // Apenas conversas com resumo gerado
        .order("last_message_at", { ascending: false });

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

      // 💬 Adicionar conversas WhatsApp
      whatsappConversations?.forEach(conv => {
        const aiSummary = conv.context?.ai_summary;
        if (aiSummary) {
          allEvents.push({
            id: conv.id,
            type: "whatsapp",
            title: `💬 Conversa WhatsApp - ${conv.whatsapp_name || conv.whatsapp_phone}`,
            description: aiSummary.summary || "Conversa registrada",
            date: conv.last_message_at,
            status: conv.status,
            icon: MessageCircle,
            color: "text-green-500",
            fullData: {
              ...conv,
              ai_summary: aiSummary,
            },
          });
        }
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
      // WhatsApp
      active: { label: "Ativo", variant: "default", className: "bg-green-500 hover:bg-green-600" },
      waiting_human: { label: "Aguardando Atendente", variant: "secondary" },
      closed: { label: "Encerrada", variant: "outline" },
      resolved: { label: "Resolvida", variant: "default", className: "bg-blue-500 hover:bg-blue-600" },
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
        title: "Proposta gerada!",
        description: "Abrindo em nova aba...",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a proposta.",
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
            <SelectItem value="proposal">Propostas</SelectItem>
            <SelectItem value="transaction">Transações</SelectItem>
            <SelectItem value="task">Tarefas</SelectItem>
            <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumo de Atividades */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Resumo de Atividades</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <Calendar className="w-4 h-4 text-blue-500 inline mr-1" />
            <span className="font-semibold">{events.filter(e => e.type === "appointment").length}</span>
            <span className="text-muted-foreground ml-1">Agendamentos</span>
          </div>
          <div>
            <FileText className="w-4 h-4 text-purple-500 inline mr-1" />
            <span className="font-semibold">{events.filter(e => e.type === "proposal").length}</span>
            <span className="text-muted-foreground ml-1">Propostas</span>
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
          <div>
            <MessageCircle className="w-4 h-4 text-green-500 inline mr-1" />
            <span className="font-semibold">{events.filter(e => e.type === "whatsapp").length}</span>
            <span className="text-muted-foreground ml-1">WhatsApp</span>
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
                    
                    {/* Botões de ação para propostas */}
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
                          Ver Proposta
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
                    
                    {/* Botão de ação para WhatsApp */}
                    {event.type === "whatsapp" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedWhatsApp(event.fullData)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalhes
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => navigate("/conversas-whatsapp")}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Ver Conversa Completa
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

      {/* Modal de Detalhes WhatsApp */}
      <Dialog open={!!selectedWhatsApp} onOpenChange={() => setSelectedWhatsApp(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Resumo da Conversa WhatsApp
            </DialogTitle>
          </DialogHeader>
          
          {selectedWhatsApp && (
            <div className="space-y-4">
              {/* Cabeçalho */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{selectedWhatsApp.whatsapp_name || selectedWhatsApp.whatsapp_phone}</h3>
                  {getStatusBadge("whatsapp", selectedWhatsApp.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedWhatsApp.last_message_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedWhatsApp.ai_summary.message_count} mensagens
                </p>
              </div>

              {/* Resultado da Conversa */}
              {selectedWhatsApp.ai_summary.conversation_outcome && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">📊 Resultado</h4>
                  <Badge variant="outline" className="text-sm">
                    {selectedWhatsApp.ai_summary.conversation_outcome.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </div>
              )}

              {/* Resumo */}
              <div>
                <h4 className="font-semibold text-sm mb-2">📝 Resumo</h4>
                <p className="text-sm bg-muted/30 p-3 rounded-md">
                  {selectedWhatsApp.ai_summary.summary}
                </p>
              </div>

              {/* Ações Tomadas */}
              {selectedWhatsApp.ai_summary.key_actions && selectedWhatsApp.ai_summary.key_actions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">✅ Ações Tomadas</h4>
                  <ul className="space-y-2">
                    {selectedWhatsApp.ai_summary.key_actions.map((action: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Necessidades do Cliente */}
              {selectedWhatsApp.ai_summary.customer_needs && selectedWhatsApp.ai_summary.customer_needs.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">🎯 Necessidades do Cliente</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedWhatsApp.ai_summary.customer_needs.map((need: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{need}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Pendências */}
              {selectedWhatsApp.ai_summary.pending_actions && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">⏳ Pendências</h4>
                  <p className="text-sm bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-900">
                    {selectedWhatsApp.ai_summary.pending_actions}
                  </p>
                </div>
              )}

              {/* Próximos Passos */}
              {selectedWhatsApp.ai_summary.next_steps && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">🚀 Próximos Passos</h4>
                  <p className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-900">
                    {selectedWhatsApp.ai_summary.next_steps}
                  </p>
                </div>
              )}

              {/* Botão Ver Conversa Completa */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    setSelectedWhatsApp(null);
                    navigate("/conversas-whatsapp");
                  }}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ver Conversa Completa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};