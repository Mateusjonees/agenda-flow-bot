import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Zap, Star, CreditCard, ArrowUpCircle, ArrowDownCircle, Sparkles, Calendar, AlertCircle, Shield, TrendingUp, Gift } from "lucide-react";
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
    <div className="space-y-4 sm:space-y-8 p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Escolha o Melhor Plano
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Gerencie seu negócio com eficiência. Escolha o plano ideal e economize até 17%!
        </p>
      </div>

      {/* Current Subscription Info */}
      {subscription && subscription.status !== "cancelled" && (
        <Card className="border-primary bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {subscription.status === "trial" ? (
                <>
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Período de Teste Gratuito
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 text-primary" />
                  Sua Assinatura Ativa
                </>
              )}
            </CardTitle>
            <CardDescription>
              {subscription.status === "trial" 
                ? "Experimente todos os recursos gratuitamente por 7 dias"
                : "Gerenciamento completo da sua conta"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Plano Atual */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-lg sm:text-xl">
                        {subscription.subscription_plans?.name || (subscription.status === "trial" ? "Período de Teste" : "Plano Atual")}
                      </p>
                      {subscription.status === "trial" ? (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Teste Grátis
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <Check className="w-3 h-3 mr-1" />
                          Plano Ativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {subscription.subscription_plans?.description || ""}
                    </p>
                  </div>
                  {subscription.subscription_plans?.price && (
                    <div className="text-left sm:text-right">
                      <p className="text-2xl sm:text-3xl font-bold text-primary">
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

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div className="bg-background/50 rounded-lg p-3 border">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Início</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {format(new Date(subscription.start_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 border">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {subscription.status === "trial" ? "Fim do Teste" : "Renovação"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">
                      {subscription.next_billing_date 
                        ? format(new Date(subscription.next_billing_date), "dd/MM/yyyy")
                        : "N/A"
                      }
                    </p>
                    {subscription.status === "trial" && subscription.next_billing_date && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        {Math.max(0, Math.ceil((new Date(subscription.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} dias restantes
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Gerenciar Assinatura
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-200">
                        Você pode trocar de plano a qualquer momento. Upgrades são imediatos e downgrades são aplicados no próximo ciclo.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    const plansSection = document.getElementById('plans-section');
                    plansSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Ver Outros Planos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Info */}
      {subscription && subscription.status === "trial" && (
        <Card className="border-amber-500 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex-shrink-0">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-amber-600">
                    {subscription.next_billing_date 
                      ? Math.max(0, Math.ceil((new Date(subscription.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                      : 0
                    }
                  </p>
                  <p className="text-xs text-amber-600">dias</p>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Período de Teste Ativo - Aproveite Gratuitamente!
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-200">
                      Seu teste gratuito termina em {subscription.next_billing_date 
                        ? format(new Date(subscription.next_billing_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
                        : "breve"
                      }. Escolha um plano abaixo para continuar usando todos os recursos após o período de teste.
                    </p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Button 
                    size="sm"
                    onClick={() => {
                      const plansSection = document.getElementById('plans-section');
                      plansSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Escolher Plano Agora
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Tabs */}
      <div id="plans-section" className="space-y-4 sm:space-y-6">
        <div className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Escolha a Forma de Pagamento</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Selecione como prefere pagar sua assinatura</p>
        </div>
        
        <Tabs defaultValue="pix" className="w-full" onValueChange={(value) => setPaymentMethod(value as "pix" | "card")}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 sm:h-14 p-1">
            <TabsTrigger value="pix" className="text-sm sm:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              PIX
            </TabsTrigger>
            <TabsTrigger value="card" className="text-sm sm:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Cartão de Crédito
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlanId === plan.billingFrequency;
          const willUpgrade = subscription && !isCurrentPlan ? isUpgrade(plan.id) : false;

          return (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                plan.popular 
                  ? 'border-2 border-primary shadow-xl scale-105 bg-gradient-to-br from-primary/5 via-transparent to-primary/5' 
                  : isCurrentPlan
                  ? 'border-2 border-primary bg-gradient-to-br from-primary/10 to-transparent'
                  : 'border border-border hover:border-primary/50'
              }`}
            >
              {/* Badge no topo */}
              {plan.popular && !isCurrentPlan && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground text-center py-2.5 font-bold text-sm tracking-wider shadow-lg">
                  ⭐ MAIS ESCOLHIDO
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-600 to-green-500 text-white text-center py-2.5 font-bold text-sm tracking-wider shadow-lg">
                  ✓ SEU PLANO
                </div>
              )}

              {/* Conteúdo do Card */}
              <div className={`p-8 ${(plan.popular || isCurrentPlan) ? 'mt-10' : ''}`}>
                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-xl ${
                    plan.popular || isCurrentPlan ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  {plan.discount && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1 text-xs font-bold">
                      -{plan.discount}%
                    </Badge>
                  )}
                </div>

                {/* Nome e Descrição */}
                <div className="mb-6">
                  <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>

                {/* Preço */}
                <div className="mb-8 pb-6 border-b">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-foreground">
                      R$ {plan.price}
                    </span>
                    {plan.originalPrice && (
                      <div className="flex flex-col">
                        <span className="text-base text-muted-foreground line-through">
                          R$ {plan.originalPrice}
                        </span>
                        <span className="text-xs text-green-600 font-semibold">
                          Economize R$ {plan.originalPrice - plan.price}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Cobrança única de {plan.months} {plan.months === 1 ? 'mês' : 'meses'}
                  </p>
                  <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-sm font-bold">
                      R$ {plan.monthlyPrice.toFixed(2)}/mês
                    </span>
                  </div>
                </div>

                {/* Botão de Ação */}
                <Button
                  className={`w-full mb-6 h-12 font-bold text-base transition-all ${
                    plan.popular && !isCurrentPlan
                      ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary shadow-lg hover:shadow-xl' 
                      : isCurrentPlan
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                  }`}
                  size="lg"
                  onClick={() => handlePlanChange(plan)}
                  disabled={loading || isCurrentPlan}
                  variant={isCurrentPlan ? "default" : "default"}
                >
                  {isCurrentPlan ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Plano Ativo
                    </>
                  ) : loading ? (
                    "Processando..."
                  ) : willUpgrade ? (
                    <>
                      <ArrowUpCircle className="w-5 h-5 mr-2" />
                      Fazer Upgrade Agora
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Escolher Plano
                    </>
                  )}
                </Button>

                {/* Features */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    O que está incluído:
                  </p>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 group">
                      <div className="mt-0.5 rounded-full bg-primary/10 p-1 group-hover:bg-primary/20 transition-colors">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Garantia */}
                {plan.popular && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>Garantia de 7 dias</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Benefícios Adicionais */}
      <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Por que escolher o Foguete Gestão?</CardTitle>
          <CardDescription>Benefícios que fazem a diferença no seu negócio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-3 p-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold">Segurança Garantida</h4>
              <p className="text-sm text-muted-foreground">
                Seus dados protegidos com criptografia de ponta e backups automáticos diários
              </p>
            </div>
            <div className="text-center space-y-3 p-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold">Atualizações Constantes</h4>
              <p className="text-sm text-muted-foreground">
                Novas funcionalidades e melhorias adicionadas mensalmente sem custo extra
              </p>
            </div>
            <div className="text-center space-y-3 p-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold">Suporte Dedicado</h4>
              <p className="text-sm text-muted-foreground">
                Equipe pronta para ajudar por email, chat e WhatsApp durante horário comercial
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Perguntas Frequentes</CardTitle>
          <CardDescription>Tire suas dúvidas sobre os planos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4 py-2">
              <h4 className="font-semibold mb-2">Posso trocar de plano a qualquer momento?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! Upgrades são aplicados imediatamente e você paga apenas a diferença proporcional. 
                Downgrades são aplicados no próximo ciclo de cobrança.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4 py-2">
              <h4 className="font-semibold mb-2">O que acontece se eu cancelar?</h4>
              <p className="text-sm text-muted-foreground">
                Você mantém acesso total até o final do período pago. Após isso, o sistema entra em modo de 
                visualização e seus dados ficam seguros por 90 dias.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4 py-2">
              <h4 className="font-semibold mb-2">Posso pagar com PIX?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! Aceitamos PIX para pagamento à vista. O sistema é liberado automaticamente após a 
                confirmação do pagamento (geralmente em segundos).
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4 py-2">
              <h4 className="font-semibold mb-2">Há taxa de setup ou custos ocultos?</h4>
              <p className="text-sm text-muted-foreground">
                Não! O valor que você vê é o valor final. Sem taxas de setup, sem custos ocultos, 
                sem surpresas na cobrança.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4 py-2">
              <h4 className="font-semibold mb-2">Quanto tempo leva para começar a usar?</h4>
              <p className="text-sm text-muted-foreground">
                Imediatamente após a confirmação do pagamento! Você recebe acesso instantâneo e pode 
                começar a cadastrar seus clientes e serviços na hora.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Garantia */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
            <div className="p-3 bg-green-500/10 rounded-full">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">Garantia de 7 Dias</h4>
              <p className="text-sm text-muted-foreground">
                Não gostou? Devolvemos 100% do seu dinheiro, sem perguntas. 
                Experimente sem riscos!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
