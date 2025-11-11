import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, Star, CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    monthlyPrice: 97,
    totalPrice: 97,
    months: 1,
    features: [
      "Agendamentos ilimitados",
      "Gestão de clientes",
      "Controle financeiro",
      "Relatórios básicos",
      "Suporte por email"
    ]
  },
  {
    id: "semestral",
    name: "Semestral",
    monthlyPrice: 83,
    totalPrice: 582,
    months: 7,
    discount: "Economize 14%",
    popular: true,
    features: [
      "Todos os recursos do Mensal",
      "Relatórios avançados",
      "Integração WhatsApp",
      "Suporte prioritário",
      "Backup automático",
      "2 meses grátis"
    ]
  },
  {
    id: "annual",
    name: "Anual",
    monthlyPrice: 83,
    totalPrice: 1164,
    months: 14,
    discount: "Economize 17%",
    features: [
      "Todos os recursos do Semestral",
      "API personalizada",
      "Treinamento exclusivo",
      "Consultor dedicado",
      "4 meses grátis"
    ]
  }
];

export function SubscriptionManager() {
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  // Buscar assinatura atual
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["current-subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

  // Criar assinatura
  const createSubscriptionMutation = useMutation({
    mutationFn: async (planType: PlanType) => {
      const { data, error } = await supabase.functions.invoke("create-subscription-preference", {
        body: { planType },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar assinatura");
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

  // Reativar assinatura
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!subscription?.id) throw new Error("Assinatura não encontrada");

      const { data, error } = await supabase.functions.invoke("reactivate-subscription", {
        body: { subscriptionId: subscription.id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.paymentUrl) {
        toast.success("Redirecionando para o pagamento...");
        // Redirecionar para o Mercado Pago
        window.location.href = data.paymentUrl;
      } else {
        toast.success("Assinatura reativada com sucesso");
        queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
      }
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

  const hasActiveSubscription = subscription && ['active', 'trial'].includes(subscription.status);
  const isCancelled = subscription?.status === 'cancelled';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Minha Assinatura
          </CardTitle>
          <CardDescription>
            Gerencie sua assinatura e acesse todos os recursos da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status atual */}
          {subscription && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status Atual</p>
                  <div className="mt-1">
                    {getStatusBadge(subscription.status)}
                  </div>
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

          {/* Planos disponíveis */}
          <div>
            <h3 className="font-semibold mb-4">
              {hasActiveSubscription ? "Mudar de Plano" : "Escolha seu Plano"}
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
                >
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
                        <span className="text-3xl font-bold">
                          R$ {plan.totalPrice}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        R$ {plan.monthlyPrice} por {plan.months} {plan.months === 1 ? 'mês' : 'meses'}
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
                      onClick={() => createSubscriptionMutation.mutate(plan.id)}
                      disabled={createSubscriptionMutation.isPending}
                    >
                      {hasActiveSubscription ? "Mudar para este plano" : "Assinar Agora"}
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
              Tem certeza que deseja cancelar sua assinatura? Você perderá o acesso a todos os recursos premium ao final do período atual.
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
    </div>
  );
}
