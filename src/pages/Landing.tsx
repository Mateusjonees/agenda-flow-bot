import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Rocket, Calendar, Users, DollarSign, BarChart3, Star, CheckCircle2, ArrowRight, Sparkles, Shield, Clock, TrendingUp, HeadphonesIcon, Lock, Zap, Award, MessageCircle, Check, Quote, Menu, X, Scissors, Dumbbell, Heart, Stethoscope, PawPrint, CreditCard, CalendarCheck, XCircle, TrendingDown, Target, Smartphone, Play } from "lucide-react";
import foguetinho from "@/assets/foguetinho.png";
import logoAntigo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/ThemeToggle";

const Landing = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const features = [
    { icon: Calendar, title: "Agendamentos Inteligentes", description: "Gerencie seus horários de forma eficiente com calendário visual e lembretes automáticos", color: "from-blue-500 to-cyan-500" },
    { icon: Users, title: "Gestão de Clientes", description: "Histórico completo, cartão fidelidade e comunicação automatizada com WhatsApp", color: "from-purple-500 to-pink-500" },
    { icon: DollarSign, title: "Controle Financeiro", description: "Acompanhe receitas, despesas e fluxo de caixa em tempo real", color: "from-emerald-500 to-teal-500" },
    { icon: BarChart3, title: "Relatórios Detalhados", description: "Analytics completo para tomar decisões baseadas em dados", color: "from-orange-500 to-amber-500" },
    { icon: Star, title: "Pós-venda Automático", description: "Solicite avaliações e envie cupons automaticamente após cada serviço", color: "from-rose-500 to-red-500" },
    { icon: Sparkles, title: "Propostas Profissionais", description: "Crie e envie propostas profissionais com acompanhamento de status", color: "from-indigo-500 to-violet-500" },
  ];

  const benefits = ["Sem instalação - 100% online", "Interface intuitiva e moderna", "Suporte técnico dedicado", "Atualizações constantes", "Segurança de dados garantida", "Relatórios em tempo real"];

  const testimonials = [
    { name: "Maria Silva", role: "Proprietária - Salão Beleza Pura", content: "O Foguete transformou completamente a gestão do meu salão. Economizo 10 horas por semana e aumentei em 30% minhas reservas!", rating: 5, avatar: "MS" },
    { name: "João Santos", role: "Dono - Barbearia Estilo", content: "Incrível como é fácil de usar! Meus clientes adoram receber lembretes automáticos e o pós-venda aumentou muito nossa fidelização.", rating: 5, avatar: "JS" },
    { name: "Ana Costa", role: "Gerente - Clínica Vida Saudável", content: "O controle financeiro e os relatórios me dão total visibilidade do negócio. Recomendo para qualquer prestador de serviços!", rating: 5, avatar: "AC" },
    { name: "Pedro Oliveira", role: "Proprietário - Academia Forma Fitness", content: "Triplicamos o controle sobre as mensalidades e reduzimos inadimplência em 60%. O sistema é perfeito!", rating: 5, avatar: "PO" },
    { name: "Carla Mendes", role: "Dona - Clínica Estética Beleza", content: "Os prontuários digitais e o histórico de clientes facilitaram muito nosso trabalho. Recomendo!", rating: 5, avatar: "CM" },
    { name: "Ricardo Lima", role: "Gerente - Consultório Dr. Lima", content: "A agenda médica ficou muito mais organizada. Os lembretes automáticos reduziram faltas drasticamente.", rating: 5, avatar: "RL" },
  ];

  const pricingPlans = [
    { name: "Starter", price: "R$ 97", period: "/mês", description: "Perfeito para começar", features: ["Até 100 agendamentos/mês", "Gestão de clientes ilimitada", "WhatsApp automático", "Controle financeiro básico", "Suporte por email"], popular: false },
    { name: "Professional", price: "R$ 197", period: "/mês", description: "Ideal para negócios em crescimento", features: ["Agendamentos ilimitados", "Todas as funcionalidades", "Relatórios avançados", "Propostas profissionais", "Multi-usuários (até 5)", "Suporte prioritário", "Integração com PIX"], popular: true },
    { name: "Enterprise", price: "Customizado", period: "", description: "Para grandes operações", features: ["Tudo do Professional", "Usuários ilimitados", "API personalizada", "Treinamento dedicado", "Suporte 24/7", "Gerente de conta", "SLA garantido"], popular: false },
  ];

  const faqs = [
    { question: "Como funciona o período de teste?", answer: "Você tem 7 dias grátis para testar todas as funcionalidades sem compromisso. Não precisa cadastrar cartão de crédito." },
    { question: "Posso cancelar a qualquer momento?", answer: "Sim! Você pode cancelar quando quiser, sem multas ou taxas. Seu acesso continua até o fim do período pago." },
    { question: "Os dados estão seguros?", answer: "Absolutamente! Usamos criptografia de ponta e backups diários. Seus dados ficam em servidores seguros na nuvem." },
    { question: "Preciso instalar algum programa?", answer: "Não! O Foguete funciona 100% online. Acesse de qualquer navegador, computador, tablet ou celular." },
    { question: "Tem limite de agendamentos?", answer: "No plano Professional e Enterprise não há limites. O plano Starter tem limite de 100 agendamentos/mês." },
    { question: "Como funciona o suporte?", answer: "Oferecemos suporte via email, chat e WhatsApp. Planos Professional e Enterprise têm suporte prioritário." },
  ];

  const stats = [
    { value: "5.000+", label: "Empresas ativas" },
    { value: "98%", label: "Satisfação" },
    { value: "50k+", label: "Agendamentos/dia" },
    { value: "24/7", label: "Disponibilidade" },
  ];

  const useCases = [
    { icon: Scissors, title: "Salões de Beleza", description: "Gestão completa de agenda, clientes e serviços", color: "from-pink-500 to-rose-500" },
    { icon: Scissors, title: "Barbearias", description: "Controle de fila, comissões e agendamentos", color: "from-slate-600 to-gray-700" },
    { icon: Heart, title: "Clínicas de Estética", description: "Prontuários digitais e histórico de tratamentos", color: "from-purple-500 to-fuchsia-500" },
    { icon: Stethoscope, title: "Consultórios", description: "Agendamento médico e controle financeiro", color: "from-cyan-500 to-blue-500" },
    { icon: Dumbbell, title: "Academias", description: "Gestão de planos, mensalidades e acesso", color: "from-orange-500 to-red-500" },
    { icon: PawPrint, title: "Pet Shops", description: "Controle de serviços, produtos e pets", color: "from-amber-500 to-yellow-500" },
  ];

  const integrations = [
    { name: "WhatsApp Business", description: "Envio automático de lembretes, confirmações e mensagens personalizadas", icon: MessageCircle, color: "from-green-500 to-emerald-500" },
    { name: "PIX", description: "Cobranças e pagamentos instantâneos integrados ao sistema", icon: Smartphone, color: "from-cyan-500 to-teal-500" },
    { name: "Mercado Pago", description: "Gateway de pagamento completo com link de pagamento", icon: CreditCard, color: "from-blue-500 to-sky-500" },
    { name: "Google Calendar", description: "Sincronização automática de agendamentos com sua agenda", icon: CalendarCheck, color: "from-red-500 to-orange-500" },
  ];

  const roiStats = [
    { value: "15h", label: "Economizadas por semana", description: "em tarefas administrativas", icon: Clock },
    { value: "40%", label: "Redução de faltas", description: "com lembretes automáticos", icon: TrendingDown },
    { value: "25%", label: "Aumento na receita", description: "com gestão eficiente", icon: TrendingUp },
  ];

  const guaranteeBadges = [
    { icon: Shield, text: "7 Dias Grátis" },
    { icon: XCircle, text: "Cancele Quando Quiser" },
    { icon: Lock, text: "Dados Criptografados" },
    { icon: HeadphonesIcon, text: "Suporte 24/7" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/5548988430812?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 animate-pulse-glow group"
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card text-foreground px-4 py-2 rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium border">
          Fale conosco!
        </span>
      </a>

      {/* Header - Glass Morphism */}
      <header className="border-b glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img alt="Foguete" className="h-16 w-auto dark:hidden transition-transform duration-300 hover:scale-110 hover:rotate-6" src="/lovable-uploads/80412b3c-5edc-43b9-ab6d-a607dcdc2156.png" />
            <img src={logoAntigo} alt="Foguete" className="h-16 w-auto hidden dark:block" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {["home", "features", "testimonials", "pricing", "faq"].map((item, index) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 relative group"
              >
                {item === "home" ? "Início" : item === "features" ? "Recursos" : item === "testimonials" ? "Depoimentos" : item === "pricing" ? "Preços" : "FAQ"}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full rounded-full"></span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!isAuthenticated ? (
              <>
                <Button onClick={() => navigate("/auth")} variant="ghost" className="hidden md:flex hover:bg-primary/10">
                  Entrar
                </Button>
                <Button onClick={() => navigate("/auth")} className="hidden md:flex gap-2 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all glow-primary">
                  Começe Grátis
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/dashboard")} className="hidden md:flex gap-2 shadow-lg">
                Ir para Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t glass animate-slide-up">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {["home", "features", "testimonials", "pricing", "faq"].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="text-left text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-primary/10"
                >
                  {item === "home" ? "Início" : item === "features" ? "Recursos" : item === "testimonials" ? "Depoimentos" : item === "pricing" ? "Preços" : "FAQ"}
                </button>
              ))}
              <div className="pt-2 border-t space-y-2">
                {!isAuthenticated ? (
                  <>
                    <Button onClick={() => navigate("/auth")} className="w-full gap-2 bg-primary">
                      Começe Grátis
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => navigate("/auth")} variant="outline" className="w-full">
                      Entrar
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => navigate("/dashboard")} className="w-full gap-2">
                    Ir para Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section - Premium Design */}
      <section id="home" className="relative min-h-[90vh] flex items-center py-20 md:py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-mesh-gradient opacity-60" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        
        {/* Floating Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-secondary rounded-full animate-float opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-primary rounded-full animate-float-slow opacity-60" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge with Shimmer */}
            <div className="inline-block animate-scale-in">
              <Badge className="px-6 py-2.5 text-sm font-semibold bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-all shadow-lg">
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Sistema de Gestão Completo
              </Badge>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight animate-slide-up">
              <span className="text-foreground">Decole seu</span>
              <br />
              <span className="text-gradient-primary">negócio</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-slide-up animation-delay-200 leading-relaxed">
              Sistema completo para <span className="text-foreground font-semibold">salões, clínicas, barbearias</span> e prestadores de serviço.
              Gerencie tudo em um só lugar.
            </p>

            {/* Guarantee Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 animate-slide-up animation-delay-300">
              {guaranteeBadges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2.5 glass rounded-full shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{badge.text}</span>
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-slide-up animation-delay-400">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="h-16 px-10 text-lg gap-3 shadow-xl hover:shadow-2xl transition-all bg-primary hover:bg-primary/90 glow-primary hover:-translate-y-1"
              >
                {isAuthenticated ? "Acessar Dashboard" : "Começar Teste Grátis"}
                <Rocket className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open("https://wa.me/5548988430812?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão", "_blank")}
                className="h-16 px-10 text-lg gap-3 glass hover:bg-primary/10 hover:-translate-y-1 transition-all"
              >
                <Play className="w-5 h-5" />
                Ver Demonstração
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm text-muted-foreground animate-fade-in animation-delay-500">
              {["Sem cartão de crédito", "7 dias grátis", "Cancele quando quiser"].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Premium Glass Cards */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="glass hover-lift border-0 overflow-hidden group">
                  <CardContent className="p-8 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="text-5xl md:text-6xl font-extrabold text-gradient-primary mb-2">{stat.value}</div>
                    <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section - Premium Cards */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="px-4 py-2 mb-6 bg-accent/10 text-accent border-accent/30">
                <Target className="w-4 h-4 mr-2" />
                Segmentos
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                Perfeito para seu <span className="text-gradient-primary">segmento</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Funcionalidades personalizadas para cada tipo de negócio
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((useCase, index) => {
                const Icon = useCase.icon;
                return (
                  <Card key={index} className="group hover-lift border-2 border-transparent hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-8 text-center relative">
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${useCase.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div className="w-20 h-20 mb-6 mx-auto flex items-center justify-center">
                        <div className={`w-16 h-16 bg-gradient-to-br ${useCase.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{useCase.title}</h3>
                      <p className="text-muted-foreground">{useCase.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Premium Design */}
      <section id="features" className="py-24 relative bg-muted/30">
        <div className="absolute inset-0 bg-dots-pattern opacity-30" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="px-4 py-2 mb-6 bg-primary/10 text-primary border-primary/30">
                <Sparkles className="w-4 h-4 mr-2" />
                Recursos
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                Tudo que você <span className="text-gradient-primary">precisa</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Funcionalidades completas para transformar sua gestão
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="group hover-lift border-2 border-transparent hover:border-primary/30 bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-8 relative">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className="w-16 h-16 mb-6 flex items-center justify-center">
                      <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                Por que escolher o <span className="text-gradient-primary">Foguete</span>?
              </h2>
              <p className="text-lg text-muted-foreground">Mais de 5.000 empresas já confiam no Foguete</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-5 glass rounded-xl hover:shadow-lg transition-all group hover:-translate-y-1"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-foreground font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
              {[
                { icon: Shield, text: "Dados Criptografados" },
                { icon: Lock, text: "SSL Certificado" },
                { icon: Award, text: "LGPD Compliance" },
                { icon: Zap, text: "99.9% Uptime" },
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-3 glass rounded-full">
                  <badge.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-24 relative bg-muted/30">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="px-4 py-2 mb-6 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                <Target className="w-4 h-4 mr-2" />
                Resultados Comprovados
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                Transforme seu negócio com <span className="text-gradient-primary">dados reais</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {roiStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="group hover-lift border-0 bg-gradient-to-br from-card to-card/50 overflow-hidden shadow-premium">
                    <CardContent className="p-10 text-center">
                      <div className="w-20 h-20 mb-6 mx-auto flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Icon className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      <div className="text-5xl font-extrabold text-gradient-primary mb-3">{stat.value}</div>
                      <div className="text-lg font-semibold text-foreground mb-1">{stat.label}</div>
                      <div className="text-sm text-muted-foreground">{stat.description}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Rocket className="w-16 h-16 text-primary mx-auto mb-6 animate-float" />
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              Pronto para <span className="text-gradient-primary">decolar</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Junte-se a mais de 5.000 empresas que já usam o Foguete para gerenciar seus negócios
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="h-16 px-10 text-lg gap-3 shadow-xl hover:shadow-2xl bg-primary hover:bg-primary/90 glow-primary"
              >
                {isAuthenticated ? "Ir para Dashboard" : "Começar Teste Grátis"}
                <Rocket className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open("https://wa.me/5548988430812", "_blank")}
                className="h-16 px-10 text-lg gap-3 glass hover:bg-primary/10"
              >
                <MessageCircle className="w-5 h-5" />
                Falar com Especialista
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Premium Carousel */}
      <section id="testimonials" className="py-24 relative bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="px-4 py-2 mb-6 bg-secondary/10 text-secondary-foreground border-secondary/30">
                <Star className="w-4 h-4 mr-2" />
                Depoimentos
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                O que nossos <span className="text-gradient-primary">clientes dizem</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="group hover-lift border-0 bg-card/80 backdrop-blur-sm overflow-hidden shadow-lg">
                  <CardContent className="p-8 relative">
                    <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                      ))}
                    </div>
                    <p className="text-foreground mb-8 leading-relaxed text-lg">"{testimonial.content}"</p>
                    <div className="flex items-center gap-4 pt-6 border-t">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="px-4 py-2 mb-6 bg-accent/10 text-accent border-accent/30">
                <Zap className="w-4 h-4 mr-2" />
                Integrações
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                Integrações <span className="text-gradient-primary">poderosas</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Conecte o Foguete com as ferramentas que você já usa
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {integrations.map((integration, index) => {
                const Icon = integration.icon;
                return (
                  <Card key={index} className="group hover-lift border-2 border-transparent hover:border-primary/30 bg-card/80 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-8 flex gap-6">
                      <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                        <div className={`w-16 h-16 bg-gradient-to-br ${integration.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{integration.name}</h3>
                        <p className="text-muted-foreground leading-relaxed">{integration.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Premium Design */}
      <section id="pricing" className="py-24 relative bg-muted/30">
        <div className="absolute inset-0 bg-mesh-gradient opacity-30" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="px-4 py-2 mb-6 bg-primary/10 text-primary border-primary/30">
                <DollarSign className="w-4 h-4 mr-2" />
                Preços
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                Planos para cada <span className="text-gradient-primary">momento</span>
              </h2>
              <p className="text-lg text-muted-foreground">Comece grátis e escale conforme cresce</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative overflow-hidden transition-all ${
                    plan.popular
                      ? "border-2 border-primary shadow-2xl scale-105 bg-card glow-primary"
                      : "border-2 border-border hover:border-primary/50 bg-card/80 hover-lift"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
                  )}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-6 py-1.5 shadow-lg">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-10 pt-12">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                    <div className="mb-8">
                      <span className="text-5xl font-extrabold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <Button
                      onClick={handleGetStarted}
                      className={`w-full h-14 text-base mb-8 ${
                        plan.popular ? "bg-primary hover:bg-primary/90 shadow-lg" : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.price === "Customizado" ? "Falar com Vendas" : "Começar Teste Grátis"}
                    </Button>
                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-emerald-500" />
                          </div>
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-10">
              Todos os planos incluem 7 dias de teste grátis. Sem compromisso, cancele quando quiser.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="px-4 py-2 mb-6 bg-accent/10 text-accent border-accent/30">
                <MessageCircle className="w-4 h-4 mr-2" />
                FAQ
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                Perguntas <span className="text-gradient-primary">Frequentes</span>
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="glass rounded-xl px-6 border-0 shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">Ainda tem dúvidas?</p>
              <Button
                variant="outline"
                className="gap-2 h-12 px-6 glass hover:bg-primary/10"
                onClick={() => window.open("https://wa.me/5548990751889", "_blank")}
              >
                <MessageCircle className="w-4 h-4" />
                Falar com Suporte
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="container mx-auto px-4 relative">
          <Card className="max-w-4xl mx-auto border-0 shadow-2xl overflow-hidden">
            <CardContent className="p-16 text-center relative bg-gradient-to-br from-card via-card to-card/80">
              <Rocket className="w-20 h-20 text-primary mx-auto mb-8 animate-float" />
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6">
                Pronto para <span className="text-gradient-primary">decolar</span>?
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Junte-se a mais de 5.000 empresários que já transformaram sua gestão com o Foguete
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="h-16 px-10 text-lg gap-3 shadow-xl hover:shadow-2xl bg-primary hover:bg-primary/90"
                >
                  {isAuthenticated ? "Ir para Dashboard" : "Começar Teste Grátis"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection("pricing")}
                  className="h-16 px-10 text-lg"
                >
                  Ver Planos e Preços
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-8">
                ✓ Sem cartão de crédito &nbsp;•&nbsp; ✓ 7 dias grátis &nbsp;•&nbsp; ✓ Cancele quando quiser
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-10">
            {/* Logo and Description */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={foguetinho} alt="Foguete" className="h-12 w-auto dark:hidden transition-transform duration-300 hover:scale-110 hover:rotate-6" />
                <img src={logoAntigo} alt="Foguete" className="h-12 w-auto hidden dark:block" />
                <span className="text-xl font-bold text-foreground">Foguete</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Sistema completo de gestão empresarial para impulsionar seu negócio.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>Dados 100% seguros</span>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-bold text-foreground mb-4">Produto</h3>
              <ul className="space-y-3">
                {["features", "pricing", "testimonials", "faq"].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => scrollToSection(item)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item === "features" ? "Funcionalidades" : item === "pricing" ? "Preços" : item === "testimonials" ? "Depoimentos" : "FAQ"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold text-foreground mb-4">Empresa</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => scrollToSection("home")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Início
                  </button>
                </li>
                <li>
                  <a href="https://wa.me/5548988430812" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Contato
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-foreground mb-4">Contato</h3>
              <ul className="space-y-3">
                <li>
                  <div className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Vendas
                  </div>
                  <a href="https://wa.me/5548988430812" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    (48) 98843-0812
                  </a>
                </li>
                <li className="pt-2">
                  <div className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                    <HeadphonesIcon className="w-4 h-4 text-primary" />
                    Suporte
                  </div>
                  <a href="https://wa.me/5548990751889" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    (48) 99075-1889
                  </a>
                </li>
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h3 className="font-bold text-foreground mb-4">Horário</h3>
              <ul className="space-y-3">
                <li>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">Seg - Sex</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">9h às 18h</p>
                </li>
                <li className="pt-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="font-medium">Suporte 24/7</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">Via WhatsApp</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 Foguete Gestão Empresarial. Todos os direitos reservados.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="/politica-privacidade" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidade
              </a>
              <a href="/termos-servico" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos de Serviço
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>SSL Seguro</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-primary" />
                <span>LGPD</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
