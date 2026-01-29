import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const RocketIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const MessageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14m-7-7 7 7-7 7"/>
  </svg>
);

const PublicNavbar = lazy(() => import("@/components/PublicNavbar"));
const PublicFooter = lazy(() => import("@/components/PublicFooter"));
const VideoSection = lazy(() => import("@/components/landing/VideoSection"));
const ProductShowcase = lazy(() => import("@/components/landing/ProductShowcase"));
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));
const FeatureGrid = lazy(() => import("@/components/landing/FeatureGrid"));
const PricingSection = lazy(() => import("@/components/landing/PricingSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const HeroMockup = lazy(() => import("@/components/landing/HeroMockup"));

const SectionSkeleton = memo(() => (
  <div className="py-16 flex items-center justify-center">
    <div className="w-full max-w-4xl h-64 rounded-2xl bg-muted animate-pulse" />
  </div>
));
SectionSkeleton.displayName = 'SectionSkeleton';

const NavbarSkeleton = memo(() => (
  <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 border-b border-border" />
));
NavbarSkeleton.displayName = 'NavbarSkeleton';

const Landing = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });
    
    const authTimer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    }, 1500);
    
    const whatsappTimer = setTimeout(() => {
      setShowWhatsApp(true);
    }, 3000);
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(authTimer);
      clearTimeout(whatsappTimer);
    };
  }, []);

  const handleGetStarted = useCallback(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth?mode=signup");
    }
  }, [isAuthenticated, navigate]);

  const handleWhatsAppClick = useCallback(() => {
    window.open("https://wa.me/554899075189?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão", "_blank");
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {showWhatsApp && (
        <button
          onClick={handleWhatsAppClick}
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-xl transition-all duration-300 animate-fade-in"
          aria-label="Fale conosco no WhatsApp"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </button>
      )}

      <Suspense fallback={<NavbarSkeleton />}>
        <PublicNavbar />
      </Suspense>

      <div className="h-16" />

      <section id="home" className="relative min-h-[90vh] flex items-center py-16 md:py-24 overflow-hidden">
        <div className="hidden md:block absolute inset-0 bg-mesh-gradient opacity-60" />
        <div className="hidden md:block absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="hidden md:block absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="hidden md:block absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float-slow" />
        <div className="md:hidden absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <Badge className="px-6 py-2.5 text-sm font-semibold bg-primary/10 text-primary border-primary/30">
                <SparklesIcon />
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
                <div className="flex items-center gap-2 px-4 py-2.5 bg-card/80 border border-border/50 rounded-full">
                  <span className="text-sm">🛡️</span>
                  <span className="text-sm font-medium">7 Dias Grátis</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-card/80 border border-border/50 rounded-full">
                  <span className="text-sm">❌</span>
                  <span className="text-sm font-medium">Cancele Quando Quiser</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-card/80 border border-border/50 rounded-full">
                  <span className="text-sm">🔒</span>
                  <span className="text-sm font-medium">Dados Criptografados</span>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-card/80 border border-border/50 rounded-full">
                  <span className="text-sm">🎧</span>
                  <span className="text-sm font-medium">Suporte em Português</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" onClick={handleGetStarted} className="h-14 px-8 text-lg gap-3 shadow-xl bg-primary">
                  {isAuthenticated ? "Acessar Dashboard" : "Começar Teste Grátis"}
                  <RocketIcon />
                </Button>
                <Button size="lg" variant="outline" onClick={handleWhatsAppClick} className="h-14 px-8 text-lg gap-3">
                  <MessageIcon />
                  Falar com Vendas
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckIcon />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon />
                  <span>7 dias grátis</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <CheckIcon />
                  <span>Cancele quando quiser</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <Suspense fallback={<div className="w-full h-96 bg-muted/30 rounded-2xl animate-pulse" />}>
                <HeroMockup />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<SectionSkeleton />}>
        <VideoSection />
      </Suspense>

      <section id="recursos">
        <Suspense fallback={<SectionSkeleton />}>
          <ProductShowcase />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <FeatureGrid />
        </Suspense>
      </section>

      <Suspense fallback={<SectionSkeleton />}>
        <HowItWorks />
      </Suspense>

      <section id="depoimentos">
        <Suspense fallback={<SectionSkeleton />}>
          <TestimonialsSection />
        </Suspense>
      </section>

      <section id="precos">
        <Suspense fallback={<SectionSkeleton />}>
          <PricingSection onGetStarted={handleGetStarted} />
        </Suspense>
      </section>

      <section id="faq">
        <Suspense fallback={<SectionSkeleton />}>
          <FAQSection />
        </Suspense>
      </section>

      <section className="py-16 md:py-24 relative overflow-hidden defer-mobile">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center bg-card rounded-3xl shadow-xl p-8 md:p-16 border">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
              </svg>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6">
              Pronto para <span className="text-gradient-primary">decolar</span>?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a mais de 5.000 empresários que já transformaram sua gestão
            </p>
            <Button size="lg" onClick={handleGetStarted} className="h-14 md:h-16 px-8 md:px-10 text-lg gap-3 shadow-xl bg-primary">
              {isAuthenticated ? "Ir para Dashboard" : "Começar Teste Grátis"}
              <ArrowRightIcon />
            </Button>
            <p className="text-sm text-muted-foreground mt-6">
              ✓ Sem cartão &nbsp;•&nbsp; ✓ 7 dias grátis &nbsp;•&nbsp; ✓ Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="h-64 bg-background" />}>
        <PublicFooter />
      </Suspense>
    </div>
  );
};

export default Landing;