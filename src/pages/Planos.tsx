import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Zap, Star, CreditCard, ArrowUpCircle, ArrowDownCircle, Sparkles, Calendar, AlertCircle, Shield, TrendingUp, Gift, QrCode, Receipt } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PixPaymentDialog } from "@/components/PixPaymentDialog";
import { parseFunctionsError } from "@/lib/parseFunctionsError";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useConfetti } from "@/hooks/useConfetti";
import { PaymentMethodBadge } from "@/components/PaymentMethodBadge";

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
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
    amount: number;
  } | null>(null);
  const previousPendingPixRef = useRef<any>(null);
  const { fireCelebration, fireSuccess } = useConfetti();
  const [justPaidPix, setJustPaidPix] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

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
      // @ts-ignore - Buscar assinatura da PLATAFORMA usando critérios consistentes
      const { data } = await supabase
        .from("subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user.id)
        .is("customer_id", null)  // ✅ Critério consistente para plataforma
        .is("plan_id", null)      // ✅ Critério consistente para plataforma
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user,
  });

  // Buscar PIX pendente
  const { data: pendingPix, refetch: refetchPendingPix } = useQuery({
    queryKey: ["pending-platform-pix", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("pix_charges")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .is("subscription_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Filtrar por metadata.type = platform_subscription
      if (data && data.metadata && (data.metadata as any).type === "platform_subscription") {
        return data as any;
      }
      return null;
    },
    enabled: !!user,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Buscar PIX pago recentemente (últimas 2 horas) para mostrar card verde
  const { data: recentPaidPix } = useQuery({
    queryKey: ["recent-paid-platform-pix", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("pix_charges")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .gte("updated_at", twoHoursAgo)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Filtrar por metadata.type = platform_subscription
      if (data && data.metadata && (data.metadata as any).type === "platform_subscription") {
        return data as any;
      }
      return null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    loadMercadoPagoScript();
  }, []);

  // Monitorar confirmação automática de PIX
  useEffect(() => {
    // Se havia um PIX pendente antes e agora não há mais, significa que foi confirmado
    if (previousPendingPixRef.current && !pendingPix) {
      // Disparar confete
      setTimeout(() => {
        fireCelebration();
      }, 500);
      
      toast.success("🎉 Pagamento Confirmado!", {
        description: "Seu plano foi ativado com sucesso. Bem-vindo!",
        duration: 5000,
      });
      
      // Atualizar a subscription
      refetchSubscription();
    }
    
    // Atualizar referência
    previousPendingPixRef.current = pendingPix;
  }, [pendingPix, refetchSubscription, fireCelebration]);

  // Realtime: Monitorar mudanças na subscription
  // Realtime subscription para PIX payments
  useEffect(() => {
    if (!user?.id) return;

    const pixChannel = supabase
      .channel('pix-payment-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pix_charges',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('PIX atualizado:', payload);
          
          // Se o PIX foi pago agora
          if (payload.new.status === 'paid' && payload.old.status !== 'paid') {
            console.log('🎉 Pagamento PIX confirmado!');
            
            // Dispara confetti
            fireSuccess();
            
            // Marca este PIX como recém-pago
            setJustPaidPix(payload.new.id);
            
            // Mostra toast de parabéns
            toast.success("🎉 Parabéns! Seu pagamento foi confirmado!", {
              description: "Sua assinatura está ativa. Aproveite todos os recursos!",
              duration: 5000,
            });
            
            // Recarrega os dados da subscription
            refetchSubscription();
            refetchPendingPix();
            
            // Remove a marcação após 10 segundos
            setTimeout(() => {
              setJustPaidPix(null);
            }, 10000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pixChannel);
    };
  }, [user?.id, fireSuccess, refetchSubscription, refetchPendingPix]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Subscription changed:', payload);
          
          // Se foi uma inserção ou atualização, refetch
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            refetchSubscription();
            
            // Se status mudou para active
            if (payload.new && (payload.new as any).status === 'active') {
              // Disparar confete
              setTimeout(() => {
                fireCelebration();
              }, 500);
              
              toast.success("✅ Plano Ativado!", {
                description: "Seu plano está ativo e pronto para uso!",
                duration: 5000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchSubscription, fireCelebration]);

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

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: {
          subscriptionId: subscription.id
        }
      });

      if (error) {
        const { message } = await parseFunctionsError(error);
        throw new Error(message);
      }

      toast.success("Assinatura cancelada com sucesso. Você ainda tem acesso até o fim do período pago.");
      refetchSubscription();
      setCancelDialogOpen(false);
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      toast.error(error.message || "Erro ao cancelar assinatura");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!user) return;
    
    setVerifyingPayment(true);
    try {
      console.log("🔍 Verificando status do pagamento...");
      
      // Chama a função que verifica pagamentos pendentes no Mercado Pago
      const { data, error } = await supabase.functions.invoke('check-pending-platform-payments');
      
      if (error) {
        const parsed = await parseFunctionsError(error);
        console.error("Erro ao verificar pagamento:", parsed);
        throw new Error(parsed.message);
      }
      
      console.log("✅ Verificação concluída:", data);
      
      // Atualiza os dados
      await refetchSubscription();
      await refetchPendingPix();
      
      toast.success("Verificação concluída!", {
        description: data?.processed > 0 
          ? "Seu pagamento foi confirmado e sua assinatura está ativa!" 
          : "Aguardando confirmação do pagamento.",
      });
    } catch (error: any) {
      console.error("Erro ao verificar pagamento:", error);
      toast.error("Erro ao verificar pagamento", {
        description: error.message || "Tente novamente em alguns instantes.",
      });
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      toast.error("É necessário estar autenticado");
      navigate("/auth");
      return;
    }

    setLoading(true);
    setSelectedPlan(plan);

    try {
      if (paymentMethod === "pix") {
        console.log("💳 Gerando PIX para plano:", plan.id);
        
        const { data, error } = await supabase.functions.invoke('generate-pix', {
          body: {
            amount: plan.price,
            customerName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Cliente",
            description: `Assinatura ${plan.billingFrequency} - Plano Foguetinho`,
            metadata: {
              userId: user.id,
              planId: plan.id,
              planName: plan.name,
              billingFrequency: plan.billingFrequency,
              months: plan.months,
              type: "platform_subscription"
            }
          }
        });

        if (error) {
          const parsed = await parseFunctionsError(error);
          throw new Error(parsed.message);
        }

        console.log("✅ PIX gerado:", data);
        
        setPixData({
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64,
          ticketUrl: data.ticketUrl,
          amount: plan.price
        });
        setPixDialogOpen(true);
        
        // Inicia polling mais agressivo
        refetchPendingPix();
        
      } else {
        // Pagamento com cartão via Mercado Pago
        console.log("💳 Processando pagamento com cartão:", plan.id);
        
        const { data, error } = await supabase.functions.invoke('create-subscription-preference', {
          body: {
            plan_id: plan.id,
            plan_name: plan.name,
            price: plan.price,
            billing_frequency: plan.billingFrequency,
            months: plan.months,
            user_id: user.id
          }
        });

        if (error) {
          const parsed = await parseFunctionsError(error);
          throw new Error(parsed.message);
        }

        if (data.init_point) {
          window.location.href = data.init_point;
        } else {
          throw new Error("Link de pagamento não foi gerado");
        }
      }
    } catch (error: any) {
      console.error("Erro ao processar assinatura:", error);
      toast.error("Erro ao processar pagamento", {
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlanId = () => {
    if (!subscription?.subscription_plans?.billing_frequency) return null;
    // Só retorna o plano se a assinatura estiver ativa ou em trial
    if (subscription.status === "cancelled" || subscription.status === "expired") return null;
    return subscription.subscription_plans.billing_frequency;
  };

  const currentPlanId = getCurrentPlanId();

  return (
    <div className="space-y-4 sm:space-y-8 p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Plano Foguetinho
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Gerencie seu plano e aproveite todos os recursos. Economize até 17%!
        </p>
      </div>

      {/* Pending PIX Payment - Só mostra se NÃO tem assinatura ativa e não acabou de pagar */}
      {pendingPix && !justPaidPix && (!subscription || subscription.status !== 'active') && (
        <Card className="border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <QrCode className="h-5 w-5" />
              Pagamento PIX Pendente
            </CardTitle>
            <CardDescription>
              Aguardando confirmação do pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-background rounded-lg border">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(pendingPix.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Plano:</span>
                  <span className="font-semibold">
                    {(pendingPix.metadata as any)?.planName || "Plataforma"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Criado em:</span>
                  <span className="text-sm">
                    {format(new Date(pendingPix.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setPixData({
                    qrCode: pendingPix.qr_code,
                    qrCodeBase64: (pendingPix.metadata as any)?.qr_code_base64,
                    ticketUrl: (pendingPix.metadata as any)?.ticket_url,
                    amount: pendingPix.amount
                  });
                  setPixDialogOpen(true);
                }}
                variant="outline"
                className="flex-1"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Ver QR Code
              </Button>
              
              {(pendingPix.metadata as any)?.ticket_url && (
                <Button
                  onClick={() => window.open((pendingPix.metadata as any).ticket_url, '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Ver Boleto
                </Button>
              )}
            </div>
            
            <Button
              onClick={handleVerifyPayment}
              disabled={verifyingPayment}
              className="w-full"
              variant="default"
            >
              {verifyingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verificando...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Já paguei - Verificar Status
                </>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground text-center">
              A confirmação automática pode levar alguns minutos. Clique no botão acima se já pagou.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Verde - PIX Pago Recentemente */}
      {(recentPaidPix || justPaidPix) && !pendingPix && (
        <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Check className="h-5 w-5" />
              ✓ Pagamento Confirmado
            </CardTitle>
            <CardDescription>
              Seu pagamento foi processado com sucesso!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-background rounded-lg border border-green-200 dark:border-green-800">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(recentPaidPix?.amount || 97)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plano:</span>
                  <span className="font-semibold">
                    {(recentPaidPix?.metadata as any)?.planName || "Plataforma"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className="bg-green-500 hover:bg-green-500 text-white">
                    <Check className="h-3 w-3 mr-1" />
                    Pago
                  </Badge>
                </div>
                {recentPaidPix?.updated_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Confirmado em:</span>
                    <span className="text-sm">
                      {format(new Date(recentPaidPix.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center text-sm text-green-600 dark:text-green-400">
              🎉 Sua assinatura está ativa! Aproveite todos os recursos.
            </div>
          </CardContent>
        </Card>
      )}


      {/* Cancelled Subscription Info */}
      {subscription && subscription.status === "cancelled" && (
        <Card className="border-amber-500 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              Assinatura Cancelada
            </CardTitle>
            <CardDescription>
              {subscription.next_billing_date ? (
                <>
                  Você ainda tem acesso até{" "}
                  <span className="font-semibold text-foreground">
                    {format(new Date(subscription.next_billing_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </>
              ) : (
                "Sua assinatura foi cancelada"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Renove sua assinatura
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-200">
                    Escolha um plano abaixo para renovar seu acesso e continuar usando todos os recursos da plataforma.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => {
                  const plansSection = document.getElementById('plans-section');
                  plansSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Renovar Assinatura
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Compacto de Ações - Apenas para assinaturas ativas (não trial, não cancelada, não expirada) */}
      {subscription && subscription.status === "active" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium">Ações da Assinatura</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  size="sm"
                  onClick={() => {
                    const plansSection = document.getElementById('plans-section');
                    plansSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Trocar Plano
                </Button>
                <Button 
                  size="sm"
                  variant="outline" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate("/historico-pagamentos")}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Histórico
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {subscription && subscription.status === "trial" && (() => {
        const endDate = new Date(subscription.next_billing_date || new Date());
        const today = new Date();
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        
        return (
          <Card className={`border-amber-500/50 ${daysRemaining <= 3 ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-900 dark:text-amber-100">
                    {daysRemaining <= 3 
                      ? `⚠️ Seu teste termina em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}!`
                      : 'Escolha um plano para continuar após o teste'
                    }
                  </span>
                </div>
                <Button 
                  onClick={() => {
                    const plansSection = document.getElementById('plans-section');
                    plansSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={daysRemaining <= 3 ? 'bg-amber-600 hover:bg-amber-700' : ''}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Escolher Plano
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Payment Method Tabs */}
      <div id="plans-section" className="space-y-4 sm:space-y-6">
        <div className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Escolha a Forma de Pagamento</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Selecione como prefere pagar sua assinatura</p>
        </div>
        
        <Tabs defaultValue="pix" className="w-full" onValueChange={(value) => setPaymentMethod(value as "pix" | "card")}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-auto p-1">
            <TabsTrigger 
              value="pix" 
              className="flex-col items-center gap-2 py-3 text-sm sm:text-base font-medium data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600 data-[state=active]:border-orange-500/30"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                <span className="font-bold">PIX</span>
              </div>
              <PaymentMethodBadge method="pix" variant="detailed" />
            </TabsTrigger>
            <TabsTrigger 
              value="card" 
              className="flex-col items-center gap-2 py-3 text-sm sm:text-base font-medium data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 data-[state=active]:border-blue-500/30"
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

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Cancelar Assinatura?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                Tem certeza que deseja cancelar sua assinatura? 
              </p>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  ⚠️ O que acontece após o cancelamento:
                </p>
                <ul className="text-sm space-y-1.5 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Você mantém acesso até {subscription?.next_billing_date ? format(new Date(subscription.next_billing_date), "dd/MM/yyyy") : "o fim do período pago"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Não haverá cobrança automática após essa data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Você pode reativar sua assinatura a qualquer momento</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm font-medium">
                Sentiremos sua falta! Tem certeza?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter assinatura</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelSubscription} 
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? "Cancelando..." : "Sim, cancelar assinatura"}
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
