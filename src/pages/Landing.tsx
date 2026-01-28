import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Rocket,
  ArrowRight,
  Sparkles,
  Shield,
  Lock,
  HeadphonesIcon,
  MessageCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
import { Skeleton } from "@/components/ui/skeleton";

// Hero components loaded immediately (above the fold)
import HeroMockup from "@/components/landing/HeroMockup";

// Lazy load navbar/footer for faster FCP
const PublicNavbar = lazy(() => import("@/components/PublicNavbar"));
const PublicFooter = lazy(() => import("@/components/PublicFooter"));

// Lazy load components below the fold for better performance
const VideoSection = lazy(() => import("@/components/landing/VideoSection"));
const ProductShowcase = lazy(() => import("@/components/landing/ProductShowcase"));
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));
const FeatureGrid = lazy(() => import("@/components/landing/FeatureGrid"));
const PricingSection = lazy(() => import("@/components/landing/PricingSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));

// Loading skeleton for lazy components
const SectionSkeleton = () => (
  <div className="py-16 flex items-center justify-center">
    <Skeleton className="w-full max-w-4xl h-64 rounded-2xl" />
  </div>
);

// Minimal navbar skeleton
const NavbarSkeleton = () => (
  <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 border-b border-border" />
);

const Landing = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const { trackViewContent, trackLead, trackContact } = useFacebookPixel();

  useEffect(() => {
    // Track landing page view
    trackViewContent({
      content_name: 'Landing Page',
      content_category: 'marketing',
    });

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });
    
    // Defer WhatsApp button loading for better performance
    const timer = setTimeout(() => {
      setShowWhatsApp(true);
    }, 2000);
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [trackViewContent]);

  const handleGetStarted = () => {
    // Track lead when user clicks to get started
    trackLead({ content_name: 'cta_click', content_category: 'conversion' });
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth?mode=signup");
    }
  };

  const guaranteeBadges = [
    { icon: Shield, text: "7 Dias Grátis" },
    { icon: XCircle, text: "Cancele Quando Quiser" },
    { icon: Lock, text: "Dados Criptografados" },
    { icon: HeadphonesIcon, text: "Suporte em Português" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* WhatsApp Floating Button - Deferred */}
      {showWhatsApp && (
        <button
          onClick={() => {
            trackContact('whatsapp_floating');
            window.open("https://wa.me/554899075189?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão", "_blank");
          }}
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 animate-fade-in"
          aria-label="Fale conosco no WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Header - Lazy loaded */}
      <Suspense fallback={<NavbarSkeleton />}>
        <PublicNavbar />
      </Suspense>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Hero Section - Simplified for mobile */}
      <section id="home" className="relative min-h-[90vh] flex items-center py-16 md:py-24 overflow-hidden">
        {/* Decorative elements - Hidden on mobile for performance */}
        <div className="hidden md:block absolute inset-0 bg-mesh-gradient opacity-60" />
        <div className="hidden md:block absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="hidden md:block absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="hidden md:block absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float-slow" />
        
        {/* Simple mobile background */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div className="space-y-6 text-center lg:text-left animate-fade-in">
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
                  <div key={i} className="flex items-center gap-2 px-4 py-2.5 bg-card/80 border border-border/50 rounded-full">
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
                <Button size="lg" variant="outline" onClick={() => window.open("https://wa.me/554899075189", "_blank")} className="h-14 px-8 text-lg gap-3">
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

      {/* Video Section - Below Hero */}
      <Suspense fallback={<SectionSkeleton />}>
        <VideoSection />
      </Suspense>

      {/* Product Showcase */}
      <section id="recursos">
        <Suspense fallback={<SectionSkeleton />}>
          <ProductShowcase />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <FeatureGrid />
        </Suspense>
      </section>

      {/* How It Works */}
      <Suspense fallback={<SectionSkeleton />}>
        <HowItWorks />
      </Suspense>

      {/* Testimonials */}
      <section id="depoimentos">
        <Suspense fallback={<SectionSkeleton />}>
          <TestimonialsSection />
        </Suspense>
      </section>

      {/* Pricing */}
      <section id="precos">
        <Suspense fallback={<SectionSkeleton />}>
          <PricingSection onGetStarted={handleGetStarted} />
        </Suspense>
      </section>

      {/* FAQ */}
      <section id="faq">
        <Suspense fallback={<SectionSkeleton />}>
          <FAQSection />
        </Suspense>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center bg-card rounded-3xl shadow-2xl p-12 md:p-16 border animate-fade-in">
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

      {/* Footer - Lazy loaded */}
      <Suspense fallback={<div className="h-64 bg-background" />}>
        <PublicFooter />
      </Suspense>
    </div>
  );
};

export default Landing;
