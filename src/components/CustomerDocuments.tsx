import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Trash2, Upload, Plus, Eye, X, FileSpreadsheet, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomerDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  created_at: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  total_amount: number;
  final_amount: number;
  status: string;
  created_at: string;
  valid_until: string | null;
}

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
}

interface CustomerDocumentsProps {
  customerId: string;
}

export const CustomerDocuments = ({ customerId }: CustomerDocumentsProps) => {
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<CustomerDocument | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>("");
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
    fetchProposals();
    fetchAppointments();
  }, [customerId]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("customer_documents")
      .select("*")
      .eq("customer_id", customerId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
    setLoading(false);
  };

  const fetchProposals = async () => {
    setProposalsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("customer_id", customerId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProposals(data);
    }
    setProposalsLoading(false);
  };

  const fetchAppointments = async () => {
    setAppointmentsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("customer_id", customerId)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("start_time", { ascending: false });

    if (!error && data) {
      setAppointments(data);
    }
    setAppointmentsLoading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo para fazer upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Upload do arquivo para o storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${customerId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("customer-documents")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Salvar informações no banco
      const { error: dbError } = await supabase
        .from("customer_documents")
        .insert({
          user_id: user.id,
          customer_id: customerId,
          file_name: selectedFile.name,
          file_path: fileName,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          description: description || null,
        });

      if (dbError) throw dbError;

      toast({
        title: "Documento enviado!",
        description: "O documento foi adicionado com sucesso.",
      });

      setDialogOpen(false);
      setSelectedFile(null);
      setDescription("");
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar documento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (doc: CustomerDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("customer-documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setDocumentUrl(url);
      setViewingDocument(doc);
      setViewDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Erro ao visualizar documento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (doc: CustomerDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("customer-documents")
        .download(doc.file_path);

      if (error) throw error;

      // Criar URL e fazer download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Erro ao baixar documento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (doc: CustomerDocument) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    try {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from("customer-documents")
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Deletar do banco
      const { error: dbError } = await supabase
        .from("customer_documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Documento excluído",
        description: "O documento foi removido com sucesso.",
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir documento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isImageFile = (fileName: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const isPdfFile = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  const handleGenerateProposalPdf = async (proposalId: string) => {
    setGeneratingPdf(proposalId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-proposal-pdf", {
        body: { proposalId },
      });

      if (error) throw error;

      if (data?.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }

      toast({
        title: "PDF gerado!",
        description: "O orçamento foi gerado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleGenerateServiceDocument = async (appointmentId: string) => {
    setGeneratingPdf(appointmentId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-service-document", {
        body: { appointmentId },
      });

      if (error) throw error;

      if (data?.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }

      toast({
        title: "Documento gerado!",
        description: "O comprovante de serviço foi gerado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar documento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "outline" },
      accepted: { label: "Aceito", variant: "default" },
      rejected: { label: "Rejeitado", variant: "destructive" },
      expired: { label: "Expirado", variant: "secondary" },
      scheduled: { label: "Agendado", variant: "outline" },
      completed: { label: "Concluído", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    return statusMap[status] || { label: status, variant: "outline" };
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "outline" },
      paid: { label: "Pago", variant: "default" },
      failed: { label: "Falhou", variant: "destructive" },
      refunded: { label: "Reembolsado", variant: "secondary" },
    };
    return statusMap[status] || { label: status, variant: "outline" };
  };

  return (
    <>
      {/* Dialog de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => {
        setViewDialogOpen(open);
        if (!open) {
          URL.revokeObjectURL(documentUrl);
          setDocumentUrl("");
          setViewingDocument(null);
        }
      }}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{viewingDocument?.file_name}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewDialogOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
            {viewingDocument?.description && (
              <DialogDescription>{viewingDocument.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-muted/30 rounded-lg">
            {viewingDocument && documentUrl && (
              <>
                {isImageFile(viewingDocument.file_name) && (
                  <img
                    src={documentUrl}
                    alt={viewingDocument.file_name}
                    className="w-full h-full object-contain"
                  />
                )}
                {isPdfFile(viewingDocument.file_name) && (
                  <iframe
                    src={documentUrl}
                    className="w-full h-full"
                    title={viewingDocument.file_name}
                  />
                )}
                {!isImageFile(viewingDocument.file_name) && !isPdfFile(viewingDocument.file_name) && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Visualização não disponível para este tipo de arquivo
                      </p>
                      <Button onClick={() => viewingDocument && handleDownload(viewingDocument)}>
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Documento
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Principal */}
      <Card>
        <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base">Documentos e Histórico</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <Tabs defaultValue="attached" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="attached" className="text-xs sm:text-sm">Anexados</TabsTrigger>
              <TabsTrigger value="proposals" className="text-xs sm:text-sm">Orçamentos</TabsTrigger>
              <TabsTrigger value="services" className="text-xs sm:text-sm">Serviços</TabsTrigger>
            </TabsList>

            {/* Documentos Anexados */}
            <TabsContent value="attached" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Adicionar</span>
                    </Button>
                  </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Documento</DialogTitle>
                <DialogDescription>
                  Anexe contratos, documentos ou outros arquivos relevantes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Arquivo *</Label>
                  <div className="mt-2">
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo 10MB. Formatos: PDF, DOC, DOCX, JPG, PNG
                  </p>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o documento..."
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Documento
                    </>
                  )}
                </Button>
              </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {loading ? (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                  Carregando documentos...
                </p>
              ) : documents.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                  Nenhum documento anexado ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium break-all line-clamp-2 mb-0.5">
                            {doc.file_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                            <span className="font-medium">{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span>{format(new Date(doc.created_at), "dd/MM/yy", { locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                      {doc.description && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mb-2 px-9 sm:px-11">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(doc)}
                          className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                          title="Visualizar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc)}
                          className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                          title="Baixar"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(doc)}
                          className="h-7 sm:h-8 w-7 sm:w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Orçamentos */}
            <TabsContent value="proposals" className="mt-4">
              {proposalsLoading ? (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                  Carregando orçamentos...
                </p>
              ) : proposals.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                  Nenhum orçamento encontrado.
                </p>
              ) : (
                <div className="space-y-2">
                  {proposals.map((proposal) => {
                    const statusInfo = getStatusBadge(proposal.status);
                    return (
                      <div
                        key={proposal.id}
                        className="p-2 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-1.5 mb-1 flex-wrap">
                              <p className="text-xs sm:text-sm font-medium break-words flex-1 min-w-0">
                                {proposal.title}
                              </p>
                              <Badge variant={statusInfo.variant} className="text-[10px] sm:text-xs flex-shrink-0">
                                {statusInfo.label}
                              </Badge>
                            </div>
                            {proposal.description && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mb-2">
                                {proposal.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 text-[10px] sm:text-xs text-muted-foreground mb-2">
                              <span className="font-medium">R$ {proposal.final_amount.toFixed(2)}</span>
                              <span>•</span>
                              <span>{format(new Date(proposal.created_at), "dd/MM/yy", { locale: ptBR })}</span>
                              {proposal.valid_until && (
                                <>
                                  <span>•</span>
                                  <span>Válido: {format(new Date(proposal.valid_until), "dd/MM/yy", { locale: ptBR })}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateProposalPdf(proposal.id)}
                          disabled={generatingPdf === proposal.id}
                          className="h-7 sm:h-8 w-full text-xs gap-1.5"
                        >
                          <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {generatingPdf === proposal.id ? "Gerando..." : "Baixar PDF"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Serviços Realizados */}
            <TabsContent value="services" className="mt-4">
              {appointmentsLoading ? (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                  Carregando serviços...
                </p>
              ) : appointments.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                  Nenhum serviço realizado encontrado.
                </p>
              ) : (
                <div className="space-y-2">
                  {appointments.map((appointment) => {
                    const paymentInfo = getPaymentStatusBadge(appointment.payment_status);
                    return (
                      <div
                        key={appointment.id}
                        className="p-2 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-1.5 mb-1 flex-wrap">
                              <p className="text-xs sm:text-sm font-medium break-words flex-1 min-w-0">
                                {appointment.title}
                              </p>
                              <Badge variant={paymentInfo.variant} className="text-[10px] sm:text-xs flex-shrink-0">
                                {paymentInfo.label}
                              </Badge>
                            </div>
                            {appointment.description && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mb-2">
                                {appointment.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 text-[10px] sm:text-xs text-muted-foreground mb-2">
                              <span className="font-medium">R$ {appointment.price.toFixed(2)}</span>
                              <span>•</span>
                              <span>{format(new Date(appointment.start_time), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                              {appointment.payment_method && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{appointment.payment_method}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateServiceDocument(appointment.id)}
                          disabled={generatingPdf === appointment.id}
                          className="h-7 sm:h-8 w-full text-xs gap-1.5"
                        >
                          <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {generatingPdf === appointment.id ? "Gerando..." : "Baixar Comprovante"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
};
