const steps = [
  {
    emoji: "👤",
    title: "Crie sua conta",
    description: "Cadastre-se em menos de 2 minutos. Sem cartão de crédito, sem compromisso.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    emoji: "⚙️",
    title: "Configure seu negócio",
    description: "Adicione seus serviços, horários e personalize sua agenda do seu jeito.",
    color: "from-purple-500 to-pink-500",
  },
  {
    emoji: "📅",
    title: "Comece a agendar",
    description: "Receba agendamentos, envie lembretes automáticos e gerencie tudo online.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    emoji: "📈",
    title: "Acompanhe resultados",
    description: "Veja seu negócio crescer com relatórios e insights em tempo real.",
    color: "from-orange-500 to-amber-500",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-accent/10 text-accent border border-accent/30 rounded-full text-sm font-medium">
              <span>⚙️</span>
              Simples e Rápido
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              Como <span className="text-gradient-primary">funciona</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comece a usar o Foguete em 4 passos simples
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary/50 via-accent/50 to-secondary/50" />

            {steps.map((step, index) => (
              <div
                key={index}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl">{step.emoji}</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-card border-2 border-primary rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center my-4">
                    <span className="text-primary/50 text-xl rotate-90">➡️</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            className="text-center mt-12 animate-fade-in"
            style={{ animationDelay: '600ms' }}
          >
            <p className="text-muted-foreground mb-4">
              Pronto para começar? Seu período de teste começa agora!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
