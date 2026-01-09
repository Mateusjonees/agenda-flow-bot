import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, Star, CreditCard, ArrowLeft, QrCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PixPaymentDialog } from "@/components/PixPaymentDialog";
import { parseFunctionsError } from "@/lib/parseFunctionsError";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { MERCADO_PAGO_PUBLIC_KEY } from "@/config/mercadoPago";

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

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, isTrial, daysRemaining } = useSubscriptionStatus();
  const [loading, setLoading] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
    amount: number;
    chargeId?: string;
  } | null>(null);

  const plans: PricingPlan[] = [
    {
      id: "monthly",
      name: "Mensal",
      description: "Ideal para começar",
      price: 49,
      monthlyPrice: 49,
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
      description: "6 meses com desconto",
      price: 259,
      originalPrice: 294,
      monthlyPrice: 43.17,
      billingFrequency: "semiannual",
      months: 6,
      discount: 12,
      popular: true,
      icon: Star,
      features: [
        "Tudo do plano mensal",
        "Economia de R$ 35",
        "Suporte prioritário",
        "Atualizações antecipadas"
      ]
    },
    {
      id: "annual",
      name: "Anual",
      description: "12 meses com o melhor desconto",
      price: 475,
      originalPrice: 588,
      monthlyPrice: 39.58,
      billingFrequency: "annual",
      months: 12,
      discount: 19,
      icon: CreditCard,
      features: [
        "Tudo do plano mensal",
        "Economia de R$ 113",
        "Suporte prioritário VIP",
        "Consultoria mensal",
        "Acesso beta features"
      ]
    }
  ];

  useEffect(() => {
    checkAuth();
    loadMercadoPagoScript();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

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

  const handleSubscribe = async (plan: PricingPlan) => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (paymentMethod === "pix") {
        // Create PIX charge via edge function
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
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: (supabase as any).rest?.headers?.apikey || import.meta.env.VITE_SUPABASE_ANON_KEY || ""
          }
        });

        if (pixError) {
          const { status, message } = await parseFunctionsError(pixError);
          throw new Error(status ? `(${status}) ${message}` : message);
        }

        setPixData({
          qrCode: pixResponse.qrCode,
          qrCodeBase64: pixResponse.qrCodeBase64,
          ticketUrl: pixResponse.ticketUrl,
          amount: plan.price,
          chargeId: pixResponse.chargeId
        });
        setPixDialogOpen(true);

        toast({
          title: "QR Code PIX gerado!",
          description: "Escaneie o QR Code ou copie o código para pagar",
        });
        
      } else {
        // Process credit card payment with Mercado Pago
        if (!mpLoaded) {
          throw new Error("Mercado Pago não carregado");
        }

        const publicKey = MERCADO_PAGO_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error("Chave pública do Mercado Pago não configurada.");
        }

        const mp = new window.MercadoPago(publicKey);
        
        // Create preference via edge function
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
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: (supabase as any).rest?.headers?.apikey || import.meta.env.VITE_SUPABASE_ANON_KEY || ""
          }
        });

        if (prefError) {
          const { status, message } = await parseFunctionsError(prefError);
          throw new Error(status ? `(${status}) ${message}` : message);
        }

        // Redirect to Mercado Pago checkout
        mp.checkout({
          preference: {
            id: preferenceData.preferenceId
          },
          autoOpen: true
        });
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          {isTrial ? (
            <>
              <Badge className="mb-4 bg-warning text-warning-foreground">
                Trial
              </Badge>
              <div className="text-muted-foreground mt-2">
                <p className="text-lg font-semibold">{daysRemaining} dias restantes do período gratuito</p>
                {subscription?.start_date && (
                  <p className="text-sm mt-1">
                    Expira em: {new Date(new Date(subscription.start_date as string).getTime() + (7 * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </>
          ) : subscription?.status === 'active' ? (
            <>
              <Badge className="mb-4 bg-success text-success-foreground">
                Plano Ativo
              </Badge>
              <div className="text-muted-foreground mt-2">
                {subscription?.next_billing_date && (
                  <>
                    <p className="text-lg font-semibold">{daysRemaining} dias até a próxima cobrança</p>
                    <p className="text-sm mt-1">
                      Renova em: {new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}
                    </p>
                  </>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Payment Method Tabs */}
        <Tabs defaultValue="pix" className="mb-8" onValueChange={(value) => setPaymentMethod(value as "pix" | "card")}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
            <TabsTrigger value="pix" className="text-base font-medium">PIX</TabsTrigger>
            <TabsTrigger value="card" className="text-base font-medium">Cartão de Crédito</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const PaymentIcon = paymentMethod === "pix" ? QrCode : CreditCard;
            return (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  plan.popular 
                    ? 'border-primary shadow-md scale-105' 
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-2 font-semibold">
                    MAIS POPULAR
                  </div>
                )}

                <div className={`p-6 ${plan.popular ? 'mt-10' : ''}`}>
                  {/* Icon and Discount Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-10 h-10 text-primary" />
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <PaymentIcon className="w-3 h-3" />
                        {paymentMethod === "pix" ? "PIX" : "Cartão"}
                      </Badge>
                      {plan.discount && (
                        <Badge className="bg-warning text-warning-foreground">
                          ECONOMIZE {plan.discount}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                  {/* Price */}
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

                  {/* CTA Button */}
                  <Button
                    className={`w-full mb-6 ${
                      plan.popular 
                        ? 'bg-primary hover:bg-primary-hover' 
                        : ''
                    }`}
                    size="lg"
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading}
                  >
                    {loading ? "Processando..." : "Assinar Agora"}
                  </Button>

                  {/* Features */}
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

        {/* PIX Payment Dialog */}
        {pixData && (
          <PixPaymentDialog
            open={pixDialogOpen}
            onOpenChange={setPixDialogOpen}
            qrCode={pixData.qrCode}
            qrCodeBase64={pixData.qrCodeBase64}
            ticketUrl={pixData.ticketUrl}
            amount={pixData.amount}
            chargeId={pixData.chargeId}
            onPaymentConfirmed={() => {
              // Atualizar estado local se necessário
              console.log("[Pricing] Payment confirmed callback");
            }}
          />
        )}

      </div>
    </div>
  );
};

export default Pricing;
