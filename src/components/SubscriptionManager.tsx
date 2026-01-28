import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Check, Star, CreditCard, Calendar, AlertTriangle, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PixPaymentDialog } from "@/components/PixPaymentDialog";
import { CardSubscriptionDialog } from "@/components/CardSubscriptionDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentMethodBadge } from "@/components/PaymentMethodBadge";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

type PlanType = "monthly" | "semestral" | "annual";

interface Plan {
  id: PlanType;
  name: string;
  monthlyPrice: number;
  totalPrice: number;
  months: number;
  discount?: string;
  popular?: boolean;
  features: string[];
}

const plans: Plan[] = [
  {
    id: "monthly",
    name: "Mensal",
    monthlyPrice: 49,
    totalPrice: 49,
    months: 1,
    features: [
      "Agendamentos ilimitados",
      "Gestão de clientes",
      "Controle financeiro",
      "Relatórios básicos",
      "Suporte por email",
    ],
  },
  {
    id: "semestral",
    name: "Semestral",
    monthlyPrice: 43.17,
    totalPrice: 259,
    months: 6,
    discount: "Economize 12%",
    popular: true,
    features: [
      "Todos os recursos do Mensal",
      "Relatórios avançados",
      "Integração WhatsApp",
      "Suporte prioritário",
      "Backup automático",
    ],
  },
  {
    id: "annual",
    name: "Anual",
    monthlyPrice: 39.58,
    totalPrice: 475,
    months: 12,
    discount: "Economize 19%",
    features: [
      "Todos os recursos do Semestral",
      "API personalizada",
      "Treinamento exclusivo",
      "Consultor dedicado",
    ],
  },
];

export function SubscriptionManager() {
  const queryClient = useQueryClient();
  const { trackInitiateCheckout, trackAddPaymentInfo } = useFacebookPixel();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  
  // Estados para o PIX dialog
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    ticketUrl: string;
    amount: number;
    chargeId: string;
  } | null>(null);

  // Buscar assinatura atual
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["current-subscription"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Escutar mudanças em tempo real na assinatura
  useEffect(() => {
    const getUserAndSubscribe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel("subscription-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "subscriptions",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Subscription updated in real-time:", payload);

            // Invalidar cache para recarregar dados
            queryClient.invalidateQueries({ queryKey: ["current-subscription"] });

            // Mostrar notificação se o status mudou para "active"
            if (payload.new && "status" in payload.new) {
              const newStatus = (payload.new as any).status;
              if (newStatus === "active" && payload.eventType === "UPDATE") {
                toast.success("🎉 Pagamento confirmado! Sua assinatura está ativa.", {
                  duration: 5000,
                });
              }
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    getUserAndSubscribe();
  }, [queryClient]);

  // Callback quando o pagamento PIX for confirmado
  const handlePixPaymentConfirmed = () => {
    queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
    setPixDialogOpen(false);
    setPixData(null);
    toast.success("🎉 Assinatura ativada com sucesso!");
  };

  // Handler para assinar plano
  const handleSubscribe = async (plan: Plan) => {
    setSelectedPlan(plan);
    
    // Track checkout initiation
    trackInitiateCheckout({
      value: plan.totalPrice,
      content_name: plan.name,
      num_items: 1
    });
    
    // Track payment method selection
    trackAddPaymentInfo(paymentMethod);
    
    if (paymentMethod === "pix") {
      createSubscriptionMutation.mutate(plan.id);
    } else {
      // Abrir dialog de cartão
      setCardDialogOpen(true);
    }
  };

  // Criar assinatura via PIX
  const createSubscriptionMutation = useMutation({
    mutationFn: async (planType: PlanType) => {
      const { data, error } = await supabase.functions.invoke("generate-subscription-pix", {
        body: { planType },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao gerar PIX");
      return data;
    },
    onSuccess: (data) => {
      // Abrir dialog com QR Code ao invés de redirecionar
      setPixData({
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        ticketUrl: data.ticketUrl,
        amount: data.amount,
        chargeId: data.chargeId,
      });
      setPixDialogOpen(true);
      toast.success(`PIX gerado para ${data.planName}! Escaneie o QR Code para pagar.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao gerar PIX");
    },
  });

  // Cancelar assinatura
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!subscription?.id) throw new Error("Assinatura não encontrada");

      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: { subscriptionId: subscription.id },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assinatura cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
      setCancelDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cancelar assinatura");
    },
  });

  // Reativar assinatura - também usa PIX
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!subscription?.id) throw new Error("Assinatura não encontrada");

      // Determinar o plano baseado no billing_frequency atual ou usar mensal como padrão
      const planType = (subscription.billing_frequency as PlanType) || "monthly";
      
      const { data, error } = await supabase.functions.invoke("generate-subscription-pix", {
        body: { planType },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao gerar PIX");
      return data;
    },
    onSuccess: (data) => {
      // Abrir dialog com QR Code ao invés de redirecionar
      setPixData({
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        ticketUrl: data.ticketUrl,
        amount: data.amount,
        chargeId: data.chargeId,
      });
      setPixDialogOpen(true);
      toast.success(`PIX gerado para reativação! Escaneie o QR Code para pagar.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao reativar assinatura");
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Ativa", variant: "default" as const, color: "bg-green-500" },
      trial: { label: "Trial", variant: "secondary" as const, color: "bg-blue-500" },
      cancelled: { label: "Cancelada", variant: "destructive" as const, color: "bg-red-500" },
      expired: { label: "Expirada", variant: "destructive" as const, color: "bg-gray-500" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return (
      <Badge variant={config.variant} className="gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  const hasActiveSubscription = subscription && ["active", "trial"].includes(subscription.status);
  const isCancelled = subscription?.status === "cancelled";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Minha Assinatura
          </CardTitle>
          <CardDescription>Gerencie sua assinatura e acesse todos os recursos da plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status atual */}
          {subscription && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status Atual</p>
                  <div className="mt-1">{getStatusBadge(subscription.status)}</div>
                </div>
                {subscription.next_billing_date && hasActiveSubscription && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Próxima Cobrança</p>
                    <p className="font-semibold text-sm">
                      {format(new Date(subscription.next_billing_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {isCancelled && (
                <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Assinatura Cancelada</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Você pode reativar sua assinatura a qualquer momento clicando no botão abaixo.
                    </p>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              {hasActiveSubscription && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={cancelSubscriptionMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    Cancelar Assinatura
                  </Button>
                </div>
              )}

              {isCancelled && (
                <Button
                  onClick={() => reactivateSubscriptionMutation.mutate()}
                  disabled={reactivateSubscriptionMutation.isPending}
                  className="w-full"
                >
                  Reativar Assinatura
                </Button>
              )}
            </div>
          )}

          {/* Seleção de forma de pagamento */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Escolha a Forma de Pagamento</h3>
              <p className="text-sm text-muted-foreground">Selecione como prefere pagar sua assinatura</p>
            </div>
            
            <Tabs defaultValue="pix" className="w-full" onValueChange={(value) => setPaymentMethod(value as "pix" | "card")}>
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-auto p-1">
                <TabsTrigger 
                  value="pix" 
                  className="flex-col items-center gap-2 py-3 text-sm font-medium data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600"
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    <span className="font-bold">PIX</span>
                  </div>
                  <PaymentMethodBadge method="pix" variant="detailed" />
                </TabsTrigger>
                <TabsTrigger 
                  value="card" 
                  className="flex-col items-center gap-2 py-3 text-sm font-medium data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-bold">Cartão</span>
                  </div>
                  <PaymentMethodBadge method="card" variant="detailed" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Planos disponíveis */}
          <div>
            <h3 className="font-semibold mb-4">{hasActiveSubscription ? "Mudar de Plano" : "Escolha seu Plano"}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-red-500 hover:bg-red-600 gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        MAIS POPULAR
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="space-y-1">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">R$ {plan.totalPrice}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        R$ {plan.monthlyPrice.toFixed(2)} por {plan.months} {plan.months === 1 ? "mês" : "meses"}
                      </p>
                      {plan.discount && (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
                          {plan.discount}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan)}
                      disabled={createSubscriptionMutation.isPending}
                    >
                      {paymentMethod === "pix" ? (
                        <><QrCode className="w-4 h-4 mr-2" /> Pagar com PIX</>
                      ) : (
                        <><CreditCard className="w-4 h-4 mr-2" /> Pagar com Cartão</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              <Calendar className="w-4 h-4 inline mr-1" />
              Pagamento seguro processado pelo Mercado Pago
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de cancelamento */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Você perderá o acesso a todos os recursos premium ao final
              do período atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter Assinatura</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelSubscriptionMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de pagamento PIX */}
      {pixData && (
        <PixPaymentDialog
          open={pixDialogOpen}
          onOpenChange={setPixDialogOpen}
          qrCode={pixData.qrCode}
          qrCodeBase64={pixData.qrCodeBase64}
          ticketUrl={pixData.ticketUrl}
          amount={pixData.amount}
          chargeId={pixData.chargeId}
          onPaymentConfirmed={handlePixPaymentConfirmed}
        />
      )}

      {/* Dialog de pagamento com Cartão */}
      {selectedPlan && (
        <CardSubscriptionDialog
          open={cardDialogOpen}
          onOpenChange={setCardDialogOpen}
          plan={{
            id: selectedPlan.id,
            name: selectedPlan.name,
            price: selectedPlan.totalPrice,
            billingFrequency: selectedPlan.id === "monthly" ? "monthly" : selectedPlan.id === "semestral" ? "semiannual" : "annual",
            months: selectedPlan.months,
            monthlyPrice: selectedPlan.monthlyPrice,
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
            setCardDialogOpen(false);
            toast.success("🎉 Assinatura ativada com sucesso!");
          }}
        />
      )}
    </div>
  );
}
