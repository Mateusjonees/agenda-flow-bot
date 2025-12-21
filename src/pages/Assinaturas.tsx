import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useReadOnly } from "@/components/SubscriptionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Users,
  TrendingUp,
  CreditCard,
  FileText,
  DollarSign,
  Calendar,
  RefreshCw,
  XCircle,
  Pause,
  Play,
  CheckCircle,
  PackageCheck,
  FileDown,
  FileCheck,
  Mail,
  Loader2,
  AlertTriangle,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  RotateCcw,
  Sparkles,
  Clock,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  type?: string;
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
  const [deleteSubscription, setDeleteSubscription] = useState<Subscription | null>(null);
  const [pauseSubscription, setPauseSubscription] = useState<Subscription | null>(null);
  const [reactivateSubscription, setReactivateSubscription] = useState<Subscription | null>(null);
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
  const [subscriptionView, setSubscriptionView] = useState<"active" | "history">("active");

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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchUserSubscription = async () => {
    setLoadingUserSubscription(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("user_id", user.id)
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "customer")
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
            supabase
              .from("subscription_plans")
              .select("name, price, billing_frequency, services")
              .eq("id", sub.plan_id)
              .single(),
          ]);
          return {
            ...sub,
            customers: customerRes.data,
            subscription_plans: planRes.data,
          };
        }),
      );
      setSubscriptions(subsWithDetails as any);
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    setCustomers(data || []);
  };

  const fetchPlanSubscriptionCounts = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", user.id)
      .eq("type", "customer")
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar assinaturas ativas
    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        subscription_plans (price, billing_frequency)
      `,
      )
      .eq("user_id", user.id)
      .eq("type", "customer")
      .eq("status", "active");

    if (activeSubs) {
      // Calcular MRR (Monthly Recurring Revenue)
      const mrr = activeSubs.reduce((sum, sub: any) => {
        const price = sub.subscription_plans?.price || 0;
        const freq = sub.subscription_plans?.billing_frequency;

        // Converter para mensal
        if (freq === "quarterly") return sum + price / 3;
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("subscription_plans").insert([
      {
        user_id: user.id,
        name: newPlan.name,
        description: newPlan.description,
        price: parseFloat(newPlan.price),
        billing_frequency: newPlan.billing_frequency,
        services: newPlan.included_services,
      },
    ]);

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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      customer_id: selectedCustomer,
      plan_id: selectedPlanForSubscription,
      status: "active",
      type: "customer",
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
      fetchPlanSubscriptionCounts();
    }
  };

  const handleDeleteSubscription = async () => {
    if (!deleteSubscription) return;

    // ✅ VALIDAÇÃO DE SEGURANÇA: Bloquear delete de assinatura de plataforma
    if (deleteSubscription.type === "platform" || deleteSubscription.type === "trial") {
      toast({
        title: "Erro de segurança",
        description: "Só é possível deletar contratos de clientes aqui. Para cancelar sua assinatura de plataforma, vá em 'Meu Plano'.",
        variant: "destructive",
      });
      setDeleteSubscription(null);
      return;
    }

    try {
      // 1. Deletar pix_charges relacionados
      const { error: pixError } = await supabase
        .from("pix_charges")
        .delete()
        .eq("subscription_id", deleteSubscription.id);

      if (pixError) throw pixError;

      // 2. Deletar financial_transactions relacionados
      const { data: transactions } = await supabase
        .from("financial_transactions")
        .select("id")
        .or(`appointment_id.eq.${deleteSubscription.id}`);

      if (transactions && transactions.length > 0) {
        const transactionIds = transactions.map((t) => t.id);
        const { error: txError } = await supabase.from("financial_transactions").delete().in("id", transactionIds);

        if (txError) throw txError;
      }

      // 3. Deletar a subscription
      const { error: subError } = await supabase.from("subscriptions").delete().eq("id", deleteSubscription.id);

      if (subError) throw subError;

      toast({
        title: "Assinatura deletada!",
        description: "A assinatura e todos os dados relacionados foram removidos permanentemente.",
      });

      setDeleteSubscription(null);
      fetchSubscriptions();
      calculateMetrics();
      fetchPlanSubscriptionCounts();
    } catch (error: any) {
      console.error("Error deleting subscription:", error);
      toast({
        title: "Erro ao deletar assinatura",
        description: error.message || "Não foi possível deletar a assinatura.",
        variant: "destructive",
      });
    }
  };

  const handlePauseSubscription = async () => {
    if (!pauseSubscription) return;

    const newStatus = pauseSubscription.status === "active" ? "suspended" : "active";

    const { error } = await supabase.from("subscriptions").update({ status: newStatus }).eq("id", pauseSubscription.id);

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
      fetchPlanSubscriptionCounts();
    }
  };

  // ✅ NOVA FUNÇÃO: Reativar contratos cancelados/expirados
  const handleReactivateSubscription = async () => {
    if (!reactivateSubscription) return;

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const { error } = await supabase
      .from("subscriptions")
      .update({ 
        status: "active",
        next_billing_date: nextBillingDate.toISOString(),
        failed_payments_count: 0,
      })
      .eq("id", reactivateSubscription.id);

    if (error) {
      toast({
        title: "Erro ao reativar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Contrato reativado!",
        description: "O contrato foi reativado com sucesso e está ativo novamente.",
      });
      setReactivateSubscription(null);
      fetchSubscriptions();
      calculateMetrics();
      fetchPlanSubscriptionCounts();
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
        description:
          documentType === "contract"
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
    const variants: Record<string, { label: string; className: string }> = {
      active: { 
        label: "Ativo", 
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
      },
      suspended: { 
        label: "Suspenso", 
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" 
      },
      cancelled: { 
        label: "Cancelado", 
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" 
      },
      expired: { 
        label: "Expirado", 
        className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" 
      },
      payment_failed: { 
        label: "Pagamento Falhou", 
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" 
      },
    };
    const config = variants[status] || { label: status, className: "bg-muted text-muted-foreground" };
    return (
      <Badge variant="outline" className={`${config.className} font-medium`}>
        {config.label}
      </Badge>
    );
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
    const { error } = await supabase.from("subscription_plans").update({ is_active: !currentStatus }).eq("id", planId);

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

    const { error } = await supabase.from("subscription_plans").delete().eq("id", deletingPlan.id);

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
      const matchesSearch =
        searchTerm === "" ||
        subscription.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.customers?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;

      const matchesPlan = planFilter === "all" || subscription.plan_id === planFilter;

      // Filtrar por view (ativo ou histórico)
      const isHistoryStatus = subscription.status === "cancelled" || subscription.status === "expired";
      const matchesView = subscriptionView === "active" ? !isHistoryStatus : isHistoryStatus;

      return matchesSearch && matchesStatus && matchesPlan && matchesView;
    });
  };

  const getCustomerInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Contratos Recorrentes
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie planos e contratos recorrentes dos seus clientes</p>
        </div>
        <div className="flex gap-3">
          {/* Diálogo de Vincular Cliente */}
          <Dialog open={isSubscribeDialogOpen} onOpenChange={setIsSubscribeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isReadOnly} className="gap-2 hover:border-primary/50 transition-colors">
                <Users className="h-4 w-4" />
                Vincular Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle>Vincular Cliente</DialogTitle>
                    <DialogDescription>Selecione um cliente e um plano para criar um novo contrato</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="h-11">
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
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={selectedPlanForSubscription} onValueChange={setSelectedPlanForSubscription}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans
                        .filter((p) => p.is_active)
                        .map((plan) => (
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
                <Button onClick={handleCreateSubscription} disabled={isReadOnly} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Criar Contrato
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo de Novo Plano */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isReadOnly} className="gap-2 shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-4 w-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle>Criar Novo Plano</DialogTitle>
                    <DialogDescription>Configure um plano de assinatura recorrente</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano *</Label>
                  <Input
                    id="name"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    placeholder="Ex: Pacote 4 Aulas/Mês"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                    placeholder="Descreva o que está incluso no plano"
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Valor (R$) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (meses)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={newPlan.duration_months}
                      onChange={(e) => setNewPlan({ ...newPlan, duration_months: e.target.value })}
                      placeholder="3"
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência de Cobrança</Label>
                  <Select
                    value={newPlan.billing_frequency}
                    onValueChange={(value) => setNewPlan({ ...newPlan, billing_frequency: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="single">Pagamento Único</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreatePlan} className="w-full h-11" disabled={isReadOnly}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Criar Plano
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Métricas Premium */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(metrics.mrr)}</div>
            <p className="text-xs text-muted-foreground mt-1">MRR - Receita recorrente</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Anual</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Projeção anual</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Planos Ativos</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <PackageCheck className="h-5 w-5 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{plans.filter((p) => p.is_active).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Planos disponíveis</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contratos Ativos</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">Clientes ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-12">
          <TabsTrigger value="subscriptions" className="gap-2 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            Assinantes
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <PackageCheck className="h-4 w-4" />
            Planos Disponíveis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-6">
          {/* Toggle Ativos/Histórico */}
          <div className="flex gap-2">
            <Button
              variant={subscriptionView === "active" ? "default" : "outline"}
              onClick={() => {
                setSubscriptionView("active");
                setStatusFilter("all");
              }}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Ativos
              <Badge variant="secondary" className="ml-1 bg-background/50">
                {subscriptions.filter((s) => s.status !== "cancelled" && s.status !== "expired").length}
              </Badge>
            </Button>
            <Button
              variant={subscriptionView === "history" ? "default" : "outline"}
              onClick={() => {
                setSubscriptionView("history");
                setStatusFilter("all");
              }}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              Histórico
              <Badge variant="secondary" className="ml-1 bg-background/50">
                {subscriptions.filter((s) => s.status === "cancelled" || s.status === "expired").length}
              </Badge>
            </Button>
          </div>

          {/* Filtros */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-11"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {subscriptionView === "active" ? (
                      <>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="suspended">Suspenso</SelectItem>
                        <SelectItem value="payment_failed">Pagamento Falhou</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="h-11">
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
                  className="h-11 gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Mostrando {getFilteredSubscriptions().length} de{" "}
                {subscriptionView === "active"
                  ? subscriptions.filter((s) => s.status !== "cancelled" && s.status !== "expired").length
                  : subscriptions.filter((s) => s.status === "cancelled" || s.status === "expired").length}{" "}
                contrato(s) {subscriptionView === "active" ? "ativos" : "no histórico"}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Assinaturas */}
          {subscriptions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground mb-2">Nenhum contrato cadastrado</p>
                <p className="text-sm text-muted-foreground mb-6">Vincule seu primeiro cliente a um plano para começar</p>
                <Button onClick={() => setIsSubscribeDialogOpen(true)} disabled={isReadOnly} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Vincular Primeiro Cliente
                </Button>
              </CardContent>
            </Card>
          ) : getFilteredSubscriptions().length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                {subscriptionView === "history" ? (
                  <>
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground mb-2">Nenhum contrato no histórico</p>
                    <p className="text-sm text-muted-foreground">Contratos cancelados ou expirados aparecerão aqui</p>
                  </>
                ) : (
                  <>
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground mb-2">Nenhum contrato encontrado</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      {statusFilter !== "all" || planFilter !== "all" || searchTerm
                        ? "Tente ajustar os filtros"
                        : "Nenhum contrato ativo no momento"}
                    </p>
                    {(statusFilter !== "all" || planFilter !== "all" || searchTerm) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                          setPlanFilter("all");
                        }}
                        className="gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Limpar Filtros
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {getFilteredSubscriptions().map((subscription) => (
                <Card 
                  key={subscription.id} 
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-semibold text-lg">
                          {getCustomerInitials(subscription.customers?.name || "?")}
                        </div>
                        <div>
                          <CardTitle
                            className="text-lg cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                            onClick={() => navigate(`/clientes?customer=${subscription.customer_id}&tab=loyalty`)}
                          >
                            {subscription.customers?.name}
                            <User className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <PackageCheck className="h-3.5 w-3.5" />
                            {subscription.subscription_plans?.name}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Info Grid */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor</p>
                          <p className="font-semibold text-lg mt-1">{formatCurrency(subscription.subscription_plans?.price || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Próximo Pagamento</p>
                          <p className="font-semibold text-lg mt-1">
                            {format(new Date(subscription.next_billing_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Início</p>
                          <p className="font-semibold text-lg mt-1">
                            {format(new Date(subscription.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {/* Documentos */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateDocument(subscription.id, "contract")}
                            disabled={generatingDocument === `${subscription.id}-contract`}
                            className="gap-1.5"
                          >
                            {generatingDocument === `${subscription.id}-contract` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <FileCheck className="h-3.5 w-3.5" />
                            )}
                            Contrato
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendDocument(subscription.id, "contract")}
                            disabled={sendingDocument === `${subscription.id}-contract`}
                            className="gap-1.5"
                          >
                            {sendingDocument === `${subscription.id}-contract` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Mail className="h-3.5 w-3.5" />
                            )}
                            Email
                          </Button>
                        </div>

                        <div className="w-px h-6 bg-border self-center" />

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateDocument(subscription.id, "receipt")}
                            disabled={generatingDocument === `${subscription.id}-receipt`}
                            className="gap-1.5"
                          >
                            {generatingDocument === `${subscription.id}-receipt` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <FileDown className="h-3.5 w-3.5" />
                            )}
                            Comprovante
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendDocument(subscription.id, "receipt")}
                            disabled={sendingDocument === `${subscription.id}-receipt`}
                            className="gap-1.5"
                          >
                            {sendingDocument === `${subscription.id}-receipt` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Mail className="h-3.5 w-3.5" />
                            )}
                            Email
                          </Button>
                        </div>

                        <div className="w-px h-6 bg-border self-center" />

                        {/* Status Actions */}
                        {subscription.status === "active" && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setPauseSubscription(subscription)}
                            className="gap-1.5 hover:border-amber-500/50 hover:text-amber-600"
                          >
                            <Pause className="h-3.5 w-3.5" />
                            Pausar
                          </Button>
                        )}

                        {subscription.status === "suspended" && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setPauseSubscription(subscription)}
                            className="gap-1.5 hover:border-emerald-500/50 hover:text-emerald-600"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Retomar
                          </Button>
                        )}

                        {/* ✅ NOVO: Botão de reativar para histórico */}
                        {(subscription.status === "cancelled" || subscription.status === "expired") && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setReactivateSubscription(subscription)}
                            className="gap-1.5 hover:border-emerald-500/50 hover:text-emerald-600"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reativar
                          </Button>
                        )}

                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setDeleteSubscription(subscription)}
                          className="gap-1.5 hover:border-destructive/50 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          {plans.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <PackageCheck className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground mb-2">Nenhum plano criado</p>
                <p className="text-sm text-muted-foreground mb-6">Crie seu primeiro plano para começar a vincular clientes</p>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Plano
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <Card 
                  key={plan.id} 
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    !plan.is_active ? "opacity-60" : "hover:border-primary/30"
                  } ${index === 0 && plan.is_active ? "border-primary/50 shadow-md" : ""}`}
                >
                  {/* Popular Badge */}
                  {index === 0 && plan.is_active && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                        Popular
                      </div>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          {plan.name}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{plan.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={isReadOnly}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
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
                  <CardContent className="space-y-4">
                    {/* Preço */}
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-4xl font-bold">{formatCurrency(plan.price)}</div>
                      <div className="text-sm text-muted-foreground mt-1">{getFrequencyLabel(plan.billing_frequency)}</div>
                    </div>
                    
                    {/* Status e Assinantes */}
                    <div className="flex items-center justify-between">
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{planSubscriptionCounts[plan.id] || 0} assinante(s)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Deletar Assinatura */}
      <AlertDialog open={!!deleteSubscription} onOpenChange={() => setDeleteSubscription(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Deletar Contrato Permanentemente</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="font-semibold text-amber-600">⚠️ ATENÇÃO: Esta ação é irreversível!</p>
              <p>Ao deletar este contrato, os seguintes dados serão removidos permanentemente:</p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Registro do contrato</li>
                <li>Cobranças PIX relacionadas</li>
                <li>Transações financeiras relacionadas</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubscription} className="bg-destructive hover:bg-destructive/90 gap-2">
              <Trash2 className="h-4 w-4" />
              Deletar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Pausar/Retomar */}
      <AlertDialog open={!!pauseSubscription} onOpenChange={() => setPauseSubscription(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                pauseSubscription?.status === "active" 
                  ? "bg-amber-500/10" 
                  : "bg-emerald-500/10"
              }`}>
                {pauseSubscription?.status === "active" ? (
                  <Pause className="h-5 w-5 text-amber-500" />
                ) : (
                  <Play className="h-5 w-5 text-emerald-500" />
                )}
              </div>
              <AlertDialogTitle>
                {pauseSubscription?.status === "active" ? "Pausar" : "Retomar"} Contrato
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              {pauseSubscription?.status === "active"
                ? "O contrato será pausado e não haverá cobranças até ser retomado."
                : "O contrato será retomado e as cobranças voltarão ao normal."}
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

      {/* ✅ NOVO: Dialog de Reativar Contrato Cancelado/Expirado */}
      <AlertDialog open={!!reactivateSubscription} onOpenChange={() => setReactivateSubscription(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-emerald-500" />
              </div>
              <AlertDialogTitle>Reativar Contrato</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2 space-y-2">
              <p>Deseja reativar o contrato de <strong>{reactivateSubscription?.customers?.name}</strong>?</p>
              <p>O contrato será reativado com status "Ativo" e a próxima cobrança será em 30 dias.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReactivateSubscription}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reativar Contrato
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
            <AlertDialogAction onClick={handleReactivateUserSubscription} disabled={processingUserAction}>
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
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Editar Plano</DialogTitle>
                <DialogDescription>Modifique as informações do plano de assinatura</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Plano *</Label>
                <Input
                  id="edit-name"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="Ex: Pacote 4 Aulas/Mês"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editingPlan.description || ""}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  placeholder="Descreva o que está incluso no plano"
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Valor (R$) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-frequency">Frequência de Cobrança</Label>
                  <Select
                    value={editingPlan.billing_frequency}
                    onValueChange={(value) => setEditingPlan({ ...editingPlan, billing_frequency: value })}
                  >
                    <SelectTrigger className="h-11">
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
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Atenção</p>
                      <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                        Este plano possui {planSubscriptionCounts[editingPlan.id]} contrato(s) ativo(s). Alterações no
                        valor afetarão as próximas cobranças.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingPlan(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditPlan} disabled={isReadOnly} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
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
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              {deletingPlan && planSubscriptionCounts[deletingPlan.id] > 0 ? (
                <div className="space-y-2">
                  <p>
                    Este plano possui <strong>{planSubscriptionCounts[deletingPlan.id]} contrato(s) ativo(s)</strong> e não pode ser
                    excluído.
                  </p>
                  <p className="text-sm">
                    Você pode desativar o plano para impedir novos contratos, ou cancelar todos os contratos ativos
                    primeiro.
                  </p>
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
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
              >
                <Trash2 className="h-4 w-4" />
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
