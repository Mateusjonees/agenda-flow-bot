import { useIsMobile } from "@/hooks/use-mobile";

const features = [
  { emoji: "📅", title: "Agendamentos Inteligentes", description: "Calendário visual com lembretes automáticos via WhatsApp", color: "from-blue-500 to-cyan-500" },
  { emoji: "👥", title: "Gestão de Clientes", description: "Histórico completo e cartão fidelidade digital", color: "from-purple-500 to-pink-500" },
  { emoji: "💰", title: "Controle Financeiro", description: "Receitas e fluxo de caixa em tempo real", color: "from-emerald-500 to-teal-500" },
  { emoji: "📊", title: "Relatórios Detalhados", description: "Analytics para decisões baseadas em dados", color: "from-orange-500 to-amber-500" },
  { emoji: "📄", title: "Propostas Profissionais", description: "Crie e envie propostas em PDF", color: "from-indigo-500 to-violet-500" },
  { emoji: "🔔", title: "Notificações Inteligentes", description: "Alertas de estoque e aniversários", color: "from-rose-500 to-red-500" },
  { emoji: "🕐", title: "Horários Flexíveis", description: "Configure intervalos e folgas", color: "from-slate-500 to-gray-600" },
  { emoji: "🛡️", title: "Dados Seguros", description: "Criptografia e conformidade LGPD", color: "from-teal-500 to-cyan-500" },
];

const FeatureGrid = () => {
  const isMobile = useIsMobile();
  const visibleFeatures = isMobile ? features.slice(0, 6) : features;
  
  return (
    <section id="features" className="py-16 md:py-24 relative bg-muted/30 defer-mobile">
      <div className="container mx-auto px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {visibleFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl p-4 md:p-6 border hover:border-primary/30 transition-colors"
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-lg md:text-xl`}>
                  {feature.emoji}
                </div>
                <h3 className="text-sm md:text-lg font-bold text-foreground mb-1 md:mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;