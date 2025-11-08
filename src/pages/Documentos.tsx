import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, Mail, Download, Search, Calendar, User, 
  FileCheck, Receipt, Clock, CheckCircle, XCircle, Loader2,
  Send, Eye, Filter, TrendingUp, Package
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DocumentHistory {
  id: string;
  document_type: string;
  related_type: string;
  related_id: string;
  recipient_email: string | null;
  recipient_name: string;
  status: string;
  error_message: string | null;
  created_at: string;
  metadata: any;
}

interface Proposal {
  id: string;
  title: string;
  customers: { name: string; email: string };
  final_amount: number;
}

interface Subscription {
  id: string;
  customers: { name: string; email: string };
  subscription_plans: { name: string; price: number };
}

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  price: number;
  start_time: string;
  customers: { name: string; email: string };
}

const Documentos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentHistory[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("history");
  const [sending, setSending] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [docsRes, proposalsRes, subsRes, apptsRes] = await Promise.all([
      supabase
        .from("document_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("proposals")
        .select(`
          id,
          title,
          final_amount,
          customers (name, email)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("subscriptions")
        .select(`
          id,
          customers (name, email),
          subscription_plans (name, price)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select(`
          id,
          title,
          description,
          price,
          start_time,
          customers (name, email)
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("start_time", { ascending: false }),
    ]);

    if (docsRes.data) setDocuments(docsRes.data as any);
    if (proposalsRes.data) setProposals(proposalsRes.data as any);
    if (subsRes.data) setSubscriptions(subsRes.data as any);
    if (apptsRes.data) setAppointments(apptsRes.data as any);
    
    setLoading(false);
  };

  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    if (filterType !== "all") {
      filtered = filtered.filter(d => d.document_type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(d => d.status === filterStatus);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(d => 
        d.recipient_name.toLowerCase().includes(term) ||
        (d.recipient_email && d.recipient_email.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [documents, filterType, filterStatus, searchTerm]);

  const stats = useMemo(() => ({
    total: documents.length,
    sent: documents.filter(d => d.status === "sent").length,
    failed: documents.filter(d => d.status === "failed").length,
    proposals: documents.filter(d => d.related_type === "proposal").length,
    subscriptions: documents.filter(d => d.related_type === "subscription").length,
    appointments: documents.filter(d => d.related_type === "appointment").length,
  }), [documents]);

  const handleSendProposalPdf = async (proposalId: string) => {
    setSending(`proposal-pdf-${proposalId}`);
    try {
      const { data, error } = await supabase.functions.invoke("generate-proposal-pdf", {
        body: { proposalId },
      });

      if (error) throw error;

      const blob = new Blob([data], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Registrar no histórico
      const proposal = proposals.find(p => p.id === proposalId);
      if (proposal) {
        await supabase.from("document_history").insert({
          document_type: "proposal_pdf",
          related_type: "proposal",
          related_id: proposalId,
          recipient_name: proposal.customers.name,
          status: "sent",
        } as any);
      }

      toast({
        title: "PDF gerado!",
        description: "Abrindo em nova aba...",
      });
      
      fetchData();
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const handleSendProposalEmail = async (proposalId: string) => {
    setSending(`proposal-email-${proposalId}`);
    try {
      const { error } = await supabase.functions.invoke("send-proposal", {
        body: { proposalId },
      });

      if (error) throw error;

      // Registrar no histórico
      const proposal = proposals.find(p => p.id === proposalId);
      if (proposal) {
        await supabase.from("document_history").insert({
          document_type: "proposal_email",
          related_type: "proposal",
          related_id: proposalId,
          recipient_email: proposal.customers.email,
          recipient_name: proposal.customers.name,
          status: "sent",
        } as any);
      }

      toast({
        title: "Email enviado!",
        description: "Orçamento enviado por email com sucesso.",
      });
      
      fetchData();
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email.",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const handleViewAppointmentDocument = async (appointmentId: string, documentType: "contract" | "receipt") => {
    setSending(`appointment-view-${documentType}-${appointmentId}`);
    try {
      toast({
        title: "Em desenvolvimento",
        description: `A visualização de ${documentType === "contract" ? "contrato" : "comprovante"} de serviço será implementada em breve.`,
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível visualizar o documento.",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const handleViewSubscriptionDocument = async (subscriptionId: string, documentType: "contract" | "receipt") => {
    setSending(`subscription-view-${documentType}-${subscriptionId}`);
    try {
      const { data, error } = await supabase.functions.invoke("generate-subscription-document", {
        body: { subscriptionId, documentType },
      });

      if (error) throw error;

      const blob = new Blob([data], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast({
        title: "Documento gerado!",
        description: `${documentType === "contract" ? "Contrato" : "Comprovante"} aberto em nova aba.`,
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível visualizar o documento.",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const handleSendSubscriptionDocument = async (subscriptionId: string, documentType: "contract" | "receipt") => {
    setSending(`subscription-${documentType}-${subscriptionId}`);
    try {
      const { error } = await supabase.functions.invoke("send-subscription-document", {
        body: { subscriptionId, documentType },
      });

      if (error) throw error;

      // Registrar no histórico
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (subscription) {
        await supabase.from("document_history").insert({
          document_type: documentType,
          related_type: "subscription",
          related_id: subscriptionId,
          recipient_email: subscription.customers.email,
          recipient_name: subscription.customers.name,
          status: "sent",
        } as any);
      }

      toast({
        title: "Documento enviado!",
        description: `${documentType === "contract" ? "Contrato" : "Comprovante"} enviado por email com sucesso.`,
      });
      
      fetchData();
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o documento.",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      proposal_pdf: "PDF Orçamento",
      proposal_email: "Email Orçamento",
      contract: "Contrato",
      receipt: "Comprovante",
      service_contract: "Contrato Serviço",
      service_receipt: "Comprovante Serviço",
    };
    return labels[type] || type;
  };

  const getDocumentTypeIcon = (type: string) => {
    if (type.includes("pdf")) return Download;
    if (type.includes("email")) return Mail;
    if (type === "contract") return FileCheck;
    if (type === "receipt") return Receipt;
    return FileText;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      sent: { label: "Enviado", variant: "default", icon: CheckCircle },
      failed: { label: "Falhou", variant: "destructive", icon: XCircle },
      pending: { label: "Pendente", variant: "secondary", icon: Clock },
    };
    const config = variants[status] || { label: status, variant: "outline", icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Premium */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="relative p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1 w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg sm:shadow-xl flex-shrink-0">
                <Package className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                  Documentos
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
                  Gerencie envios de orçamentos, contratos e comprovantes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Documentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">Com sucesso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Erros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proposals}</div>
            <p className="text-xs text-muted-foreground">Enviados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
            <Receipt className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriptions}</div>
            <p className="text-xs text-muted-foreground">Documentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointments}</div>
            <p className="text-xs text-muted-foreground">Documentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="send-proposal">Enviar Orçamento</TabsTrigger>
          <TabsTrigger value="send-subscription">Assinaturas</TabsTrigger>
          <TabsTrigger value="send-service">Serviços</TabsTrigger>
        </TabsList>

        {/* Histórico */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Tipo de Documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="proposal_pdf">PDF Orçamento</SelectItem>
                    <SelectItem value="proposal_email">Email Orçamento</SelectItem>
                    <SelectItem value="contract">Contrato Assinatura</SelectItem>
                    <SelectItem value="receipt">Comprovante Assinatura</SelectItem>
                    <SelectItem value="service_contract">Contrato Serviço</SelectItem>
                    <SelectItem value="service_receipt">Comprovante Serviço</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="sent">Enviados</SelectItem>
                    <SelectItem value="failed">Falhas</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    {searchTerm || filterType !== "all" || filterStatus !== "all"
                      ? "Nenhum documento encontrado com esses filtros"
                      : "Nenhum documento enviado ainda"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => {
                    const Icon = getDocumentTypeIcon(doc.document_type);
                    return (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">
                                    {getDocumentTypeLabel(doc.document_type)}
                                  </span>
                                  {getStatusBadge(doc.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  <User className="w-3 h-3 inline mr-1" />
                                  {doc.recipient_name}
                                  {doc.recipient_email && ` • ${doc.recipient_email}`}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                                {doc.error_message && (
                                  <p className="text-xs text-destructive mt-2">
                                    Erro: {doc.error_message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enviar Orçamento */}
        <TabsContent value="send-proposal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Orçamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {proposals.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-4">
                    Nenhum orçamento disponível
                  </p>
                  <Button onClick={() => navigate("/propostas")}>
                    Criar Orçamento
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {proposals.map((proposal) => (
                    <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{proposal.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              <User className="w-3 h-3 inline mr-1" />
                              {proposal.customers.name}
                            </p>
                            <p className="text-lg font-bold text-primary mt-2">
                              {formatCurrency(proposal.final_amount)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPreviewData({ type: 'proposal', data: proposal });
                                setPreviewOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendProposalPdf(proposal.id)}
                              disabled={sending === `proposal-pdf-${proposal.id}`}
                              title="Visualizar Orçamento"
                            >
                              {sending === `proposal-pdf-${proposal.id}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enviar Contrato/Comprovante */}
        <TabsContent value="send-subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Contratos e Comprovantes</CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-4">
                    Nenhuma assinatura disponível
                  </p>
                  <Button onClick={() => navigate("/assinaturas")}>
                    Gerenciar Assinaturas
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((subscription) => (
                    <Card key={subscription.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">
                              {subscription.subscription_plans?.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              <User className="w-3 h-3 inline mr-1" />
                              {subscription.customers?.name}
                            </p>
                            <p className="text-lg font-bold text-primary mt-2">
                              {formatCurrency(subscription.subscription_plans?.price || 0)}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPreviewData({ type: 'subscription', data: subscription });
                                setPreviewOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewSubscriptionDocument(subscription.id, "contract")}
                              disabled={sending === `subscription-view-contract-${subscription.id}`}
                              title="Visualizar Contrato"
                            >
                              {sending === `subscription-view-contract-${subscription.id}` ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <FileCheck className="w-4 h-4 mr-2" />
                              )}
                              Contrato
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewSubscriptionDocument(subscription.id, "receipt")}
                              disabled={sending === `subscription-view-receipt-${subscription.id}`}
                              title="Visualizar Comprovante"
                            >
                              {sending === `subscription-view-receipt-${subscription.id}` ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Receipt className="w-4 h-4 mr-2" />
                              )}
                              Comprovante
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enviar Serviços */}
        <TabsContent value="send-service" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Documentos de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-4">
                    Nenhum serviço completado disponível
                  </p>
                  <Button onClick={() => navigate("/agendamentos")}>
                    Ver Agendamentos
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{appointment.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              <User className="w-3 h-3 inline mr-1" />
                              {appointment.customers?.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {format(new Date(appointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            <p className="text-lg font-bold text-primary mt-2">
                              {formatCurrency(appointment.price)}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPreviewData({ type: 'appointment', data: appointment });
                                setPreviewOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewAppointmentDocument(appointment.id, "contract")}
                              disabled={sending === `appointment-view-contract-${appointment.id}`}
                              title="Visualizar Contrato de Serviço"
                            >
                              {sending === `appointment-view-contract-${appointment.id}` ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <FileCheck className="w-4 h-4 mr-2" />
                              )}
                              Contrato
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewAppointmentDocument(appointment.id, "receipt")}
                              disabled={sending === `appointment-view-receipt-${appointment.id}`}
                              title="Visualizar Comprovante de Serviço"
                            >
                              {sending === `appointment-view-receipt-${appointment.id}` ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Receipt className="w-4 h-4 mr-2" />
                              )}
                              Comprovante
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Documento</DialogTitle>
            <DialogDescription>
              Visualize o documento antes de enviar
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              {previewData.type === 'proposal' && (
                <>
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold">{previewData.data.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cliente: {previewData.data.customers.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: {previewData.data.customers.email}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Valor do Orçamento:</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(previewData.data.final_amount)}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Este documento será enviado para o email do cliente com todos os detalhes do orçamento.
                    </p>
                  </div>
                </>
              )}
              {previewData.type === 'subscription' && (
                <>
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold">
                      {previewData.data.subscription_plans?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cliente: {previewData.data.customers?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: {previewData.data.customers?.email}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Valor da Assinatura:</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(previewData.data.subscription_plans?.price || 0)}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Você pode enviar o contrato ou comprovante desta assinatura para o cliente.
                    </p>
                  </div>
                </>
              )}
              {previewData.type === 'appointment' && (
                <>
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold">{previewData.data.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cliente: {previewData.data.customers?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: {previewData.data.customers?.email}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Data: {format(new Date(previewData.data.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Valor do Serviço:</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(previewData.data.price)}
                    </p>
                    {previewData.data.description && (
                      <div className="mt-4">
                        <p className="font-semibold mb-2">Descrição:</p>
                        <p className="text-sm text-muted-foreground">
                          {previewData.data.description}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Você pode gerar o contrato ou comprovante deste serviço para o cliente.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documentos;
