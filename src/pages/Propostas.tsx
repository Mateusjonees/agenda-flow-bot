import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Send, Eye, Check, X, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const { toast } = useToast();

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
    setSending(proposalId);
    try {
      const { error } = await supabase.functions.invoke("send-proposal", {
        body: { proposalId },
      });

      if (error) throw error;

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Propostas e Orçamentos</h1>
          <p className="text-muted-foreground">Crie e gerencie propostas profissionais para seus clientes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma proposta criada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{proposal.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {proposal.customers.name}
                    </CardDescription>
                  </div>
                  {getStatusBadge(proposal.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor Total:</span>
                  <span className="font-bold text-primary">{formatCurrency(proposal.final_amount)}</span>
                </div>
                {proposal.deposit_amount && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Sinal:</span>
                    <span className="font-semibold">{formatCurrency(proposal.deposit_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Validade:</span>
                  <span>{format(new Date(proposal.valid_until), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                {proposal.sent_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Enviada em:</span>
                    <span>{format(new Date(proposal.sent_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                )}
                {proposal.accepted_at && (
                  <div className="flex justify-between text-sm text-accent">
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Aceita em:
                    </span>
                    <span>{format(new Date(proposal.accepted_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  {proposal.status === "pending" && (
                    <Button
                      onClick={() => handleSendProposal(proposal.id)}
                      disabled={sending === proposal.id}
                      className="flex-1 gap-2"
                      size="sm"
                    >
                      {sending === proposal.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Propostas;