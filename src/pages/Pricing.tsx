import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, Star, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [loading, setLoading] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");

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
        "Gestão financeira"
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
        "1 mês grátis"
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
        "Economia de R$ 194"
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
        const { data: pixData, error: pixError } = await supabase.functions.invoke("generate-pix", {
          body: {
            amount: plan.price,
            customerName: profile?.full_name || session.user.email || "Cliente",
            customerPhone: profile?.phone,
            description: `Assinatura ${plan.name} - Foguete Gestão`,
            metadata: {
              planId: plan.id,
              billingFrequency: plan.billingFrequency,
              months: plan.months
            }
          }
        });

        if (pixError) throw pixError;

        toast({
          title: "QR Code PIX gerado!",
          description: "Use o QR Code para completar o pagamento",
        });

        // Redirect to payment page or show QR code
        // You can create a payment confirmation page here
        
      } else {
        // Process credit card payment with Mercado Pago
        if (!mpLoaded) {
          throw new Error("Mercado Pago não carregado");
        }

        const mp = new window.MercadoPago(import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY);
        
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
          }
        });

        if (prefError) throw prefError;

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
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-warning text-warning-foreground">
            Trial
          </Badge>
          <span className="ml-2 text-muted-foreground">5 dias restantes do período gratuito</span>
        </div>

        {/* Payment Method Tabs */}
        <Tabs defaultValue="pix" className="mb-8" onValueChange={(value) => setPaymentMethod(value as "pix" | "card")}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="pix">PIX</TabsTrigger>
            <TabsTrigger value="card">Cartão de Crédito</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
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
                    {plan.discount && (
                      <Badge className="bg-warning text-warning-foreground">
                        ECONOMIZE {plan.discount}%
                      </Badge>
                    )}
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

        {/* Footer Note */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Todos os planos incluem suporte técnico e atualizações gratuitas</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
