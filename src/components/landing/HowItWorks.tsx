import { memo } from "react";
import { UserPlus, Settings, Calendar, TrendingUp } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Crie sua conta", desc: "Cadastre-se em menos de 2 minutos." },
  { icon: Settings, title: "Configure", desc: "Adicione seus serviços e horários." },
  { icon: Calendar, title: "Agende", desc: "Receba agendamentos automáticos." },
  { icon: TrendingUp, title: "Cresça", desc: "Veja relatórios em tempo real." },
];

const HowItWorks = memo(() => (
  <section className="py-12 md:py-20">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            Como <span className="text-primary">funciona</span>
          </h2>
          <p className="text-muted-foreground">4 passos simples para começar</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {steps.map((step, i) => (
            <div key={i} className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-xl flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1 text-sm md:text-base">{step.title}</h3>
              <p className="text-muted-foreground text-xs md:text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
));

HowItWorks.displayName = "HowItWorks";
export default HowItWorks;
