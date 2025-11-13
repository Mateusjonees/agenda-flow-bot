import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Rocket, 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart3, 
  Star,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  TrendingUp,
  HeadphonesIcon,
  Lock,
  Zap,
  Award,
  MessageCircle,
  ChevronDown,
  Check,
  Quote,
  Menu,
  X
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const features = [
    {
      icon: Calendar,
      title: "Agendamentos Inteligentes",
      description: "Gerencie seus horários de forma eficiente com calendário visual e lembretes automáticos"
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Histórico completo, cartão fidelidade e comunicação automatizada com WhatsApp"
    },
    {
      icon: DollarSign,
      title: "Controle Financeiro",
      description: "Acompanhe receitas, despesas e fluxo de caixa em tempo real"
    },
    {
      icon: BarChart3,
      title: "Relatórios Detalhados",
      description: "Analytics completo para tomar decisões baseadas em dados"
    },
    {
      icon: Star,
      title: "Pós-venda Automático",
      description: "Solicite avaliações e envie cupons automaticamente após cada serviço"
    },
    {
      icon: Sparkles,
      title: "Propostas Profissionais",
      description: "Crie e envie propostas profissionais com acompanhamento de status"
    }
  ];

  const benefits = [
    "Sem instalação - 100% online",
    "Interface intuitiva e moderna",
    "Suporte técnico dedicado",
    "Atualizações constantes",
    "Segurança de dados garantida",
    "Relatórios em tempo real"
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Proprietária - Salão Beleza Pura",
      content: "O Foguete transformou completamente a gestão do meu salão. Economizo 10 horas por semana e aumentei em 30% minhas reservas!",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Dono - Barbearia Estilo",
      content: "Incrível como é fácil de usar! Meus clientes adoram receber lembretes automáticos e o pós-venda aumentou muito nossa fidelização.",
      rating: 5
    },
    {
      name: "Ana Costa",
      role: "Gerente - Clínica Vida Saudável",
      content: "O controle financeiro e os relatórios me dão total visibilidade do negócio. Recomendo para qualquer prestador de serviços!",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "R$ 97",
      period: "/mês",
      description: "Perfeito para começar",
      features: [
        "Até 100 agendamentos/mês",
        "Gestão de clientes ilimitada",
        "WhatsApp automático",
        "Controle financeiro básico",
        "Suporte por email"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "R$ 197",
      period: "/mês",
      description: "Ideal para negócios em crescimento",
      features: [
        "Agendamentos ilimitados",
        "Todas as funcionalidades",
        "Relatórios avançados",
        "Propostas profissionais",
        "Multi-usuários (até 5)",
        "Suporte prioritário",
        "Integração com PIX"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Customizado",
      period: "",
      description: "Para grandes operações",
      features: [
        "Tudo do Professional",
        "Usuários ilimitados",
        "API personalizada",
        "Treinamento dedicado",
        "Suporte 24/7",
        "Gerente de conta",
        "SLA garantido"
      ],
      popular: false
    }
  ];

  const faqs = [
    {
      question: "Como funciona o período de teste?",
      answer: "Você tem 7 dias grátis para testar todas as funcionalidades sem compromisso. Não precisa cadastrar cartão de crédito."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim! Você pode cancelar quando quiser, sem multas ou taxas. Seu acesso continua até o fim do período pago."
    },
    {
      question: "Os dados estão seguros?",
      answer: "Absolutamente! Usamos criptografia de ponta e backups diários. Seus dados ficam em servidores seguros na nuvem."
    },
    {
      question: "Preciso instalar algum programa?",
      answer: "Não! O Foguete funciona 100% online. Acesse de qualquer navegador, computador, tablet ou celular."
    },
    {
      question: "Tem limite de agendamentos?",
      answer: "No plano Professional e Enterprise não há limites. O plano Starter tem limite de 100 agendamentos/mês."
    },
    {
      question: "Como funciona o suporte?",
      answer: "Oferecemos suporte via email, chat e WhatsApp. Planos Professional e Enterprise têm suporte prioritário."
    }
  ];

  const stats = [
    { value: "5.000+", label: "Empresas ativas" },
    { value: "98%", label: "Satisfação" },
    { value: "50k+", label: "Agendamentos/dia" },
    { value: "24/7", label: "Disponibilidade" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/5548988430812?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-fade-in group"
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card text-foreground px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
          Fale conosco!
        </span>
      </a>

      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Foguete" className="h-10 w-auto" />
            <span className="text-xl font-bold text-foreground">Foguete</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => scrollToSection('home')} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              Início
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              Recursos
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              Depoimentos
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => scrollToSection('pricing')} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              Preços
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => scrollToSection('faq')} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              FAQ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => navigate('/download')} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              📱 Baixar App
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!isAuthenticated ? (
              <>
                <Button 
                  onClick={() => navigate("/auth")} 
                  variant="ghost"
                  className="hidden md:flex"
                >
                  Entrar
                </Button>
                <Button 
                  onClick={() => navigate("/auth")} 
                  className="hidden md:flex gap-2 bg-[#E31E24] hover:bg-[#C41A1F] text-white"
                >
                  Começe Grátis
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => navigate("/dashboard")} 
                className="hidden md:flex gap-2"
              >
                Ir para Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-card">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <button onClick={() => scrollToSection('home')} className="text-left text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2">
                Início
              </button>
              <button onClick={() => scrollToSection('features')} className="text-left text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2">
                Recursos
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="text-left text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2">
                Depoimentos
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-left text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2">
                Preços
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-left text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2">
                FAQ
              </button>
              <button onClick={() => navigate('/download')} className="text-left text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2">
                📱 Baixar App
              </button>
              <div className="pt-2 border-t space-y-2">
                {!isAuthenticated ? (
                  <>
                    <Button 
                      onClick={() => navigate("/auth")} 
                      className="w-full gap-2 bg-[#E31E24] hover:bg-[#C41A1F] text-white"
                    >
                      Começe Grátis
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => navigate("/auth")} 
                      variant="outline"
                      className="w-full"
                    >
                      Entrar
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => navigate("/dashboard")} 
                    className="w-full gap-2"
                  >
                    Ir para Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="container mx-auto px-4 py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative">
          <div className="inline-block animate-fade-in">
            <Badge className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Sistema de Gestão Completo e Profissional
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight animate-fade-in">
            Decole seu negócio com
            <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mt-2">
              gestão profissional
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            Sistema completo para salões, clínicas, barbearias e prestadores de serviço. 
            Gerencie agendamentos, clientes, finanças e muito mais em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="h-14 px-8 text-base gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              {isAuthenticated ? "Acessar Dashboard" : "Começar Teste Grátis"}
              <Rocket className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/download')}
              className="h-14 px-8 text-base gap-2"
            >
              📱 Baixar App
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Sem cartão de crédito
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              7 dias grátis
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Cancele quando quiser
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 border-y bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-lg text-muted-foreground">
              Funcionalidades completas para transformar sua gestão
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Por que escolher o Foguete?
            </h2>
            <p className="text-lg text-muted-foreground">
              Mais de 5.000 empresas já confiam no Foguete
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm">Dados Criptografados</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <span className="text-sm">SSL Certificado</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-sm">LGPD Compliance</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-lg text-muted-foreground">
              Histórias reais de quem transformou seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <Quote className="w-8 h-8 text-primary/30 mb-4" />
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="border-t pt-4">
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos para cada momento do seu negócio
            </h2>
            <p className="text-lg text-muted-foreground">
              Comece grátis e escale conforme cresce
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border-2 transition-all hover:shadow-xl ${
                  plan.popular 
                    ? 'border-primary shadow-lg scale-105' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  <Button 
                    onClick={handleGetStarted}
                    className="w-full mb-6"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.price === "Customizado" ? "Falar com Vendas" : "Começar Teste Grátis"}
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Todos os planos incluem 7 dias de teste grátis. Sem compromisso, cancele quando quiser.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas sobre o Foguete
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Ainda tem dúvidas?
            </p>
            <Button variant="outline" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Falar com Suporte
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20" />
          <CardContent className="relative p-12 text-center">
            <Rocket className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pronto para decolar?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a mais de 5.000 empresários que já transformaram sua gestão com o Foguete
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="h-14 px-8 text-base gap-2 shadow-lg"
              >
                {isAuthenticated ? "Ir para Dashboard" : "Começar Teste Grátis"}
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => scrollToSection('pricing')}
                className="h-14 px-8 text-base"
              >
                Ver Planos e Preços
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              ✓ Sem cartão de crédito &nbsp;•&nbsp; ✓ 7 dias grátis &nbsp;•&nbsp; ✓ Cancele quando quiser
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
            {/* Logo and Description */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="Foguete" className="h-10 w-auto" />
                <span className="text-xl font-bold text-foreground">Foguete</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Sistema completo de gestão empresarial para impulsionar seu negócio.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>Dados 100% seguros</span>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Produto</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('features')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Funcionalidades
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Preços
                  </button>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Atualizações
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Roadmap
                  </a>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Empresa</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <button onClick={() => scrollToSection('testimonials')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Casos de Sucesso
                  </button>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Carreiras
                  </a>
                </li>
              </ul>
            </div>

            {/* Suporte */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Contato</h3>
              <ul className="space-y-2">
                <li>
                  <div className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Vendas
                  </div>
                  <a 
                    href="https://wa.me/5548988430812?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    (48) 98843-0812
                  </a>
                </li>
                <li className="pt-2">
                  <div className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                    <HeadphonesIcon className="w-4 h-4 text-primary" />
                    Suporte
                  </div>
                  <a 
                    href="https://wa.me/5548990751889?text=Olá,%20preciso%20de%20suporte" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    (48) 99075-1889
                  </a>
                </li>
                <li className="pt-2">
                  <button onClick={() => scrollToSection('faq')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            {/* Horário */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Horário</h3>
              <ul className="space-y-2">
                <li>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">Segunda - Sexta</span>
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
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                LGPD
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
