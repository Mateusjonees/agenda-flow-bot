import { memo } from "react";
import { Check, Star, Crown, Zap } from "lucide-react";
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
    description: "Ideal para começar",
    features: ["Acesso completo", "Agendamentos ilimitados", "Propostas e CRM", "Gestão financeira"],
    popular: false,
    color: "bg-slate-500"
  },
  {
    name: "Semestral",
    icon: Star,
    price: "R$ 259",
    period: "/6 meses",
    originalPrice: "R$ 294",
    savings: "Economize R$ 35",
    description: "6 meses com desconto",
    features: ["Tudo do mensal", "Economia de R$ 35", "Suporte prioritário", "Atualizações antecipadas"],
    popular: true,
    color: "bg-primary"
  },
  {
    name: "Anual",
    icon: Crown,
    price: "R$ 475",
    period: "/ano",
    originalPrice: "R$ 588",
    savings: "Economize R$ 113",
    description: "Melhor custo-benefício",
    features: ["Tudo do mensal", "Economia de R$ 113", "Suporte VIP", "Consultoria mensal"],
    popular: false,
    color: "bg-amber-500"
  }
];

const PricingSection = memo(({ onGetStarted }: PricingSectionProps) => {
  return (
    <section id="pricing" className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                "relative rounded-2xl bg-card border-2 p-5 flex flex-col",
                plan.popular ? "border-primary shadow-xl md:scale-105 z-10" : "border-border"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-2xl" />
              )}
              
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-9 h-9 rounded-lg ${plan.color} flex items-center justify-center`}>
                  <plan.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground line-through">{plan.originalPrice}</span>
                    <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0">
                      {plan.savings}
                    </Badge>
                  </div>
                )}
              </div>

              <Button
                onClick={onGetStarted}
                size="sm"
                className={cn("w-full mb-4", plan.popular ? "bg-primary" : "")}
                variant={plan.popular ? "default" : "outline"}
              >
                Começar Grátis
              </Button>

              <ul className="space-y-2 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-emerald-500" />
                    </div>
                    <span className="text-xs text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-8">
          ✓ Sem cartão de crédito • ✓ Cancele quando quiser • ✓ Suporte em português
        </p>
      </div>
    </section>
  );
});

PricingSection.displayName = "PricingSection";
export default PricingSection;
