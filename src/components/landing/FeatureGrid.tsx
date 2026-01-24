import { memo } from "react";
import { Calendar, Users, DollarSign, BarChart3, Star, Sparkles, MessageCircle, Clock, CreditCard, FileText, Bell, Shield } from "lucide-react";

const features = [
  { icon: Calendar, title: "Agendamentos Inteligentes", description: "Calendário visual com drag & drop e lembretes automáticos", color: "bg-blue-500" },
  { icon: Users, title: "Gestão de Clientes", description: "Histórico completo e cartão fidelidade digital", color: "bg-purple-500" },
  { icon: DollarSign, title: "Controle Financeiro", description: "Receitas, despesas e fluxo de caixa em tempo real", color: "bg-emerald-500" },
  { icon: BarChart3, title: "Relatórios Detalhados", description: "Analytics para decisões baseadas em dados", color: "bg-orange-500" },
  { icon: MessageCircle, title: "WhatsApp Automático", description: "Lembretes e confirmações integradas", color: "bg-green-500" },
  { icon: CreditCard, title: "Pagamentos PIX", description: "Cobranças com confirmação automática", color: "bg-cyan-500" },
  { icon: Star, title: "Avaliações Automáticas", description: "Solicite avaliações do Google automaticamente", color: "bg-yellow-500" },
  { icon: FileText, title: "Propostas Profissionais", description: "Crie e envie propostas em PDF", color: "bg-indigo-500" },
  { icon: Bell, title: "Notificações", description: "Alertas de estoque e clientes inativos", color: "bg-rose-500" },
  { icon: Clock, title: "Horários Flexíveis", description: "Configure intervalos e folgas facilmente", color: "bg-slate-500" },
  { icon: Shield, title: "Dados Seguros", description: "Criptografia e conformidade LGPD", color: "bg-teal-500" },
  { icon: Sparkles, title: "IA Integrada", description: "Assistente virtual para atendimento 24h", color: "bg-violet-500" },
];

const FeatureGrid = memo(() => {
  return (
    <section id="features" className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-4 border hover:border-primary/30 transition-colors"
            >
              <div className={`w-10 h-10 mb-3 rounded-lg ${feature.color} flex items-center justify-center`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

FeatureGrid.displayName = "FeatureGrid";
export default FeatureGrid;
