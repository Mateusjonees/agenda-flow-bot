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
  FileText, Search, Calendar, User, 
  CheckCircle, XCircle, Loader2, Eye, Package
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

const Documentos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentHistory[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("send-proposal");
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

    const [docsRes, proposalsRes] = await Promise.all([
      supabase
        .from("document_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("related_type", "proposal")
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
    ]);

    if (docsRes.data) setDocuments(docsRes.data as any);
    if (proposalsRes.data) setProposals(proposalsRes.data as any);
    
    setLoading(false);
  };

  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

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
  }, [documents, filterStatus, searchTerm]);

  const stats = useMemo(() => ({
    total: documents.length,
    sent: documents.filter(d => d.status === "sent").length,
    failed: documents.filter(d => d.status === "failed").length,
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "destructive" | "outline"; label: string }> = {
      sent: { variant: "default", label: "Enviado" },
      failed: { variant: "destructive", label: "Falha" },
      pending: { variant: "outline", label: "Pendente" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
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
                  Gerencie e envie orçamentos para seus clientes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Documentos enviados</p>
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
            <p className="text-xs text-muted-foreground">Erros no envio</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send-proposal">Enviar Orçamento</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

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
                    {searchTerm || filterStatus !== "all"
                      ? "Nenhum documento encontrado com esses filtros"
                      : "Nenhum documento enviado ainda"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">Orçamento PDF</span>
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview do Orçamento</DialogTitle>
            <DialogDescription>
              Visualização rápida das informações do orçamento
            </DialogDescription>
          </DialogHeader>
          {previewData?.type === 'proposal' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <p className="text-base">{previewData.data.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Cliente</label>
                <p className="text-base">{previewData.data.customers.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-base">{previewData.data.customers.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Valor Total</label>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(previewData.data.final_amount)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documentos;
