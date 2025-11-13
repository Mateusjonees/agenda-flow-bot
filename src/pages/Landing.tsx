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
  X,
  Scissors,
  Dumbbell,
  Heart,
  Stethoscope,
  PawPrint,
  Building2,
  Smartphone,
  CreditCard,
  Wallet,
  CalendarCheck,
  XCircle,
  Package,
  FileText,
  TrendingDown,
  Target
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import foguetinho from "@/assets/foguetinho.png";
import logoAntigo from "@/assets/logo.png";
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

  const useCases = [
    {
      icon: Scissors,
      title: "Salões de Beleza",
      description: "Gestão completa de agenda, clientes e serviços para seu salão"
    },
    {
      icon: Scissors,
      title: "Barbearias",
      description: "Controle de fila, comissões e agendamentos para barbeiros"
    },
    {
      icon: Heart,
      title: "Clínicas de Estética",
      description: "Prontuários digitais e histórico de tratamentos organizados"
    },
    {
      icon: Stethoscope,
      title: "Consultórios",
      description: "Agendamento médico e controle financeiro profissional"
    },
    {
      icon: Dumbbell,
      title: "Academias",
      description: "Gestão de planos, mensalidades e controle de acesso"
    },
    {
      icon: PawPrint,
      title: "Pet Shops",
      description: "Controle de serviços, produtos e histórico dos pets"
    }
  ];

  const integrations = [
    {
      name: "WhatsApp Business",
      description: "Envio automático de lembretes, confirmações e mensagens personalizadas",
      icon: MessageCircle
    },
    {
      name: "PIX",
      description: "Cobranças e pagamentos instantâneos integrados ao sistema",
      icon: Smartphone
    },
    {
      name: "Mercado Pago",
      description: "Gateway de pagamento completo com link de pagamento",
      icon: CreditCard
    },
    {
      name: "Google Calendar",
      description: "Sincronização automática de agendamentos com sua agenda",
      icon: CalendarCheck
    }
  ];

  const roiStats = [
    {
      value: "15h",
      label: "Economizadas por semana",
      description: "em tarefas administrativas",
      icon: Clock
    },
    {
      value: "40%",
      label: "Redução de faltas",
      description: "com lembretes automáticos",
      icon: TrendingDown
    },
    {
      value: "25%",
      label: "Aumento na receita",
      description: "com gestão eficiente",
      icon: TrendingUp
    },
    {
      value: "100%",
      label: "Eliminação de papel",
      description: "processos digitalizados",
      icon: FileText
    }
  ];

  const guaranteeBadges = [
    { icon: Shield, text: "7 Dias Grátis" },
    { icon: XCircle, text: "Cancele Quando Quiser" },
    { icon: Lock, text: "Dados Criptografados" },
    { icon: HeadphonesIcon, text: "Suporte 24/7" }
  ];

  const moreTestimonials = [
    {
      name: "Pedro Oliveira",
      role: "Proprietário - Academia Forma Fitness",
      content: "Triplicamos o controle sobre as mensalidades e reduzimos inadimplência em 60%. O sistema é perfeito!",
      rating: 5
    },
    {
      name: "Carla Mendes",
      role: "Dona - Clínica Estética Beleza",
      content: "Os prontuários digitais e o histórico de clientes facilitaram muito nosso trabalho. Recomendo!",
      rating: 5
    },
    {
      name: "Ricardo Lima",
      role: "Gerente - Consultório Dr. Lima",
      content: "A agenda médica ficou muito mais organizada. Os lembretes automáticos reduziram faltas drasticamente.",
      rating: 5
    }
  ];

  const allTestimonials = [...testimonials, ...moreTestimonials];

  const screenshots = [
    {
      title: "Dashboard Intuitivo",
      description: "Visão completa do seu negócio em um só lugar"
    },
    {
      title: "Agenda Visual",
      description: "Gerencie horários de forma fácil e rápida"
    },
    {
      title: "Gestão de Clientes",
      description: "Histórico completo e comunicação integrada"
    },
    {
      title: "Relatórios Detalhados",
      description: "Analytics completo para decisões inteligentes"
    }
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
            <img 
              src={foguetinho} 
              alt="Foguete" 
              className="h-10 w-auto dark:hidden transition-transform duration-300 hover:scale-110 hover:rotate-6" 
            />
            <img 
              src={logoAntigo} 
              alt="Foguete" 
              className="h-10 w-auto hidden dark:block" 
            />
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
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center space-y-8 mb-16">
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

            {/* Guarantee Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
              {guaranteeBadges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <div key={index} className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full shadow-sm">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{badge.text}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="h-14 px-8 text-base gap-2 shadow-lg hover:shadow-xl transition-all bg-[#E31E24] hover:bg-[#C41A1F] text-white"
              >
                {isAuthenticated ? "Acessar Dashboard" : "Começar Teste Grátis"}
                <Rocket className="w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.open('https://wa.me/5548988430812?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão', '_blank')}
                className="h-14 px-8 text-base gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Falar com Vendas
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
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

          {/* Screenshots Carousel */}
          <div className="max-w-4xl mx-auto mt-16">
            <Carousel className="w-full">
              <CarouselContent>
                {screenshots.map((screenshot, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card className="border-2">
                        <CardContent className="flex aspect-video items-center justify-center p-6 bg-gradient-to-br from-muted/50 to-muted/20">
                          <div className="text-center space-y-4">
                            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                              <Rocket className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-foreground mb-2">
                                {screenshot.title}
                              </h3>
                              <p className="text-muted-foreground">
                                {screenshot.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
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

      {/* Use Cases Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Perfeito para seu segmento
            </h2>
            <p className="text-lg text-muted-foreground">
              Funcionalidades personalizadas para cada tipo de negócio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {useCase.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
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

      {/* ROI Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 mb-6 inline-block">
              <Target className="w-4 h-4 mr-2 inline" />
              Resultados Comprovados
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Transforme seu negócio com dados reais
            </h2>
            <p className="text-lg text-muted-foreground">
              Veja o impacto que o Foguete pode ter na sua empresa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roiStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-xl group">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {stat.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.description}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Press & Recognition Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Confiança e Segurança Garantidas
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg border">
              <Shield className="w-12 h-12 text-primary" />
              <div className="text-center">
                <div className="font-semibold text-foreground">SSL Certificado</div>
                <p className="text-xs text-muted-foreground">Conexão Segura</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg border">
              <Lock className="w-12 h-12 text-primary" />
              <div className="text-center">
                <div className="font-semibold text-foreground">LGPD</div>
                <p className="text-xs text-muted-foreground">Compliance Total</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg border">
              <Zap className="w-12 h-12 text-primary" />
              <div className="text-center">
                <div className="font-semibold text-foreground">99.9% Uptime</div>
                <p className="text-xs text-muted-foreground">Sempre Disponível</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg border">
              <Award className="w-12 h-12 text-primary" />
              <div className="text-center">
                <div className="font-semibold text-foreground">Criptografia</div>
                <p className="text-xs text-muted-foreground">Dados Protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="px-4 py-2 text-sm font-medium bg-primary/20 text-primary border-primary/30 mb-6 inline-block">
            <Sparkles className="w-4 h-4 mr-2 inline" />
            Comece Agora Mesmo
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a mais de 5.000 empresas que já usam o Foguete para gerenciar seus negócios com eficiência
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="h-14 px-8 text-base gap-2 shadow-lg hover:shadow-xl transition-all bg-[#E31E24] hover:bg-[#C41A1F] text-white"
            >
              {isAuthenticated ? "Ir para Dashboard" : "Começar Teste Grátis de 7 Dias"}
              <Rocket className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.open('https://wa.me/5548988430812?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão', '_blank')}
              className="h-14 px-8 text-base gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Falar com Especialista
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            <CheckCircle2 className="w-4 h-4 text-primary inline mr-2" />
            Sem cartão de crédito • Cancele quando quiser • Suporte incluído
          </p>
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
            {allTestimonials.map((testimonial, index) => (
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

      {/* Integrations Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Integrações Poderosas
            </h2>
            <p className="text-lg text-muted-foreground">
              Conecte o Foguete com as ferramentas que você já usa
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {integrations.map((integration, index) => {
              const Icon = integration.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {integration.name}
                      </h3>
                      <p className="text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Foguete Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 mb-6 inline-block">
              <Award className="w-4 h-4 mr-2 inline" />
              Diferenciais Competitivos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Por que escolher o Foguete?
            </h2>
            <p className="text-lg text-muted-foreground">
              Veja como nos destacamos das soluções genéricas
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-2 border-primary/50 bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">100% na Nuvem</h4>
                    <p className="text-sm text-muted-foreground">Acesse de qualquer lugar, sem instalação ou manutenção</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-muted">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Instalação Local</h4>
                    <p className="text-sm text-muted-foreground">Sistemas antigos que precisam de manutenção constante</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/50 bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Suporte Humanizado</h4>
                    <p className="text-sm text-muted-foreground">Time dedicado pronto para te ajudar quando precisar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-muted">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Chatbot Automático</h4>
                    <p className="text-sm text-muted-foreground">Respostas genéricas que não resolvem seus problemas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/50 bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Atualizações Automáticas</h4>
                    <p className="text-sm text-muted-foreground">Novas funcionalidades sem custo adicional</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-muted">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Versões Pagas</h4>
                    <p className="text-sm text-muted-foreground">Pagar para ter acesso às melhorias do sistema</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/50 bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Multi-dispositivo</h4>
                    <p className="text-sm text-muted-foreground">Funciona em computador, tablet e smartphone</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-muted">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Apenas Desktop</h4>
                    <p className="text-sm text-muted-foreground">Limitado a um único computador ou dispositivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/50 bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Integração WhatsApp</h4>
                    <p className="text-sm text-muted-foreground">Comunicação automática com seus clientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-muted">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Sem Integrações</h4>
                    <p className="text-sm text-muted-foreground">Processos manuais que tomam seu tempo</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/50 bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Backup Automático</h4>
                    <p className="text-sm text-muted-foreground">Seus dados seguros e protegidos sempre</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-muted">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Risco de Perda</h4>
                    <p className="text-sm text-muted-foreground">Dados vulneráveis sem proteção adequada</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  {plan.name === "Professional" && (
                    <div className="mb-4">
                      <Badge className="bg-accent/20 text-accent-foreground border-accent/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Economize 30%
                      </Badge>
                    </div>
                  )}
                  {plan.name === "Enterprise" && (
                    <div className="mb-4">
                      <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30">
                        <Award className="w-3 h-3 mr-1" />
                        Melhor Custo-Benefício
                      </Badge>
                    </div>
                  )}
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
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => window.open('https://wa.me/5548990751889?text=Olá,%20preciso%20de%20suporte', '_blank')}
            >
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
                <img 
                  src={foguetinho} 
                  alt="Foguete" 
                  className="h-10 w-auto dark:hidden transition-transform duration-300 hover:scale-110 hover:rotate-6" 
                />
                <img 
                  src={logoAntigo} 
                  alt="Foguete" 
                  className="h-10 w-auto hidden dark:block" 
                />
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
                  <button onClick={() => scrollToSection('testimonials')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Depoimentos
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('faq')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Empresa</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('home')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Início
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('testimonials')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Casos de Sucesso
                  </button>
                </li>
                <li>
                  <a 
                    href="https://wa.me/5548988430812?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20o%20Foguete" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contato
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
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>SSL Seguro</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-primary" />
                <span>LGPD Compliance</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="w-4 h-4 text-primary" />
                <span>Dados Criptografados</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
