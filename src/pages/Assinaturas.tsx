import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useReadOnly } from "@/components/SubscriptionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Users, TrendingUp, CreditCard, FileText, DollarSign, Calendar,
  RefreshCw, XCircle, Pause, Play, CheckCircle, PackageCheck, FileDown, FileCheck, Mail, Loader2, AlertTriangle,
  Search, Filter, MoreVertical, Edit, Trash2, Power
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_frequency: string;
  services: any;
  is_active: boolean;
}

interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: string;
  next_billing_date: string;
  start_date: string;
  failed_payments_count: number;
  customers?: { name: string; phone: string; email: string } | null;
  subscription_plans?: { 
    name: string; 
    price: number; 
    billing_frequency: string;
    services: any[];
  } | null;
}

const Assinaturas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isReadOnly } = useReadOnly();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);
  const [selectedPlanForSubscription, setSelectedPlanForSubscription] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [renewSubscription, setRenewSubscription] = useState<Subscription | null>(null);
  const [cancelSubscription, setCancelSubscription] = useState<Subscription | null>(null);
  const [pauseSubscription, setPauseSubscription] = useState<Subscription | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [generatingDocument, setGeneratingDocument] = useState<string>("");
  const [sendingDocument, setSendingDocument] = useState<string>("");
  const [metrics, setMetrics] = useState({
    mrr: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  });
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loadingUserSubscription, setLoadingUserSubscription] = useState(true);
  const [cancelUserSubscription, setCancelUserSubscription] = useState(false);
  const [reactivateUserSubscription, setReactivateUserSubscription] = useState(false);
  const [processingUserAction, setProcessingUserAction] = useState(false);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  
  // Estados para edição/exclusão de planos
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);
  const [planSubscriptionCounts, setPlanSubscriptionCounts] = useState<Record<string, number>>({});
  
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    price: "",
    billing_frequency: "monthly",
    duration_months: "3",
    included_services: [{ service: "", quantity: "1", frequency: "month" }],
  });

  useEffect(() => {
    checkAuth();
    fetchUserSubscription();
    fetchPlans();
    fetchSubscriptions();
    fetchCustomers();
    calculateMetrics();
    fetchPlanSubscriptionCounts();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchUserSubscription = async () => {
    setLoadingUserSubscription(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .is("customer_id", null)
      .maybeSingle();

    if (!error && data) {
      setUserSubscription(data);
    }
    setLoadingUserSubscription(false);
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar planos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPlans(data || []);
    }
  };

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar assinaturas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Fetch related data separately
      const subsWithDetails = await Promise.all(
        (data || []).map(async (sub) => {
          const [customerRes, planRes] = await Promise.all([
            supabase.from("customers").select("name, phone, email").eq("id", sub.customer_id).single(),
            supabase.from("subscription_plans").select("name, price, billing_frequency, services").eq("id", sub.plan_id).single(),
          ]);
          return {
            ...sub,
            customers: customerRes.data,
            subscription_plans: planRes.data,
          };
        })
      );
      setSubscriptions(subsWithDetails as any);
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("name");
    setCustomers(data || []);
  };

  const fetchPlanSubscriptionCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", user.id)
      .in("status", ["active", "suspended"]);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((sub: any) => {
        counts[sub.plan_id] = (counts[sub.plan_id] || 0) + 1;
      });
      setPlanSubscriptionCounts(counts);
    }
  };

  const calculateMetrics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar assinaturas ativas
    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans (price, billing_frequency)
      `)
      .eq("user_id", user.id)
      .eq("status", "active");

    if (activeSubs) {
      // Calcular MRR (Monthly Recurring Revenue)
      const mrr = activeSubs.reduce((sum, sub: any) => {
        const price = sub.subscription_plans?.price || 0;
        const freq = sub.subscription_plans?.billing_frequency;
        
        // Converter para mensal
        if (freq === "quarterly") return sum + (price / 3);
        return sum + price;
      }, 0);

      // Total de receita (aproximado - MRR * 12)
      const totalRevenue = mrr * 12;

      setMetrics({
        mrr,
        totalRevenue,
        activeSubscriptions: activeSubs.length,
      });
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.price) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("subscription_plans").insert([{
      user_id: user.id,
      name: newPlan.name,
      description: newPlan.description,
      price: parseFloat(newPlan.price),
      billing_frequency: newPlan.billing_frequency,
      services: newPlan.included_services,
    }]);

    if (error) {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plano criado com sucesso!",
      });
      setIsDialogOpen(false);
      setNewPlan({
        name: "",
        description: "",
        price: "",
        billing_frequency: "monthly",
        duration_months: "3",
        included_services: [{ service: "", quantity: "1", frequency: "month" }],
      });
      fetchPlans();
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedCustomer || !selectedPlanForSubscription) {
      toast({
        title: "Erro",
        description: "Selecione um cliente e um plano",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      customer_id: selectedCustomer,
      plan_id: selectedPlanForSubscription,
      status: "active",
      next_billing_date: nextBillingDate.toISOString(),
      start_date: new Date().toISOString(),
      failed_payments_count: 0,
    });

    if (error) {
      toast({
        title: "Erro ao criar assinatura",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Assinatura criada com sucesso!",
        description: "O cliente foi vinculado ao plano.",
      });
      setIsSubscribeDialogOpen(false);
      setSelectedCustomer("");
      setSelectedPlanForSubscription("");
      fetchSubscriptions();
      calculateMetrics();
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelSubscription) return;

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", cancelSubscription.id);

    if (error) {
      toast({
        title: "Erro ao cancelar assinatura",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Assinatura cancelada!",
        description: "A assinatura foi cancelada com sucesso.",
      });
      setCancelSubscription(null);
      fetchSubscriptions();
      calculateMetrics();
    }
  };

  const handlePauseSubscription = async () => {
    if (!pauseSubscription) return;

    const newStatus = pauseSubscription.status === "active" ? "suspended" : "active";
    
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: newStatus })
      .eq("id", pauseSubscription.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: newStatus === "active" ? "Assinatura reativada!" : "Assinatura pausada!",
      });
      setPauseSubscription(null);
      fetchSubscriptions();
      calculateMetrics();
    }
  };

  const handleGenerateDocument = async (subscriptionId: string, documentType: "contract" | "receipt") => {
    setGeneratingDocument(`${subscriptionId}-${documentType}`);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-subscription-document", {
        body: {
          subscriptionId,
          documentType,
        },
      });

      if (error) throw error;

      // Criar um blob com o HTML retornado e abrir em nova aba
      const blob = new Blob([data], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      
      // Aguardar um pouco e permitir impressão
      if (win) {
        setTimeout(() => {
          win.print();
        }, 1000);
      }

      toast({
        title: "Documento gerado!",
        description: documentType === "contract" ? "Contrato gerado com sucesso" : "Comprovante gerado com sucesso",
      });
    } catch (error: any) {
      console.error("Error generating document:", error);
      toast({
        title: "Erro ao gerar documento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingDocument("");
    }
  };

  const handleSendDocument = async (subscriptionId: string, documentType: "contract" | "receipt") => {
    setSendingDocument(`${subscriptionId}-${documentType}`);
    
    try {
      const { error } = await supabase.functions.invoke("send-subscription-document", {
        body: {
          subscriptionId,
          documentType,
        },
      });

      if (error) throw error;

      toast({
        title: "Documento enviado!",
        description: documentType === "contract" 
          ? "Contrato enviado por email com sucesso" 
          : "Comprovante enviado por email com sucesso",
      });
    } catch (error: any) {
      console.error("Error sending document:", error);
      toast({
        title: "Erro ao enviar documento",
        description: error.message || "Não foi possível enviar o documento por email",
        variant: "destructive",
      });
    } finally {
      setSendingDocument("");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { label: "Ativo", variant: "default" },
      suspended: { label: "Suspenso", variant: "secondary" },
      cancelled: { label: "Cancelado", variant: "outline" },
      payment_failed: { label: "Pagamento Falhou", variant: "destructive" },
    };
    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal",
      quarterly: "Trimestral",
      single: "Pagamento Único",
    };
    return labels[frequency] || frequency;
  };

  const handleCancelUserSubscription = async () => {
    if (!userSubscription) return;
    setProcessingUserAction(true);

    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { subscriptionId: userSubscription.id },
      });

      if (error) throw error;

      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso.",
      });

      setCancelUserSubscription(false);
      await fetchUserSubscription();
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar assinatura",
        description: error.message || "Não foi possível cancelar a assinatura.",
        variant: "destructive",
      });
    } finally {
      setProcessingUserAction(false);
    }
  };

  const handleReactivateUserSubscription = async () => {
    if (!userSubscription) return;
    setProcessingUserAction(true);

    try {
      const { data, error } = await supabase.functions.invoke("reactivate-subscription", {
        body: { subscriptionId: userSubscription.id },
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        toast({
          title: "Redirecionando para pagamento",
          description: "Você será redirecionado para completar o pagamento da reativação.",
        });
        
        // Redirecionar para o Mercado Pago após um breve delay
        setTimeout(() => {
          window.location.href = data.paymentUrl;
        }, 1500);
      } else {
        toast({
          title: "Assinatura reativada",
          description: "Sua assinatura foi reativada com sucesso.",
        });

        setReactivateUserSubscription(false);
        await fetchUserSubscription();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao reativar assinatura",
        description: error.message || "Não foi possível reativar a assinatura.",
        variant: "destructive",
      });
    } finally {
      setProcessingUserAction(false);
    }
  };

  const handleEditPlan = async () => {
    if (!editingPlan || !editingPlan.name || !editingPlan.price) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("subscription_plans")
      .update({
        name: editingPlan.name,
        description: editingPlan.description,
        price: editingPlan.price,
        billing_frequency: editingPlan.billing_frequency,
        services: editingPlan.services,
      })
      .eq("id", editingPlan.id);

    if (error) {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plano atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
      setEditingPlan(null);
      fetchPlans();
    }
  };

  const handleTogglePlanStatus = async (planId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_active: !currentStatus })
      .eq("id", planId);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: !currentStatus ? "Plano ativado!" : "Plano desativado!",
      });
      fetchPlans();
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;

    const activeSubscriptions = planSubscriptionCounts[deletingPlan.id] || 0;
    
    if (activeSubscriptions > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Este plano possui ${activeSubscriptions} assinatura(s) ativa(s). Desative-as primeiro.`,
        variant: "destructive",
      });
      setDeletingPlan(null);
      return;
    }

    const { error } = await supabase
      .from("subscription_plans")
      .delete()
      .eq("id", deletingPlan.id);

    if (error) {
      toast({
        title: "Erro ao excluir plano",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plano excluído!",
        description: "O plano foi removido com sucesso.",
      });
      setDeletingPlan(null);
      fetchPlans();
      fetchPlanSubscriptionCounts();
    }
  };

  const getFilteredSubscriptions = () => {
    return subscriptions.filter((subscription) => {
      const matchesSearch = searchTerm === "" || 
        subscription.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.customers?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
      
      const matchesPlan = planFilter === "all" || subscription.plan_id === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Assinaturas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie planos e assinaturas dos seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          {/* Diálogo de Vincular Cliente */}
          <Dialog open={isSubscribeDialogOpen} onOpenChange={setIsSubscribeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isReadOnly}>
                <Users className="mr-2 h-4 w-4" />
                Vincular Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vincular Cliente a um Plano</DialogTitle>
                <DialogDescription>
                  Selecione um cliente e um plano para criar uma nova assinatura
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Cliente</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
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
                  <Label>Plano</Label>
                  <Select value={selectedPlanForSubscription} onValueChange={setSelectedPlanForSubscription}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.filter(p => p.is_active).map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {formatCurrency(plan.price)}/{getFrequencyLabel(plan.billing_frequency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubscribeDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSubscription} disabled={isReadOnly}>
                  Criar Assinatura
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Diálogo de Novo Plano */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isReadOnly}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Plano</DialogTitle>
                <DialogDescription>
                  Configure um plano de assinatura recorrente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Plano *</Label>
                  <Input
                    id="name"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    placeholder="Ex: Pacote 4 Aulas/Mês"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                    placeholder="Descreva o que está incluso no plano"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Valor (R$) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duração (meses)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={newPlan.duration_months}
                      onChange={(e) => setNewPlan({ ...newPlan, duration_months: e.target.value })}
                      placeholder="3"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="frequency">Frequência de Cobrança</Label>
                  <Select
                    value={newPlan.billing_frequency}
                    onValueChange={(value) => setNewPlan({ ...newPlan, billing_frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="single">Pagamento Único</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreatePlan} className="w-full" disabled={isReadOnly}>
                  Criar Plano
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      {/* Métricas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</div>
            <p className="text-xs text-muted-foreground">Receita recorrente mensal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Anual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Projeção anual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.filter(p => p.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscriptions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Assinantes</TabsTrigger>
          <TabsTrigger value="plans">Planos Disponíveis</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          {/* Filtros */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="payment_failed">Pagamento Falhou</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Planos</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPlanFilter("all");
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Mostrando {getFilteredSubscriptions().length} de {subscriptions.length} assinatura(s)
              </div>
            </CardContent>
          </Card>

          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground mb-4">Nenhuma assinatura ativa ainda</p>
                <Button onClick={() => setIsSubscribeDialogOpen(true)} disabled={isReadOnly}>
                  <Plus className="mr-2 h-4 w-4" />
                  Vincular Primeiro Cliente
                </Button>
              </CardContent>
            </Card>
          ) : getFilteredSubscriptions().length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground mb-4">Nenhuma assinatura encontrada com os filtros aplicados</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPlanFilter("all");
                  }}
                >
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getFilteredSubscriptions().map((subscription) => (
                <Card key={subscription.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle 
                          className="cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/clientes?customer=${subscription.customer_id}&tab=loyalty`)}
                        >
                          {subscription.customers?.name}
                        </CardTitle>
                        <CardDescription>
                          {subscription.subscription_plans?.name}
                        </CardDescription>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Valor</p>
                          <p className="font-semibold">
                            {formatCurrency(subscription.subscription_plans?.price || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Próximo Pagamento</p>
                          <p className="font-semibold">
                            {new Date(subscription.next_billing_date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Início</p>
                          <p className="font-semibold">
                            {new Date(subscription.start_date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateDocument(subscription.id, "contract")}
                          disabled={generatingDocument === `${subscription.id}-contract`}
                        >
                          {generatingDocument === `${subscription.id}-contract` ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <FileCheck className="mr-2 h-4 w-4" />
                          )}
                          {generatingDocument === `${subscription.id}-contract` ? "Gerando..." : "Contrato"}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendDocument(subscription.id, "contract")}
                          disabled={sendingDocument === `${subscription.id}-contract`}
                        >
                          {sendingDocument === `${subscription.id}-contract` ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="mr-2 h-4 w-4" />
                          )}
                          {sendingDocument === `${subscription.id}-contract` ? "Enviando..." : "Email Contrato"}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateDocument(subscription.id, "receipt")}
                          disabled={generatingDocument === `${subscription.id}-receipt`}
                        >
                          {generatingDocument === `${subscription.id}-receipt` ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="mr-2 h-4 w-4" />
                          )}
                          {generatingDocument === `${subscription.id}-receipt` ? "Gerando..." : "Comprovante"}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendDocument(subscription.id, "receipt")}
                          disabled={sendingDocument === `${subscription.id}-receipt`}
                        >
                          {sendingDocument === `${subscription.id}-receipt` ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="mr-2 h-4 w-4" />
                          )}
                          {sendingDocument === `${subscription.id}-receipt` ? "Enviando..." : "Email Comprovante"}
                        </Button>
                        
                        {subscription.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPauseSubscription(subscription)}
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </Button>
                        )}
                        
                        {subscription.status === "suspended" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPauseSubscription(subscription)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Reativar
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCancelSubscription(subscription)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          {plans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground mb-4">Nenhum plano criado ainda</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Plano
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {!plan.is_active && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                          {plan.is_active && (
                            <Badge variant="default">Ativo</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">{plan.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isReadOnly}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingPlan(plan)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePlanStatus(plan.id, plan.is_active)}>
                            <Power className="mr-2 h-4 w-4" />
                            {plan.is_active ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeletingPlan(plan)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-3xl font-bold">{formatCurrency(plan.price)}</div>
                        <div className="text-sm text-muted-foreground">
                          {getFrequencyLabel(plan.billing_frequency)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {planSubscriptionCounts[plan.id] || 0} assinante(s)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Cancelamento */}
      <AlertDialog open={!!cancelSubscription} onOpenChange={() => setCancelSubscription(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta assinatura? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription}>
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Pausar/Reativar */}
      <AlertDialog open={!!pauseSubscription} onOpenChange={() => setPauseSubscription(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pauseSubscription?.status === "active" ? "Pausar" : "Reativar"} Assinatura
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pauseSubscription?.status === "active" 
                ? "A assinatura será pausada e não haverá cobranças até ser reativada."
                : "A assinatura será reativada e as cobranças voltarão ao normal."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePauseSubscription}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Cancelar Minha Assinatura */}
      <AlertDialog open={cancelUserSubscription} onOpenChange={setCancelUserSubscription}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Minha Assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium da plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingUserAction}>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelUserSubscription}
              disabled={processingUserAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processingUserAction ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Reativar Minha Assinatura */}
      <AlertDialog open={reactivateUserSubscription} onOpenChange={setReactivateUserSubscription}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reativar Minha Assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja reativar sua assinatura? Você voltará a ter acesso a todos os recursos premium da plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingUserAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReactivateUserSubscription}
              disabled={processingUserAction}
            >
              {processingUserAction ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reativando...
                </>
              ) : (
                "Confirmar Reativação"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Edição de Plano */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Modifique as informações do plano de assinatura
            </DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Plano *</Label>
                <Input
                  id="edit-name"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="Ex: Pacote 4 Aulas/Mês"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editingPlan.description || ""}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  placeholder="Descreva o que está incluso no plano"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price">Valor (R$) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-frequency">Frequência de Cobrança</Label>
                  <Select
                    value={editingPlan.billing_frequency}
                    onValueChange={(value) => setEditingPlan({ ...editingPlan, billing_frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="single">Pagamento Único</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {planSubscriptionCounts[editingPlan.id] > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        Atenção
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                        Este plano possui {planSubscriptionCounts[editingPlan.id]} assinatura(s) ativa(s). 
                        Alterações no valor afetarão as próximas cobranças.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingPlan(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditPlan} disabled={isReadOnly}>
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão de Plano */}
      <AlertDialog open={!!deletingPlan} onOpenChange={(open) => !open && setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingPlan && planSubscriptionCounts[deletingPlan.id] > 0 ? (
                <div className="space-y-2">
                  <p>Este plano possui {planSubscriptionCounts[deletingPlan.id]} assinatura(s) ativa(s) e não pode ser excluído.</p>
                  <p className="text-sm">Você pode desativar o plano para impedir novas assinaturas, ou cancelar todas as assinaturas ativas primeiro.</p>
                </div>
              ) : (
                <p>Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {deletingPlan && planSubscriptionCounts[deletingPlan.id] === 0 && (
              <AlertDialogAction 
                onClick={handleDeletePlan}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir Plano
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Assinaturas;