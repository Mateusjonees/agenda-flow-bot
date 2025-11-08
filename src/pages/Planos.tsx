import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Zap, Star, CreditCard, ArrowUpCircle, ArrowDownCircle, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PixPaymentDialog } from "@/components/PixPaymentDialog";
import { parseFunctionsError } from "@/lib/parseFunctionsError";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  monthlyPrice: number;
  billingFrequency: "monthly" | "semiannual" | "annual";
  months: number;
  discount?: number;
  popular?: boolean;
  icon: any;
  features: string[];
}

const Planos = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
    amount: number;
  } | null>(null);

  const plans: PricingPlan[] = [
    {
      id: "monthly",
      name: "Mensal",
      description: "Ideal para começar",
      price: 97,
      monthlyPrice: 97,
      billingFrequency: "monthly",
      months: 1,
      icon: Zap,
      features: [
        "Acesso completo ao sistema",
        "Agendamentos ilimitados",
        "Propostas e CRM",
        "Gestão financeira",
        "Controle de estoque",
        "Suporte por email"
      ]
    },
    {
      id: "semiannual",
      name: "Semestral",
      description: "7 meses pelo preço de 6",
      price: 582,
      originalPrice: 679,
      monthlyPrice: 83.14,
      billingFrequency: "semiannual",
      months: 7,
      discount: 14,
      popular: true,
      icon: Star,
      features: [
        "Tudo do plano mensal",
        "1 mês grátis",
        "Economia de R$ 97",
        "Suporte prioritário",
        "Atualizações antecipadas"
      ]
    },
    {
      id: "annual",
      name: "Anual",
      description: "14 meses pelo preço de 12",
      price: 1164,
      originalPrice: 1358,
      monthlyPrice: 83.14,
      billingFrequency: "annual",
      months: 14,
      discount: 17,
      icon: CreditCard,
      features: [
        "Tudo do plano mensal",
        "2 meses grátis",
        "Economia de R$ 194",
        "Suporte prioritário VIP",
        "Consultoria mensal",
        "Acesso beta features"
      ]
    }
  ];

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: subscription, refetch: refetchSubscription } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    loadMercadoPagoScript();
  }, []);

  const loadMercadoPagoScript = () => {
    if (window.MercadoPago) {
      setMpLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => setMpLoaded(true);
    document.body.appendChild(script);
  };

  const getCurrentPlanValue = (planId: string) => {
    const planIndex = plans.findIndex(p => p.id === planId);
    return planIndex;
  };

  const getNewPlanValue = (planId: string) => {
    const planIndex = plans.findIndex(p => p.id === planId);
    return planIndex;
  };

  const isUpgrade = (newPlanId: string) => {
    if (!subscription?.subscription_plans) return true;
    const currentValue = getCurrentPlanValue(subscription.subscription_plans.billing_frequency || "monthly");
    const newValue = getNewPlanValue(newPlanId);
    return newValue > currentValue;
  };

  const handlePlanChange = async (plan: PricingPlan) => {
    if (!subscription || subscription.status === "cancelled") {
      // Nova assinatura
      await handleSubscribe(plan);
      return;
    }

    // Verificar se é upgrade ou downgrade
    if (isUpgrade(plan.id)) {
      await handleSubscribe(plan);
    } else {
      setSelectedPlan(plan);
      setDowngradeDialogOpen(true);
    }
  };

  const confirmDowngrade = async () => {
    if (!selectedPlan || !subscription) return;
    
    setLoading(true);
    try {
      // Atualizar assinatura para o novo plano (efetivo na próxima renovação)
      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan_id: selectedPlan.id,
        })
        .eq("id", subscription.id);

      if (error) throw error;

      toast.success("Plano alterado! A mudança será efetiva na próxima renovação.");
      refetchSubscription();
      setDowngradeDialogOpen(false);
    } catch (error: any) {
      console.error("Error downgrading:", error);
      toast.error(error.message || "Erro ao alterar plano");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: PricingPlan) => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (paymentMethod === "pix") {
        const { data: pixResponse, error: pixError } = await supabase.functions.invoke("generate-pix", {
          body: {
            amount: plan.price,
            customerName: profile?.full_name || session.user.email || "Cliente",
            customerPhone: profile?.phone,
            description: `Assinatura ${plan.name} - Foguete Gestão`,
            metadata: {
              planId: plan.id,
              billingFrequency: plan.billingFrequency,
              months: plan.months,
              userId: session.user.id
            }
          }
        });

        if (pixError) {
          const { message } = await parseFunctionsError(pixError);
          throw new Error(message);
        }

        setPixData({
          qrCode: pixResponse.qrCode,
          qrCodeBase64: pixResponse.qrCodeBase64,
          ticketUrl: pixResponse.ticketUrl,
          amount: plan.price
        });
        setPixDialogOpen(true);
        toast.success("QR Code PIX gerado com sucesso!");
        
      } else {
        if (!mpLoaded) {
          throw new Error("Mercado Pago não carregado");
        }

        const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
        if (!publicKey || publicKey === "TEST-your-public-key") {
          throw new Error("Chave pública do Mercado Pago não configurada");
        }

        const mp = new window.MercadoPago(publicKey);
        
        const { data: preferenceData, error: prefError } = await supabase.functions.invoke("create-mp-preference", {
          body: {
            title: `Assinatura ${plan.name}`,
            quantity: 1,
            unit_price: plan.price,
            description: plan.description,
            payer: {
              email: session.user.email,
              name: profile?.full_name
            },
            metadata: {
              planId: plan.id,
              billingFrequency: plan.billingFrequency,
              months: plan.months,
              userId: session.user.id
            }
          }
        });

        if (prefError) {
          const { message } = await parseFunctionsError(prefError);
          throw new Error(message);
        }

        mp.checkout({
          preference: {
            id: preferenceData.preferenceId
          },
          autoOpen: true
        });
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlanId = () => {
    if (!subscription?.subscription_plans?.billing_frequency) return null;
    return subscription.subscription_plans.billing_frequency;
  };

  const currentPlanId = getCurrentPlanId();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Planos e Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e faça upgrade ou downgrade</p>
      </div>

      {/* Current Subscription Info */}
      {subscription && subscription.status !== "cancelled" && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Seu Plano Atual
            </CardTitle>
            <CardDescription>Informações da sua assinatura ativa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-lg">
                    {subscription.subscription_plans?.name || "Plano Atual"}
                  </p>
                  <Badge variant="default">Ativo</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription.subscription_plans?.description || ""}
                </p>
                {subscription.next_billing_date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Renova em: {format(new Date(subscription.next_billing_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
              {subscription.subscription_plans?.price && (
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(subscription.subscription_plans.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    /{subscription.subscription_plans.billing_frequency === "monthly" ? "mês" : "período"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Tabs */}
      <Tabs defaultValue="pix" className="w-full" onValueChange={(value) => setPaymentMethod(value as "pix" | "card")}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
          <TabsTrigger value="pix" className="text-base font-medium">PIX</TabsTrigger>
          <TabsTrigger value="card" className="text-base font-medium">Cartão de Crédito</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlanId === plan.billingFrequency;
          const willUpgrade = subscription && !isCurrentPlan ? isUpgrade(plan.id) : false;

          return (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                plan.popular 
                  ? 'border-primary shadow-md scale-105' 
                  : isCurrentPlan
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              {plan.popular && !isCurrentPlan && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-2 font-semibold text-sm">
                  MAIS POPULAR
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-2 font-semibold text-sm">
                  SEU PLANO ATUAL
                </div>
              )}

              <div className={`p-6 ${(plan.popular || isCurrentPlan) ? 'mt-10' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-10 h-10 text-primary" />
                  {plan.discount && (
                    <Badge className="bg-warning text-warning-foreground">
                      ECONOMIZE {plan.discount}%
                    </Badge>
                  )}
                </div>

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-bold">R$ {plan.price}</span>
                    {plan.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        R$ {plan.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    por {plan.months} {plan.months === 1 ? 'mês' : 'meses'}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    R$ {plan.monthlyPrice.toFixed(2)}/mês
                  </p>
                </div>

                <Button
                  className={`w-full mb-6 ${
                    plan.popular && !isCurrentPlan
                      ? 'bg-primary hover:bg-primary-hover' 
                      : ''
                  }`}
                  size="lg"
                  onClick={() => handlePlanChange(plan)}
                  disabled={loading || isCurrentPlan}
                  variant={isCurrentPlan ? "outline" : "default"}
                >
                  {isCurrentPlan ? (
                    "Plano Atual"
                  ) : loading ? (
                    "Processando..."
                  ) : willUpgrade ? (
                    <>
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      Fazer Upgrade
                    </>
                  ) : (
                    <>
                      <ArrowDownCircle className="w-4 h-4 mr-2" />
                      Alterar Plano
                    </>
                  )}
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Downgrade Confirmation Dialog */}
      <AlertDialog open={downgradeDialogOpen} onOpenChange={setDowngradeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar para plano inferior?</AlertDialogTitle>
            <AlertDialogDescription>
              A alteração para o plano {selectedPlan?.name} será efetiva no final do período atual da sua assinatura.
              Você continuará com acesso total até lá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDowngrade}>
              Confirmar Alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PIX Payment Dialog */}
      {pixData && (
        <PixPaymentDialog
          open={pixDialogOpen}
          onOpenChange={setPixDialogOpen}
          qrCode={pixData.qrCode}
          qrCodeBase64={pixData.qrCodeBase64}
          ticketUrl={pixData.ticketUrl}
          amount={pixData.amount}
        />
      )}
    </div>
  );
};

export default Planos;
