import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReadOnly } from "@/components/SubscriptionGuard";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, FileText, Send, Eye, Check, X, Clock, Loader2, Edit, Trash2, Filter, CheckCircle, XCircle, Calendar as CalendarIcon, User, DollarSign, Sparkles, Search, ChevronsUpDown, HelpCircle, Package, Percent, Calendar, UserCheck, Download, Mail, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ProposalViewDialog } from "@/components/ProposalViewDialog";
import { ProposalEditDialog } from "@/components/ProposalEditDialog";
import { ProposalConfirmDialog } from "@/components/ProposalConfirmDialog";
import { ScheduleAppointmentDialog } from "@/components/ScheduleAppointmentDialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Proposal {
  id: string;
  customer_id: string;
  customers: {
    name: string;
    phone: string;
  };
  title: string;
  description: string | null;
  final_amount: number;
  deposit_amount: number | null;
  status: string;
  valid_until: string;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  appointment_id: string | null;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Service {
  description: string;
  quantity: number;
  unit_price: number;
}

const Propostas = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null);
  const [editProposal, setEditProposal] = useState<Proposal | null>(null);
  const [confirmProposal, setConfirmProposal] = useState<Proposal | null>(null);
  const [scheduleProposal, setScheduleProposal] = useState<Proposal | null>(null);
  const [deleteProposalId, setDeleteProposalId] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const { toast } = useToast();
  const { isReadOnly } = useReadOnly();

  // Filtros e tabs
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCustomer, setFilterCustomer] = useState<string>("all");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

  const [newProposal, setNewProposal] = useState({
    customer_id: "",
    title: "",
    description: "",
    services: [{ description: "", quantity: 1, unit_price: 0 }] as Service[],
    discount_percentage: 0,
    deposit_percentage: 50,
    valid_days: 7,
  });

  // Aplicar filtros usando useMemo para melhor performance e resposta imediata
  const filteredProposals = useMemo(() => {
    let filtered = [...proposals];

    // Filtro por tab (status)
    if (activeTab !== "all") {
      filtered = filtered.filter(p => p.status === activeTab);
    }

    // Filtro por cliente
    if (filterCustomer !== "all") {
      filtered = filtered.filter(p => p.customer_id === filterCustomer);
    }

    // Filtro por busca (título ou nome do cliente)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(term) || 
        p.customers.name.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [proposals, activeTab, filterCustomer, searchTerm]);

  // Estatísticas por status - calculado a partir das propostas filtradas e não filtradas
  const stats = useMemo(() => ({
    all: proposals.length,
    pending: proposals.filter(p => p.status === "pending").length,
    sent: proposals.filter(p => p.status === "sent").length,
    accepted: proposals.filter(p => p.status === "accepted").length,
    confirmed: proposals.filter(p => p.status === "confirmed").length,
    canceled: proposals.filter(p => p.status === "canceled").length,
    expired: proposals.filter(p => p.status === "expired").length,
  }), [proposals]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [proposalsRes, customersRes] = await Promise.all([
      supabase
        .from("proposals")
        .select(`
          *,
          customers (name, phone)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .order("name"),
    ]);

    if (!proposalsRes.error && proposalsRes.data) {
      setProposals(proposalsRes.data as any);
    }
    if (!customersRes.error && customersRes.data) {
      setCustomers(customersRes.data);
    }
    setLoading(false);
  };

  const calculateTotal = () => {
    const subtotal = newProposal.services.reduce(
      (sum, s) => sum + s.quantity * s.unit_price,
      0
    );
    const discount = (subtotal * newProposal.discount_percentage) / 100;
    return subtotal - discount;
  };

  const handleCreateProposal = async () => {
    if (!newProposal.customer_id || !newProposal.title || newProposal.services.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos necessários.",
        variant: "destructive",
      });
      return;
    }

    // Validar se todos os serviços têm descrição, quantidade e preço
    const invalidServices = newProposal.services.filter(
      s => !s.description.trim() || s.quantity <= 0 || s.unit_price <= 0
    );

    if (invalidServices.length > 0) {
      toast({
        title: "Serviços incompletos",
        description: "Todos os serviços precisam ter descrição, quantidade e preço válidos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const totalAmount = calculateTotal();
      const depositAmount = (totalAmount * newProposal.deposit_percentage) / 100;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + newProposal.valid_days);

      const { error } = await supabase.from("proposals").insert([{
        user_id: user.id,
        customer_id: newProposal.customer_id,
        title: newProposal.title,
        description: newProposal.description || null,
        items: newProposal.services as any,
        total_amount: totalAmount,
        discount: (totalAmount * newProposal.discount_percentage) / 100,
        final_amount: totalAmount,
        valid_until: validUntil.toISOString(),
        status: "pending",
      }]);

      if (error) throw error;

      toast({
        title: "Proposta criada com sucesso!",
        description: "Você pode enviá-la ao cliente agora.",
      });
      
      setDialogOpen(false);
      setNewProposal({
        customer_id: "",
        title: "",
        description: "",
        services: [{ description: "", quantity: 1, unit_price: 0 }],
        discount_percentage: 0,
        deposit_percentage: 50,
        valid_days: 7,
      });
      
      await fetchData();
    } catch (error: any) {
      console.error("Erro ao criar proposta:", error);
      toast({
        title: "Erro ao criar proposta",
        description: error.message || "Não foi possível criar a proposta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendProposal = async (proposalId: string) => {
    try {
      // Primeiro, baixar o PDF automaticamente
      await handleDownloadProposal(proposalId);
      
      // Aguardar um momento para o download iniciar
      await new Promise(resolve => setTimeout(resolve, 800));

      // Buscar dados da proposta
      const { data: proposal, error } = await supabase
        .from("proposals")
        .select(`
          *,
          customers (
            name,
            email,
            phone
          )
        `)
        .eq("id", proposalId)
        .single();

      if (error || !proposal) {
        throw new Error("Proposta não encontrada");
      }

      const proposalData = proposal as any; // Cast temporário para acessar todos os campos

      if (!proposalData.customers?.email) {
        toast({
          title: "Email não encontrado",
          description: "O cliente não possui email cadastrado.",
          variant: "destructive",
        });
        return;
      }

      // Buscar nome do negócio
      const { data: userData } = await supabase.auth.getUser();
      const { data: businessData } = await supabase
        .from("business_settings")
        .select("business_name")
        .eq("user_id", userData.user?.id)
        .single();

      const businessName = businessData?.business_name || "Sua Empresa";

      // Gerar link para visualizar proposta online
      const proposalUrl = `${window.location.origin}/view-proposal?id=${proposalId}`;

      // Montar corpo do email
      const emailBody = `
Olá ${proposalData.customers.name},

Segue proposta para sua análise:

📋 ${proposalData.title}
💰 Valor: ${formatCurrency(proposalData.final_amount)}
${proposalData.deposit_amount ? `💳 Sinal: ${formatCurrency(proposalData.deposit_amount)}\n` : ''}
⏰ Válido até: ${format(new Date(proposalData.valid_until), "dd/MM/yyyy")}

Para visualizar os detalhes completos:
🔗 ${proposalUrl}

Caso tenha dúvidas, estou à disposição!

Atenciosamente,
${businessName}
      `.trim();

      // Abrir cliente de email com dados preenchidos
      const mailtoLink = `mailto:${proposalData.customers.email}?subject=${encodeURIComponent(`Proposta: ${proposalData.title}`)}&body=${encodeURIComponent(emailBody)}`;
      
      window.open(mailtoLink, '_blank');

      toast({
        title: "PDF baixado e email aberto! 📧",
        description: "Anexe o PDF baixado e envie o email.",
      });
      
    } catch (error: any) {
      console.error("Erro ao preparar email:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível abrir o cliente de email.",
        variant: "destructive",
      });
    }
  };

  const handleSendWhatsApp = async (proposalId: string) => {
    try {
      // Primeiro, baixar o PDF automaticamente
      await handleDownloadProposal(proposalId);
      
      // Aguardar um momento para o download iniciar
      await new Promise(resolve => setTimeout(resolve, 800));

      // Buscar dados da proposta
      const { data: proposal, error } = await supabase
        .from("proposals")
        .select(`
          *,
          customers (
            name,
            email,
            phone
          )
        `)
        .eq("id", proposalId)
        .single();

      if (error || !proposal) {
        throw new Error("Proposta não encontrada");
      }

      const proposalData = proposal as any;

      if (!proposalData.customers?.phone) {
        toast({
          title: "Telefone não encontrado",
          description: "O cliente não possui telefone cadastrado.",
          variant: "destructive",
        });
        return;
      }

      // Buscar nome do negócio
      const { data: userData } = await supabase.auth.getUser();
      const { data: businessData } = await supabase
        .from("business_settings")
        .select("business_name")
        .eq("user_id", userData.user?.id)
        .single();

      const businessName = businessData?.business_name || "Sua Empresa";

      // Gerar link para visualizar proposta online
      const proposalUrl = `${window.location.origin}/view-proposal?id=${proposalId}`;

      // Limpar telefone (remover caracteres especiais)
      const cleanPhone = proposalData.customers.phone.replace(/\D/g, '');

      // Montar mensagem do WhatsApp
      const whatsappMessage = `
Olá ${proposalData.customers.name}! 👋

Segue a proposta solicitada:

📋 *${proposalData.title}*
💰 Valor: *${formatCurrency(proposalData.final_amount)}*
${proposalData.deposit_amount ? `💳 Sinal: *${formatCurrency(proposalData.deposit_amount)}*\n` : ''}
⏰ Válido até: ${format(new Date(proposalData.valid_until), "dd/MM/yyyy")}

Para visualizar os detalhes completos, acesse:
🔗 ${proposalUrl}

Qualquer dúvida, estou à disposição! 😊

_${businessName}_
      `.trim();

      // Abrir WhatsApp
      const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappLink, '_blank');

      toast({
        title: "PDF baixado e WhatsApp aberto! 💚",
        description: "Anexe o PDF baixado e envie a mensagem.",
      });
      
    } catch (error: any) {
      console.error("Erro ao preparar WhatsApp:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível abrir o WhatsApp.",
        variant: "destructive",
      });
    }
  };

  const handleCancelProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from("proposals")
        .update({ status: "canceled" })
        .eq("id", proposalId);

      if (error) throw error;
      
      toast({
        title: "Proposta cancelada!",
        description: "O status foi atualizado com sucesso.",
      });
      await fetchData();
    } catch (error) {
      console.error("Erro ao cancelar proposta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a proposta.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProposal = async () => {
    if (!deleteProposalId) return;

    const { error } = await supabase
      .from("proposals")
      .delete()
      .eq("id", deleteProposalId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a proposta.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Proposta excluída!",
      });
      fetchData();
    }
    setDeleteProposalId(null);
  };

  const handleDownloadProposal = async (proposalId: string) => {
    setDownloadingPdf(proposalId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-proposal-pdf", {
        body: { proposalId },
      });

      if (error) throw error;

      // Criar blob com HTML e abrir em nova aba
      const blob = new Blob([data], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      
      if (win) {
        setTimeout(() => {
          win.focus();
        }, 500);
      }

      toast({
        title: "PDF gerado!",
        description: "Abrindo em nova aba...",
      });
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF da proposta.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(null);
    }
  };

  const addService = () => {
    setNewProposal({
      ...newProposal,
      services: [...newProposal.services, { description: "", quantity: 1, unit_price: 0 }],
    });
  };

  const updateService = (index: number, field: keyof Service, value: any) => {
    const updated = [...newProposal.services];
    updated[index] = { ...updated[index], [field]: value };
    setNewProposal({ ...newProposal, services: updated });
  };

  const removeService = (index: number) => {
    if (newProposal.services.length > 1) {
      setNewProposal({
        ...newProposal,
        services: newProposal.services.filter((_, i) => i !== index),
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      sent: { label: "Enviada", variant: "default" },
      viewed: { label: "Visualizada", variant: "outline" },
      accepted: { label: "Aceita", variant: "default" },
      rejected: { label: "Recusada", variant: "destructive" },
      expired: { label: "Expirada", variant: "destructive" },
      confirmed: { label: "Confirmada", variant: "default" },
      canceled: { label: "Cancelada", variant: "destructive" },
      paused: { label: "Pausada", variant: "outline" },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-red-50 dark:bg-muted/30" />
        <div className="relative p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500 dark:bg-gradient-to-br dark:from-primary dark:via-secondary dark:to-accent shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Propostas
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Crie e gerencie propostas profissionais
              </p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto" disabled={isReadOnly}>
                <Plus className="w-4 h-4" />
                Nova Proposta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Criar Nova Proposta
                </DialogTitle>
                <DialogDescription>
                  Preencha cuidadosamente todos os campos marcados com (*) para criar uma proposta profissional
                </DialogDescription>
              </DialogHeader>
              
              <TooltipProvider>
                <div className="space-y-6">
                  {/* Seção 1: Cliente */}
                  <div className="space-y-3 p-4 bg-accent/5 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">1. Informações do Cliente</h3>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="font-medium">Cliente *</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Selecione o cliente que receberá esta proposta. O cliente precisa estar cadastrado no sistema.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={customerSearchOpen}
                            className="w-full justify-between h-11"
                          >
                            {newProposal.customer_id
                              ? customers.find((customer) => customer.id === newProposal.customer_id)?.name
                              : "Clique para selecionar o cliente..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Digite o nome do cliente..." />
                            <CommandList>
                              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                              <CommandGroup>
                                {customers.map((customer) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={customer.name}
                                    onSelect={() => {
                                      setNewProposal({ ...newProposal, customer_id: customer.id });
                                      setCustomerSearchOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        newProposal.customer_id === customer.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {customer.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Este será o destinatário da proposta
                      </p>
                    </div>
                  </div>

                  {/* Seção 2: Detalhes da Proposta */}
                  <div className="space-y-3 p-4 bg-accent/5 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">2. Detalhes da Proposta</h3>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="font-medium">Título da Proposta *</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Um nome curto e descritivo para identificar facilmente esta proposta.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        value={newProposal.title}
                        onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                        placeholder="Ex: Instalação de Ar Condicionado, Manutenção Elétrica..."
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Use um título claro que descreva o trabalho a ser realizado
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="font-medium">Descrição (Opcional)</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Informações complementares sobre o serviço, condições, observações importantes, etc.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Textarea
                        value={newProposal.description}
                        onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                        placeholder="Ex: Instalação completa incluindo suporte e configuração. Garantia de 1 ano. Material de primeira linha..."
                        rows={3}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Adicione detalhes adicionais, condições de pagamento, garantias, etc.
                      </p>
                    </div>
                  </div>

                  {/* Seção 3: Serviços */}
                  <div className="space-y-3 p-4 bg-accent/5 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm">3. Serviços / Itens *</h3>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Liste todos os serviços ou produtos que farão parte desta proposta. Você pode adicionar múltiplos itens.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addService} className="gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Item
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {newProposal.services.map((service, idx) => (
                        <div key={idx} className="space-y-2 p-3 bg-background rounded-md border">
                          <div className="flex gap-2 items-start">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Descrição do Serviço/Produto</Label>
                              <Input
                                placeholder="Ex: Instalação de ar split 12000 BTUs, Mão de obra..."
                                value={service.description}
                                onChange={(e) => updateService(idx, "description", e.target.value)}
                                className="h-10"
                              />
                            </div>
                            {newProposal.services.length > 1 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeService(idx)}
                                    className="mt-5 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Remover este item</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Quantidade</Label>
                              <Input
                                type="number"
                                placeholder="Ex: 1, 2, 5..."
                                min="1"
                                value={service.quantity}
                                onChange={(e) => updateService(idx, "quantity", parseInt(e.target.value) || 1)}
                                className="h-10"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Preço Unitário (R$)</Label>
                              <Input
                                type="number"
                                placeholder="Ex: 150.00"
                                min="0"
                                step="0.01"
                                value={service.unit_price}
                                onChange={(e) => updateService(idx, "unit_price", parseFloat(e.target.value) || 0)}
                                className="h-10"
                              />
                            </div>
                          </div>
                          {service.quantity > 0 && service.unit_price > 0 && (
                            <div className="text-xs text-muted-foreground pt-1 border-t">
                              Subtotal deste item: <span className="font-semibold text-foreground">{formatCurrency(service.quantity * service.unit_price)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O valor total será calculado automaticamente (quantidade × preço unitário)
                    </p>
                  </div>

                  {/* Seção 4: Condições */}
                  <div className="space-y-3 p-4 bg-accent/5 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">4. Condições Comerciais</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Label className="font-medium text-sm">Desconto (%)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Desconto percentual sobre o valor total dos serviços. Ex: 10% de desconto</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={newProposal.discount_percentage}
                            onChange={(e) => setNewProposal({ ...newProposal, discount_percentage: parseInt(e.target.value) || 0 })}
                            className="pl-9 h-11"
                            placeholder="0"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Opcional (0-100%)
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Label className="font-medium text-sm">Entrada/Sinal (%)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Percentual do valor total que será pago como entrada/sinal. Ex: 50% de entrada</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={newProposal.deposit_percentage}
                            onChange={(e) => setNewProposal({ ...newProposal, deposit_percentage: parseInt(e.target.value) || 0 })}
                            className="pl-9 h-11"
                            placeholder="50"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Padrão: 50%
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Label className="font-medium text-sm">Validade (dias)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Por quantos dias esta proposta será válida? Após esse período, expirará automaticamente.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="1"
                            value={newProposal.valid_days}
                            onChange={(e) => setNewProposal({ ...newProposal, valid_days: parseInt(e.target.value) || 7 })}
                            className="pl-9 h-11"
                            placeholder="7"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Padrão: 7 dias
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Seção 5: Resumo */}
                  <div className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border-2 border-primary/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-base">Resumo da Proposta</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Valor dos Serviços:</span>
                        <span className="font-medium">
                          {formatCurrency(newProposal.services.reduce((sum, s) => sum + s.quantity * s.unit_price, 0))}
                        </span>
                      </div>
                      
                      {newProposal.discount_percentage > 0 && (
                        <div className="flex justify-between items-center text-sm text-orange-600">
                          <span>Desconto ({newProposal.discount_percentage}%):</span>
                          <span className="font-medium">
                            - {formatCurrency((newProposal.services.reduce((sum, s) => sum + s.quantity * s.unit_price, 0) * newProposal.discount_percentage) / 100)}
                          </span>
                        </div>
                      )}
                      
                      <div className="h-px bg-border" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Valor Total:</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                      </div>
                      
                      {newProposal.deposit_percentage > 0 && (
                        <>
                          <div className="h-px bg-border" />
                          <div className="flex justify-between items-center text-sm bg-accent/30 -mx-3 px-3 py-2 rounded">
                            <span className="font-medium">Entrada/Sinal ({newProposal.deposit_percentage}%):</span>
                            <span className="font-bold text-primary">
                              {formatCurrency((calculateTotal() * newProposal.deposit_percentage) / 100)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Saldo Restante:</span>
                            <span className="font-medium">
                              {formatCurrency(calculateTotal() - (calculateTotal() * newProposal.deposit_percentage) / 100)}
                            </span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>Válido por {newProposal.valid_days} {newProposal.valid_days === 1 ? 'dia' : 'dias'}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateProposal} 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:scale-[1.02] transition-all"
                    disabled={loading || !newProposal.customer_id || !newProposal.title || newProposal.services.some(s => !s.description || s.quantity <= 0 || s.unit_price <= 0) || isReadOnly}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 mr-2" />
                        Criar Proposta
                      </>
                    )}
                  </Button>
                </div>
              </TooltipProvider>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barra de Filtros */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Todos os Clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs por Status */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 h-auto p-1 gap-1 overflow-x-auto">
          <TabsTrigger value="all" className="flex flex-col gap-1 py-2 sm:py-3 text-xs sm:text-sm">
            <span className="font-semibold">Todos</span>
            <Badge variant="outline" className="text-[10px] sm:text-xs">{stats.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex flex-col gap-1 py-2 sm:py-3 text-xs sm:text-sm">
            <span className="font-semibold">Pendente</span>
            <Badge variant="outline" className="text-[10px] sm:text-xs">{stats.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex flex-col gap-1 py-2 sm:py-3 text-xs sm:text-sm">
            <span className="font-semibold">Enviada</span>
            <Badge variant="outline" className="text-[10px] sm:text-xs">{stats.sent}</Badge>
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex flex-col gap-1 py-2 sm:py-3 text-xs sm:text-sm">
            <span className="font-semibold">Aceita</span>
            <Badge variant="outline" className="text-[10px] sm:text-xs">{stats.accepted}</Badge>
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex flex-col gap-1 py-2 sm:py-3 text-xs sm:text-sm hidden sm:flex">
            <span className="font-semibold">Confirmada</span>
            <Badge variant="outline" className="text-[10px] sm:text-xs">{stats.confirmed}</Badge>
          </TabsTrigger>
          <TabsTrigger value="canceled" className="flex flex-col gap-1 py-2 sm:py-3 text-xs sm:text-sm hidden sm:flex">
            <span className="font-semibold">Cancelada</span>
            <Badge variant="outline" className="text-[10px] sm:text-xs">{stats.canceled}</Badge>
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex flex-col gap-1 py-2 sm:py-3 text-xs sm:text-sm hidden sm:flex">
            <span className="font-semibold">Expirada</span>
            <Badge variant="outline" className="text-[10px] sm:text-xs">{stats.expired}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo das Tabs */}
        {["all", "pending", "sent", "accepted", "confirmed", "canceled", "expired"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-accent rounded-full animate-spin" 
                       style={{ animationDelay: '150ms' }} />
                </div>
                <p className="text-lg font-medium text-muted-foreground animate-pulse">Carregando...</p>
              </div>
            ) : filteredProposals.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <FileText className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">Nenhuma proposta encontrada</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchTerm || filterCustomer !== "all" 
                      ? "Tente ajustar os filtros para encontrar o que procura" 
                      : "Crie sua primeira proposta para começar"
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProposals.map((proposal, index) => (
                  <Card 
                    key={proposal.id}
                    className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in pointer-events-auto"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
              {/* Gradient animado de fundo */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    {/* Barra de status superior */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r ${
                      proposal.status === "confirmed" ? "from-accent to-green-500" :
                      proposal.status === "canceled" ? "from-destructive to-red-600" :
                      proposal.status === "accepted" ? "from-blue-500 to-purple-500" :
                      "from-yellow-500 to-orange-500"
                    }`} />
                    
                    <CardHeader className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 p-3 sm:p-6">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-accent shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <h3 className="font-bold text-base sm:text-xl line-clamp-1 group-hover:text-primary transition-colors">
                              {proposal.title}
                            </h3>
                          </div>
                          
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                            <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span 
                              className="font-medium truncate cursor-pointer hover:text-primary transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/clientes?customer=${proposal.customer_id}&tab=info`);
                              }}
                            >
                              {proposal.customers.name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {getStatusBadge(proposal.status)}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                      {/* Valor com destaque */}
                      <div 
                        className="relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors"
                      >
                        <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Valor Total</p>
                        <p className="text-xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          {formatCurrency(proposal.final_amount)}
                        </p>
                        {proposal.deposit_amount && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                            Entrada: {formatCurrency(proposal.deposit_amount)}
                          </p>
                        )}
                      </div>
                      
                      {/* Informações adicionais */}
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            Validade
                          </span>
                          <span className="font-medium">
                            {format(new Date(proposal.valid_until), "dd/MM/yyyy")}
                          </span>
                        </div>
                        
                        {proposal.sent_at && (
                          <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-muted/50">
                            <span className="text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                              Enviada
                            </span>
                            <span className="font-medium">
                              {format(new Date(proposal.sent_at), "dd/MM/yyyy")}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Botões de ação principais */}
                      <div className="flex gap-1.5 sm:gap-2 pt-1 sm:pt-2 relative z-20">
                        {(proposal.status === "pending" || proposal.status === "sent" || proposal.status === "accepted") && (
                          <>
                            <Button 
                              type="button"
                              size="sm" 
                              className="flex-1 gap-1.5 sm:gap-2 bg-gradient-to-r from-accent to-green-500 hover:shadow-lg transition-all relative z-30 pointer-events-auto text-xs sm:text-sm h-8 sm:h-9"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setConfirmProposal(proposal);
                              }}
                            >
                              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden xs:inline">Confirmar</span>
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              className="flex-1 gap-1.5 sm:gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all relative z-30 pointer-events-auto text-xs sm:text-sm h-8 sm:h-9"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleCancelProposal(proposal.id);
                              }}
                            >
                              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden xs:inline">Cancelar</span>
                            </Button>
                          </>
                        )}
                        
                        {(proposal.status === "accepted" || proposal.status === "confirmed") && !proposal.appointment_id && (
                          <Button 
                            type="button"
                            size="sm" 
                            className="w-full gap-1.5 sm:gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all relative z-30 pointer-events-auto text-xs sm:text-sm h-8 sm:h-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setScheduleProposal(proposal);
                            }}
                          >
                            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">Agendar</span>
                          </Button>
                        )}
                        
                        {proposal.status === "confirmed" && proposal.appointment_id && (
                          <Button 
                            type="button"
                            size="sm" 
                            variant="outline"
                            className="w-full gap-1.5 sm:gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all relative z-30 pointer-events-auto text-xs sm:text-sm h-8 sm:h-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              navigate("/agendamentos");
                            }}
                          >
                            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">Ver Agendamento</span>
                          </Button>
                        )}
                        
                        {proposal.status === "canceled" && (
                          <div className="w-full text-center text-xs sm:text-sm text-muted-foreground py-1.5 sm:py-2">
                            Proposta cancelada
                          </div>
                        )}
                      </div>

                      {/* Botões de ações secundárias */}
                      <div className="flex gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t relative z-20">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="flex-1 gap-1.5 sm:gap-2 relative z-30 pointer-events-auto text-xs sm:text-sm h-8 sm:h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setViewProposal(proposal);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Ver</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="flex-1 gap-1.5 sm:gap-2 relative z-30 pointer-events-auto text-xs sm:text-sm h-8 sm:h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDownloadProposal(proposal.id);
                          }}
                          disabled={downloadingPdf === proposal.id}
                        >
                          {downloadingPdf === proposal.id ? (
                            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          )}
                          <span className="hidden xs:inline">PDF</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="flex-1 gap-1.5 sm:gap-2 relative z-30 pointer-events-auto text-xs sm:text-sm h-8 sm:h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setEditProposal(proposal);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Editar</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 sm:gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 relative z-30 pointer-events-auto text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setDeleteProposalId(proposal.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </CardContent>
                    
              {/* Indicador de hover inferior */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 pointer-events-none" />
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ProposalViewDialog
        proposal={viewProposal}
        open={!!viewProposal}
        onOpenChange={(open) => !open && setViewProposal(null)}
        onScheduleAppointment={(proposal) => {
          setViewProposal(null);
          setScheduleProposal(proposal);
        }}
        onDownloadPdf={handleDownloadProposal}
      />

      <ScheduleAppointmentDialog
        proposal={scheduleProposal}
        open={!!scheduleProposal}
        onOpenChange={(open) => !open && setScheduleProposal(null)}
        onSuccess={fetchData}
      />

      <ProposalEditDialog
        proposal={editProposal}
        open={!!editProposal}
        onOpenChange={(open) => !open && setEditProposal(null)}
        onSuccess={fetchData}
        customers={customers}
      />

      <ProposalConfirmDialog
        proposal={confirmProposal}
        open={!!confirmProposal}
        onOpenChange={(open) => !open && setConfirmProposal(null)}
        onSuccess={fetchData}
      />

      <AlertDialog open={!!deleteProposalId} onOpenChange={(open) => !open && setDeleteProposalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProposal} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Propostas;
