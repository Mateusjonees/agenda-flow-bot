import { Calendar, Users, DollarSign, BarChart3, Star, Sparkles, MessageCircle, Clock, CreditCard, FileText, Bell, Shield } from "lucide-react";

const features = [{
  icon: Calendar,
  title: "Agendamentos Inteligentes",
  description: "Calendário visual com drag & drop, lembretes automáticos e confirmações via WhatsApp",
  color: "from-blue-500 to-cyan-500"
}, {
  icon: Users,
  title: "Gestão de Clientes",
  description: "Histórico completo, cartão fidelidade digital e comunicação automatizada",
  color: "from-purple-500 to-pink-500"
}, {
  icon: DollarSign,
  title: "Controle Financeiro",
  description: "Receitas, despesas e fluxo de caixa em tempo real com gráficos interativos",
  color: "from-emerald-500 to-teal-500"
}, {
  icon: BarChart3,
  title: "Relatórios Detalhados",
  description: "Analytics completo para tomar decisões baseadas em dados reais",
  color: "from-orange-500 to-amber-500"
}, {
  icon: MessageCircle,
  title: "WhatsApp Automático",
  description: "Lembretes, confirmações e pós-venda automático integrado ao WhatsApp",
  color: "from-green-500 to-emerald-500"
}, {
  icon: CreditCard,
  title: "Pagamentos PIX",
  description: "Cobranças via PIX integradas com confirmação automática de pagamento",
  color: "from-cyan-500 to-teal-500"
}, {
  icon: Star,
  title: "Avaliações Automáticas",
  description: "Solicite avaliações do Google automaticamente após cada atendimento",
  color: "from-yellow-500 to-orange-500"
}, {
  icon: FileText,
  title: "Propostas Profissionais",
  description: "Crie e envie propostas em PDF com acompanhamento de visualização",
  color: "from-indigo-500 to-violet-500"
}, {
  icon: Bell,
  title: "Notificações Inteligentes",
  description: "Alertas de estoque baixo, aniversários e clientes inativos",
  color: "from-rose-500 to-red-500"
}, {
  icon: Clock,
  title: "Horários Flexíveis",
  description: "Configure intervalos, folgas e horários especiais facilmente",
  color: "from-slate-500 to-gray-600"
}, {
  icon: Shield,
  title: "Dados Seguros",
  description: "Criptografia de ponta, backups automáticos e conformidade LGPD",
  color: "from-teal-500 to-cyan-500"
}, {
  icon: Sparkles,
  title: "IA Integrada futuramente",
  description: "Assistente virtual para atendimento 24h e respostas automáticas",
  color: "from-violet-500 to-purple-500"
}];

const FeatureGrid = () => {
  return (
    <section id="features" className="py-24 relative bg-muted/30">
      <div className="absolute inset-0 bg-dots-pattern opacity-30" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-6xl mx-auto">
          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-card/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Icon */}
                <div className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
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