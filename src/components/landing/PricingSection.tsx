import { motion } from "framer-motion";
import { Check, Star, Rocket, Crown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingSectionProps {
  onGetStarted: () => void;
}

const plans = [
  {
    name: "Mensal",
    icon: Zap,
    price: "R$ 49",
    period: "/mês",
    description: "Perfeito para começar",
    features: [
      "Agendamentos ilimitados",
      "Gestão de clientes",
      "WhatsApp automático",
      "Controle financeiro básico",
      "Suporte por email",
    ],
    popular: false,
    color: "from-slate-500 to-gray-600",
  },
  {
    name: "Semestral",
    icon: Star,
    price: "R$ 259",
    period: "/6 meses",
    originalPrice: "R$ 294",
    savings: "Economize R$ 35",
    description: "Mais popular",
    features: [
      "Tudo do plano Mensal",
      "Relatórios avançados",
      "Propostas profissionais",
      "Integração PIX completa",
      "Suporte prioritário",
      "Cartão fidelidade digital",
    ],
    popular: true,
    color: "from-primary to-accent",
  },
  {
    name: "Anual",
    icon: Crown,
    price: "R$ 475",
    period: "/ano",
    originalPrice: "R$ 588",
    savings: "Economize R$ 113",
    description: "Melhor custo-benefício",
    features: [
      "Tudo do Semestral",
      "API personalizada",
      "Treinamento dedicado",
      "Suporte VIP 24/7",
      "Consultoria mensal",
      "Backup dedicado",
    ],
    popular: false,
    color: "from-amber-500 to-orange-500",
  },
];

const PricingSection = ({ onGetStarted }: PricingSectionProps) => {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-muted/30">
      <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="px-4 py-2 mb-6 bg-primary/10 text-primary border-primary/30">
              <Rocket className="w-4 h-4 mr-2" />
              Planos e Preços
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              Escolha seu <span className="text-gradient-primary">plano</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Todos os planos incluem 7 dias de teste grátis. Sem compromisso.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative rounded-2xl bg-card border-2 overflow-hidden flex flex-col",
                  plan.popular
                    ? "border-primary shadow-2xl scale-105 z-10"
                    : "border-border hover:border-primary/50 hover:shadow-lg"
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
                )}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1.5 shadow-lg">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                {/* Content */}
                <div className="p-8 pt-10 flex-1 flex flex-col">
                  {/* Plan Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                        <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          {plan.savings}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={onGetStarted}
                    size="lg"
                    className={cn(
                      "w-full mb-6",
                      plan.popular
                        ? "bg-primary hover:bg-primary/90 shadow-lg"
                        : "bg-muted hover:bg-primary hover:text-primary-foreground"
                    )}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Começar Teste Grátis
                  </Button>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-500" />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust Note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-muted-foreground mt-10"
          >
            ✓ Sem cartão de crédito &nbsp;•&nbsp; ✓ Cancele quando quiser &nbsp;•&nbsp; ✓ Suporte em português
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
