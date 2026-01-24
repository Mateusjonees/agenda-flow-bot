import { motion } from "framer-motion";
import { Check, Star, Rocket, Crown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
interface PricingSectionProps {
  onGetStarted: () => void;
}
const plans = [{
  name: "Mensal",
  icon: Zap,
  price: "R$ 49",
  period: "/mês",
  description: "Ideal para começar",
  features: ["Acesso completo ao sistema", "Agendamentos ilimitados", "Propostas e CRM", "Gestão financeira", "Controle de estoque", "Suporte por email"],
  popular: false,
  color: "from-slate-500 to-gray-600"
}, {
  name: "Semestral",
  icon: Star,
  price: "R$ 259",
  period: "/6 meses",
  originalPrice: "R$ 294",
  savings: "Economize R$ 35",
  description: "6 meses com desconto",
  features: ["Tudo do plano mensal", "Economia de R$ 35", "Suporte prioritário", "Atualizações antecipadas"],
  popular: true,
  color: "from-primary to-accent"
}, {
  name: "Anual",
  icon: Crown,
  price: "R$ 475",
  period: "/ano",
  originalPrice: "R$ 588",
  savings: "Economize R$ 113",
  description: "12 meses com o melhor desconto",
  features: ["Tudo do plano mensal", "Economia de R$ 113", "Suporte prioritário VIP", "Consultoria mensal", "Acesso beta features"],
  popular: false,
  color: "from-amber-500 to-orange-500"
}];
const PricingSection = ({
  onGetStarted
}: PricingSectionProps) => {
  return <section id="pricing" className="py-24 relative overflow-hidden bg-muted/30">
      <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          

          {/* Pricing Cards - Square aspect ratio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
            {plans.map((plan, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className={cn("relative rounded-2xl bg-card border-2 overflow-hidden flex flex-col", "aspect-square md:aspect-auto md:min-h-[420px]",
          // Square on mobile, auto on desktop
          plan.popular ? "border-primary shadow-2xl md:scale-[1.02] z-10" : "border-border hover:border-primary/50 hover:shadow-lg")}>
                {/* Popular Badge */}
                {plan.popular && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />}
                {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    
                  </div>}

                {/* Content - Compact padding */}
                <div className="p-5 pt-8 flex-1 flex flex-col">
                  {/* Plan Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0`}>
                      <plan.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-foreground leading-tight">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.originalPrice && <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground line-through">{plan.originalPrice}</span>
                        <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 px-2 py-0.5">
                          {plan.savings}
                        </Badge>
                      </div>}
                  </div>

                  {/* CTA Button */}
                  <Button onClick={onGetStarted} size="default" className={cn("w-full mb-4", plan.popular ? "bg-primary hover:bg-primary/90 shadow-lg" : "bg-muted hover:bg-primary hover:text-primary-foreground")} variant={plan.popular ? "default" : "outline"}>
                    Começar Teste Grátis
                  </Button>

                  {/* Features - Compact spacing */}
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-start gap-2">
                        <div className="w-4 h-4 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-emerald-500" />
                        </div>
                        <span className="text-xs text-foreground leading-relaxed">{feature}</span>
                      </li>)}
                  </ul>
                </div>
              </motion.div>)}
          </div>

          {/* Trust Note */}
          <motion.p initial={{
          opacity: 0
        }} whileInView={{
          opacity: 1
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.4
        }} className="text-center text-sm text-muted-foreground mt-10">
            ✓ Sem cartão de crédito &nbsp;•&nbsp; ✓ Cancele quando quiser &nbsp;•&nbsp; ✓ Suporte em português
          </motion.p>
        </div>
      </div>
    </section>;
};
export default PricingSection;