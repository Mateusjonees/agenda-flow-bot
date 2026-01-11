import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Rocket,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  HeadphonesIcon,
  Lock,
  MessageCircle,
  Menu,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import foguetinho from "@/assets/foguetinho.png";
import logoAntigo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/ThemeToggle";

// Componentes da Landing
import HeroMockup from "@/components/landing/HeroMockup";
import ProductShowcase from "@/components/landing/ProductShowcase";
import HowItWorks from "@/components/landing/HowItWorks";
import FeatureGrid from "@/components/landing/FeatureGrid";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";

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

  const faqs = [
    {
      question: "Como funciona o período de teste?",
      answer: "Você tem 7 dias grátis para testar todas as funcionalidades sem compromisso. Não precisa cadastrar cartão de crédito.",
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim! Você pode cancelar quando quiser, sem multas ou taxas. Seu acesso continua até o fim do período pago.",
    },
    {
      question: "Os dados estão seguros?",
      answer: "Absolutamente! Usamos criptografia de ponta e backups diários. Seus dados ficam em servidores seguros na nuvem.",
    },
    {
      question: "Preciso instalar algum programa?",
      answer: "Não! O Foguete funciona 100% online. Acesse de qualquer navegador, computador, tablet ou celular.",
    },
    {
      question: "Tem limite de agendamentos?",
      answer: "Não! Todos os planos têm agendamentos ilimitados para você crescer sem preocupações.",
    },
    {
      question: "Como funciona o suporte?",
      answer: "Oferecemos suporte via email, chat e WhatsApp. Planos Semestral e Anual têm suporte prioritário.",
    },
  ];

  const guaranteeBadges = [
    { icon: Shield, text: "7 Dias Grátis" },
    { icon: XCircle, text: "Cancele Quando Quiser" },
    { icon: Lock, text: "Dados Criptografados" },
    { icon: HeadphonesIcon, text: "Suporte em Português" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/554899075189?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* Header */}
      <header className="border-b glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img alt="Foguete" className="h-14 w-auto dark:hidden" src="/lovable-uploads/80412b3c-5edc-43b9-ab6d-a607dcdc2156.png" />
            <img src={logoAntigo} alt="Foguete" className="h-14 w-auto hidden dark:block" />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {["home", "features", "testimonials", "pricing", "faq"].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300"
              >
                {item === "home" ? "Início" : item === "features" ? "Recursos" : item === "testimonials" ? "Depoimentos" : item === "pricing" ? "Preços" : "FAQ"}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!isAuthenticated ? (
              <>
                <Button onClick={() => navigate("/auth")} variant="ghost" className="hidden md:flex">Entrar</Button>
                <Button onClick={() => navigate("/auth")} className="hidden md:flex gap-2 bg-primary shadow-lg">
                  Começe Grátis <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/dashboard")} className="hidden md:flex gap-2 shadow-lg">
                Ir para Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t glass">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {["home", "features", "testimonials", "pricing", "faq"].map((item) => (
                <button key={item} onClick={() => scrollToSection(item)} className="text-left text-sm font-medium text-muted-foreground hover:text-primary py-2">
                  {item === "home" ? "Início" : item === "features" ? "Recursos" : item === "testimonials" ? "Depoimentos" : item === "pricing" ? "Preços" : "FAQ"}
                </button>
              ))}
              <Button onClick={() => navigate("/auth")} className="w-full gap-2 bg-primary mt-2">
                Começe Grátis <ArrowRight className="w-4 h-4" />
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="relative min-h-[90vh] flex items-center py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-60" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float-slow" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div className="space-y-6 text-center lg:text-left">
              <Badge className="px-6 py-2.5 text-sm font-semibold bg-primary/10 text-primary border-primary/30">
                <Sparkles className="w-4 h-4 mr-2" />
                Sistema de Gestão Completo
              </Badge>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                <span className="text-foreground">Decole seu</span>
                <br />
                <span className="text-gradient-primary">negócio</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Sistema completo para <span className="text-foreground font-semibold">salões, clínicas, barbearias</span> e prestadores de serviço.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {guaranteeBadges.map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2.5 glass rounded-full">
                    <badge.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{badge.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" onClick={handleGetStarted} className="h-14 px-8 text-lg gap-3 shadow-xl bg-primary">
                  {isAuthenticated ? "Acessar Dashboard" : "Começar Teste Grátis"}
                  <Rocket className="w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => window.open("https://wa.me/554899075189", "_blank")} className="h-14 px-8 text-lg gap-3 glass">
                  <MessageCircle className="w-5 h-5" />
                  Falar com Vendas
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                {["Sem cartão de crédito", "7 dias grátis", "Cancele quando quiser"].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Mockup */}
            <div className="hidden lg:block">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <ProductShowcase />

      {/* How It Works */}
      <HowItWorks />

      {/* Features Grid */}
      <FeatureGrid />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Pricing */}
      <PricingSection onGetStarted={handleGetStarted} />

      {/* FAQ */}
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
                <AccordionItem key={index} value={`item-${index}`} className="glass rounded-xl px-6 border-0 shadow-sm">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">Ainda tem dúvidas?</p>
              <Button variant="outline" className="gap-2 h-12 px-6 glass" onClick={() => window.open("https://wa.me/554899075189", "_blank")}>
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
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center bg-card rounded-3xl shadow-2xl p-12 md:p-16 border">
            <Rocket className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              Pronto para <span className="text-gradient-primary">decolar</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Junte-se a mais de 5.000 empresários que já transformaram sua gestão
            </p>
            <Button size="lg" onClick={handleGetStarted} className="h-16 px-10 text-lg gap-3 shadow-xl bg-primary">
              {isAuthenticated ? "Ir para Dashboard" : "Começar Teste Grátis"}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-8">
              ✓ Sem cartão de crédito &nbsp;•&nbsp; ✓ 7 dias grátis &nbsp;•&nbsp; ✓ Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
            {/* Logo e Descrição */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={foguetinho} alt="Foguete" className="h-12 w-auto dark:hidden" />
                <img src={logoAntigo} alt="Foguete" className="h-12 w-auto hidden dark:block" />
                <span className="text-xl font-bold text-foreground">Foguete</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sistema completo de gestão empresarial para salões, clínicas, barbearias e prestadores de serviço.
              </p>
            </div>

            {/* Produto */}
            <div>
              <h3 className="font-bold text-foreground mb-5 text-base">Produto</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <button onClick={() => scrollToSection("features")} className="text-muted-foreground hover:text-primary transition-colors">
                    Funcionalidades
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("pricing")} className="text-muted-foreground hover:text-primary transition-colors">
                    Preços
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("testimonials")} className="text-muted-foreground hover:text-primary transition-colors">
                    Depoimentos
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("faq")} className="text-muted-foreground hover:text-primary transition-colors">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h3 className="font-bold text-foreground mb-5 text-base">Contato</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a 
                    href="https://wa.me/5548988430812" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Vendas: (48) 98843-0812
                  </a>
                </li>
                <li>
                  <a 
                    href="https://wa.me/554899075189" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <HeadphonesIcon className="w-4 h-4 text-primary" />
                    Suporte: (48) 99075-1889
                  </a>
                </li>
              </ul>
            </div>

            {/* Horário */}
            <div>
              <h3 className="font-bold text-foreground mb-5 text-base">Horário</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  Seg - Sex: 9h às 18h
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                  Suporte 24/7 via WhatsApp
                </li>
              </ul>
            </div>
          </div>

          {/* Divisor e Copyright */}
          <div className="border-t mt-12 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                © 2025 Foguete Gestão Empresarial. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <a href="/politica-privacidade" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacidade
                </a>
                <a href="/termos-servico" className="text-muted-foreground hover:text-primary transition-colors">
                  Termos
                </a>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="w-4 h-4 text-primary" />
                  LGPD
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
