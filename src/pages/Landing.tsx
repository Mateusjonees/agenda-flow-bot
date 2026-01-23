import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Rocket, ArrowRight, Sparkles, Shield, Lock, HeadphonesIcon, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

// Lazy load heavy components
const HeroMockup = lazy(() => import("@/components/landing/HeroMockup"));
const ProductShowcase = lazy(() => import("@/components/landing/ProductShowcase"));
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));

// Simple fallback for lazy components
const SectionFallback = () => <div className="min-h-[400px] flex items-center justify-center">
    <div className="animate-pulse bg-muted rounded-xl w-full max-w-4xl h-64 mx-auto" />
  </div>;
const guaranteeBadges = [{
  icon: Shield,
  text: "7 Dias Grátis"
}, {
  icon: XCircle,
  text: "Cancele Quando Quiser"
}, {
  icon: Lock,
  text: "Dados Criptografados"
}, {
  icon: HeadphonesIcon,
  text: "Suporte em Português"
}];
const Landing = memo(() => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const {
    trackViewContent,
    trackLead,
    trackContact
  } = useFacebookPixel();
  useEffect(() => {
    // Track landing page view
    trackViewContent({
      content_name: 'Landing Page',
      content_category: 'marketing'
    });
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, [trackViewContent]);
  const handleGetStarted = () => {
    trackLead({
      content_name: 'cta_click',
      content_category: 'conversion'
    });
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth?mode=signup");
    }
  };
  return <div className="min-h-screen bg-background overflow-hidden">
      {/* WhatsApp Floating Button */}
      <button onClick={() => {
      trackContact('whatsapp_floating');
      window.open("https://wa.me/554899075189?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão", "_blank");
    }} className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110" aria-label="Fale conosco no WhatsApp">
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Header */}
      <PublicNavbar />

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Hero Section */}
      <section id="home" className="relative min-h-[90vh] flex items-center py-16 md:py-24 overflow-hidden">
        {/* Background - Simplified on mobile */}
        <div className="absolute inset-0 bg-mesh-gradient opacity-60" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30 hidden md:block" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl hidden md:block" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl hidden md:block" />

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
                Sistema completo para <span className="text-foreground font-semibold">gestão empresarial</span> e prestadores de serviço.
              </p>

              {/* Guarantee badges - Simplified layout on mobile */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-3">
                {guaranteeBadges.map((badge, i) => <div key={i} className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 glass rounded-full">
                    <badge.icon className="w-4 h-4 text-primary" />
                    <span className="text-xs md:text-sm font-medium">{badge.text}</span>
                  </div>)}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" onClick={handleGetStarted} className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg gap-3 shadow-xl bg-primary">
                  {isAuthenticated ? "Acessar Dashboard" : "Começar Teste Grátis"}
                  <Rocket className="w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => window.open("https://wa.me/554899075189", "_blank")} className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg gap-3 glass">
                  <MessageCircle className="w-5 h-5" />
                  Falar com Vendas
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground">
                {["Sem cartão de crédito", "7 dias grátis", "Cancele quando quiser"].map((text, i) => <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{text}</span>
                  </div>)}
              </div>
            </div>

            {/* Right - Mockup (lazy loaded, hidden on mobile) */}
            <div className="hidden lg:block">
              <Suspense fallback={<SectionFallback />}>
                <HeroMockup />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase - Lazy loaded */}
      <Suspense fallback={<SectionFallback />}>
        <ProductShowcase />
      </Suspense>

      {/* How It Works - Lazy loaded */}
      <Suspense fallback={<SectionFallback />}>
        <HowItWorks />
      </Suspense>

      {/* Final CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center bg-card rounded-3xl shadow-2xl p-8 md:p-12 lg:p-16 border">
            <Rocket className="w-12 md:w-16 h-12 md:h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
              Pronto para <span className="text-gradient-primary">decolar</span>?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto">
              Junte-se a mais de 5.000 empresários que já transformaram sua gestão
            </p>
            <Button size="lg" onClick={handleGetStarted} className="h-14 md:h-16 px-8 md:px-10 text-base md:text-lg gap-3 shadow-xl bg-primary">
              {isAuthenticated ? "Ir para Dashboard" : "Começar Teste Grátis"}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-xs md:text-sm text-muted-foreground mt-6 md:mt-8">
              ✓ Sem cartão de crédito &nbsp;•&nbsp; ✓ 7 dias grátis &nbsp;•&nbsp; ✓ Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>;
});
Landing.displayName = "Landing";
export default Landing;