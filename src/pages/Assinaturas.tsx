import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
  RefreshCw, XCircle, Pause, Play, CheckCircle, PackageCheck, FileDown, FileCheck, Mail, Loader2, AlertTriangle
} from "lucide-react";
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

      toast({
        title: "Assinatura reativada",
        description: "Sua assinatura foi reativada com sucesso.",
      });

      setReactivateUserSubscription(false);
      await fetchUserSubscription();
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
              <Button variant="outline">
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
                <Button onClick={handleCreateSubscription}>
                  Criar Assinatura
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Diálogo de Novo Plano */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
                <Button onClick={handleCreatePlan} className="w-full">
                  Criar Plano
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Minha Assinatura */}
      {userSubscription && !loadingUserSubscription && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Minha Assinatura</CardTitle>
                  <CardDescription>Gerenciar meu plano da plataforma</CardDescription>
                </div>
              </div>
              {userSubscription.status === "active" ? (
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Cancelado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Plano:</span>
                  <span className="font-semibold">
                    {userSubscription.status === "trial" ? "Trial (7 dias grátis)" : "Premium"}
                  </span>
                </div>
                {userSubscription.status === "active" && userSubscription.next_billing_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Próxima cobrança:</span>
                    <span className="font-medium">
                      {format(new Date(userSubscription.next_billing_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {userSubscription.status === "active" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setCancelUserSubscription(true)}
                    disabled={processingUserAction}
                  >
                    {processingUserAction ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Cancelar Assinatura
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setReactivateUserSubscription(true)}
                    disabled={processingUserAction}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingUserAction ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Reativar Assinatura
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground mb-4">Nenhuma assinatura ativa ainda</p>
                <Button onClick={() => setIsSubscribeDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Vincular Primeiro Cliente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
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
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.is_active && <Badge>Ativo</Badge>}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold">{formatCurrency(plan.price)}</div>
                      <div className="text-sm text-muted-foreground">
                        {getFrequencyLabel(plan.billing_frequency)}
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
    </div>
  );
};

export default Assinaturas;