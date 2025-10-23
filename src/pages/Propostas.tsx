import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, FileText, Send, Eye, Check, X, Clock, Loader2, Edit, Pause, Trash2, Filter, CheckCircle, XCircle, Calendar as CalendarIcon, User, DollarSign, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ProposalViewDialog } from "@/components/ProposalViewDialog";
import { ProposalEditDialog } from "@/components/ProposalEditDialog";
import { ProposalConfirmDialog } from "@/components/ProposalConfirmDialog";

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
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null);
  const [editProposal, setEditProposal] = useState<Proposal | null>(null);
  const [confirmProposal, setConfirmProposal] = useState<Proposal | null>(null);
  const [deleteProposalId, setDeleteProposalId] = useState<string | null>(null);
  const [lastEmailSent, setLastEmailSent] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCustomer, setFilterCustomer] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const [newProposal, setNewProposal] = useState({
    customer_id: "",
    title: "",
    description: "",
    services: [{ description: "", quantity: 1, unit_price: 0 }] as Service[],
    discount_percentage: 0,
    deposit_percentage: 50,
    valid_days: 7,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Aplicar filtros
    let filtered = [...proposals];

    if (filterStatus !== "all") {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    if (filterCustomer !== "all") {
      filtered = filtered.filter(p => p.customer_id === filterCustomer);
    }

    setFilteredProposals(filtered);
  }, [proposals, filterStatus, filterCustomer]);

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const totalAmount = calculateTotal();
    const depositAmount = (totalAmount * newProposal.deposit_percentage) / 100;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + newProposal.valid_days);

    const { error } = await supabase.from("proposals").insert([{
      user_id: user.id,
      customer_id: newProposal.customer_id,
      title: newProposal.title,
      description: newProposal.description || null,
      services: newProposal.services as any,
      total_amount: totalAmount,
      discount_percentage: newProposal.discount_percentage,
      final_amount: totalAmount,
      deposit_percentage: newProposal.deposit_percentage,
      deposit_amount: depositAmount,
      valid_until: validUntil.toISOString(),
      status: "pending",
    }]);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a proposta.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Proposta criada!",
        description: "A proposta foi criada com sucesso.",
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
      fetchData();
    }
  };

  const handleSendProposal = async (proposalId: string) => {
    const now = Date.now();
    const lastSent = lastEmailSent[proposalId] || 0;
    const tenMinutesInMs = 10 * 60 * 1000;
    
    if (now - lastSent < tenMinutesInMs) {
      const remainingMinutes = Math.ceil((tenMinutesInMs - (now - lastSent)) / 60000);
      toast({
        title: "Aguarde",
        description: `Você pode enviar novamente em ${remainingMinutes} minuto(s).`,
        variant: "destructive",
      });
      return;
    }

    setSending(proposalId);
    try {
      const { error } = await supabase.functions.invoke("send-proposal", {
        body: { proposalId },
      });

      if (error) throw error;

      setLastEmailSent({ ...lastEmailSent, [proposalId]: now });
      toast({
        title: "Proposta enviada!",
        description: "A proposta foi enviada para o cliente.",
      });
      fetchData();
    } catch (error) {
      console.error("Erro ao enviar proposta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a proposta.",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const handlePauseProposal = async (proposalId: string) => {
    const { error } = await supabase
      .from("proposals")
      .update({ status: "paused" })
      .eq("id", proposalId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível pausar a proposta.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Proposta pausada!",
      });
      fetchData();
    }
  };

  const handleCancelProposal = async (proposalId: string) => {
    const { error } = await supabase
      .from("proposals")
      .update({ status: "cancelled" })
      .eq("id", proposalId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a proposta.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Proposta cancelada!",
      });
      fetchData();
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
      cancelled: { label: "Cancelada", variant: "destructive" },
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
    <div className="space-y-8 animate-fade-in">
      {/* Header Premium */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="relative p-8 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Propostas
                </h1>
                <p className="text-muted-foreground mt-1">Crie e gerencie propostas profissionais</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:scale-105 transition-all">
                  <Plus className="w-4 h-4" />
                  Nova Proposta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Proposta</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da proposta para o cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cliente *</Label>
                <Select
                  value={newProposal.customer_id}
                  onValueChange={(value) => setNewProposal({ ...newProposal, customer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
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

              <div>
                <Label>Título da Proposta *</Label>
                <Input
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                  placeholder="Ex: Reforma de Banheiro"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                  placeholder="Detalhes adicionais da proposta..."
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Serviços *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addService}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {newProposal.services.map((service, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input
                          placeholder="Descrição do serviço"
                          value={service.description}
                          onChange={(e) => updateService(idx, "description", e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="Qtd"
                          min="1"
                          value={service.quantity}
                          onChange={(e) => updateService(idx, "quantity", parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          placeholder="Preço unit."
                          min="0"
                          step="0.01"
                          value={service.unit_price}
                          onChange={(e) => updateService(idx, "unit_price", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      {newProposal.services.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeService(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newProposal.discount_percentage}
                    onChange={(e) => setNewProposal({ ...newProposal, discount_percentage: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Sinal (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newProposal.deposit_percentage}
                    onChange={(e) => setNewProposal({ ...newProposal, deposit_percentage: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Validade (dias)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newProposal.valid_days}
                    onChange={(e) => setNewProposal({ ...newProposal, valid_days: parseInt(e.target.value) || 7 })}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between text-lg font-bold">
                  <span>Valor Total:</span>
                  <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                </div>
                {newProposal.deposit_percentage > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Sinal ({newProposal.deposit_percentage}%):</span>
                    <span>{formatCurrency((calculateTotal() * newProposal.deposit_percentage) / 100)}</span>
                  </div>
                )}
              </div>

              <Button onClick={handleCreateProposal} className="w-full">
                Criar Proposta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>

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
            <p className="text-sm text-muted-foreground mt-2">Crie sua primeira proposta para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProposals.map((proposal, index) => (
            <Card 
              key={proposal.id}
              className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => setViewProposal(proposal)}
            >
              {/* Gradient animado de fundo */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Barra de status superior */}
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${
                proposal.status === "confirmed" ? "from-accent to-green-500" :
                proposal.status === "cancelled" ? "from-destructive to-red-600" :
                proposal.status === "accepted" ? "from-blue-500 to-purple-500" :
                "from-yellow-500 to-orange-500"
              }`} />
              
              <CardHeader className="space-y-4 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-md group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-xl line-clamp-1 group-hover:text-primary transition-colors">
                        {proposal.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{proposal.customers.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(proposal.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Valor com destaque */}
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                  <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {formatCurrency(proposal.final_amount)}
                  </p>
                  {proposal.deposit_amount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Entrada: {formatCurrency(proposal.deposit_amount)}
                    </p>
                  )}
                </div>
                
                {/* Informações adicionais */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Validade
                    </span>
                    <span className="font-medium">
                      {format(new Date(proposal.valid_until), "dd/MM/yyyy")}
                    </span>
                  </div>
                  
                  {proposal.sent_at && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Enviada
                      </span>
                      <span className="font-medium">
                        {format(new Date(proposal.sent_at), "dd/MM/yyyy")}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Botões de ação */}
                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  {proposal.status === "pending" && (
                    <>
                      <Button 
                        size="sm" 
                        className="flex-1 gap-2 bg-gradient-to-r from-accent to-green-500 hover:shadow-lg transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmProposal(proposal);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelProposal(proposal.id);
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  
                  {proposal.status === "confirmed" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Ver Agendamento
                    </Button>
                  )}
                </div>
              </CardContent>
              
              {/* Indicador de hover inferior */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </Card>
          ))}
        </div>
      )}

      <ProposalViewDialog
        proposal={viewProposal}
        open={!!viewProposal}
        onOpenChange={(open) => !open && setViewProposal(null)}
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