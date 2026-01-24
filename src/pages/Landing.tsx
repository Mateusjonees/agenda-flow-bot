import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Rocket, ArrowRight, Sparkles, Shield, Lock, HeadphonesIcon, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

// Lazy load ALL heavy components
const HeroMockup = lazy(() => import("@/components/landing/HeroMockup"));
const ProductShowcase = lazy(() => import("@/components/landing/ProductShowcase"));
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));

// Ultra-light skeleton
const SectionSkeleton = () => (
  <div className="py-16 flex items-center justify-center">
    <div className="w-full max-w-4xl h-48 bg-muted/50 rounded-xl animate-pulse mx-4" />
  </div>
);

const guaranteeBadges = [
  { icon: Shield, text: "7 Dias Grátis" },
  { icon: XCircle, text: "Cancele Quando Quiser" },
  { icon: Lock, text: "Dados Criptografados" },
  { icon: HeadphonesIcon, text: "Suporte em Português" },
];

const Landing = memo(() => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      navigate("/auth?mode=signup");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/554899075189?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-xl transition-transform hover:scale-110"
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      <PublicNavbar />
      <div className="h-16" />

      {/* Hero Section - Inline, no lazy load */}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - Text */}
            <div className="space-y-5 text-center lg:text-left">
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

            {/* Right - Mockup (lazy, desktop only) */}
            <div className="hidden lg:block">
              <Suspense fallback={<SectionSkeleton />}>
                <HeroMockup />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Lazy-loaded sections */}
      <Suspense fallback={<SectionSkeleton />}>
        <ProductShowcase />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <HowItWorks />
      </Suspense>

      {/* Final CTA - Inline */}
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

Landing.displayName = "Landing";
export default Landing;
