import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Rocket, ArrowRight, Sparkles, Shield, Lock, HeadphonesIcon, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// CRITICAL: Lazy load Navbar/Footer - not needed for FCP
const PublicNavbar = memo(function LazyNavbar() {
  const [NavComponent, setNavComponent] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    import("@/components/PublicNavbar").then(m => setNavComponent(() => m.PublicNavbar));
  }, []);
  return NavComponent ? <NavComponent /> : <div className="h-16 bg-background border-b" />;
});

const PublicFooter = memo(function LazyFooter() {
  const [FooterComponent, setFooterComponent] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    import("@/components/PublicFooter").then(m => setFooterComponent(() => m.PublicFooter));
  }, []);
  return FooterComponent ? <FooterComponent /> : null;
});

const guaranteeBadges = [
  { icon: Shield, text: "7 Dias Grátis" },
  { icon: XCircle, text: "Cancele Quando Quiser" },
  { icon: Lock, text: "Dados Criptografados" },
  { icon: HeadphonesIcon, text: "Suporte em Português" },
];

const Landing = memo(() => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    // Load extras after first paint - CRITICAL for LCP
    const timer = requestIdleCallback(() => setShowExtras(true), { timeout: 1500 });
    
    return () => {
      subscription.unsubscribe();
      if (typeof timer === 'number') cancelIdleCallback(timer);
    };
  }, []);

  const handleGetStarted = () => {
    navigate(isAuthenticated ? "/dashboard" : "/auth?mode=signup");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* WhatsApp Floating - defer render */}
      {showExtras && (
        <a
          href="https://wa.me/554899075189?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white rounded-full p-4 shadow-xl"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}

      <PublicNavbar />
      <div className="h-16" />

      {/* Hero Section - INLINE for FCP */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center lg:text-left lg:max-w-none lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div className="space-y-5">
              <Badge className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/30">
                <Sparkles className="w-4 h-4 mr-2" />
                Sistema de Gestão Completo
              </Badge>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                <span className="text-foreground">Decole seu</span>
                <br />
                <span className="text-primary">negócio</span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
                Sistema completo para gestão empresarial, para qualquer tipo de negócio.
              </p>

              {/* Guarantee badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                {guaranteeBadges.map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
                    <badge.icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium">{badge.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button size="lg" onClick={handleGetStarted} className="h-12 px-6 gap-2 bg-primary">
                  {isAuthenticated ? "Acessar Dashboard" : "Começar Teste Grátis"}
                  <Rocket className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => window.open("https://wa.me/554899075189", "_blank")}
                  className="h-12 px-6 gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar com Vendas
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground">
                {["Sem cartão de crédito", "7 dias grátis", "Cancele quando quiser"].map((text, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup - HIDDEN on mobile, lazy on desktop */}
            <div className="hidden lg:block" />
          </div>
        </div>
      </section>

      {/* Lazy-loaded sections - only after interaction */}
      {showExtras && <LazyProductShowcase />}
      {showExtras && <LazyHowItWorks />}

      {/* Final CTA */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-card rounded-2xl shadow-lg p-8 md:p-12 border">
            <Rocket className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-4xl font-extrabold mb-4">
              Pronto para <span className="text-primary">decolar</span>?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Junte-se a mais de 5.000 empresários que já transformaram sua gestão
            </p>
            <Button size="lg" onClick={handleGetStarted} className="h-12 px-8 gap-2 bg-primary">
              {isAuthenticated ? "Ir para Dashboard" : "Começar Teste Grátis"}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-xs text-muted-foreground mt-6">
              ✓ Sem cartão • ✓ 7 dias grátis • ✓ Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
});

// Super lightweight lazy loaders
const LazyProductShowcase = memo(() => {
  const [Comp, setComp] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    import("@/components/landing/ProductShowcase").then(m => setComp(() => m.default));
  }, []);
  return Comp ? <Comp /> : <div className="py-16" />;
});

const LazyHowItWorks = memo(() => {
  const [Comp, setComp] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    import("@/components/landing/HowItWorks").then(m => setComp(() => m.default));
  }, []);
  return Comp ? <Comp /> : <div className="py-16" />;
});

Landing.displayName = "Landing";
export default Landing;
