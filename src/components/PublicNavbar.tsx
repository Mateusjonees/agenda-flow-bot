import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoLight from "@/assets/logo.png";

interface NavLink {
  label: string;
  sectionId: string;
}

const navLinks: NavLink[] = [
  { label: "Recursos", sectionId: "recursos" },
  { label: "Depoimentos", sectionId: "depoimentos" },
  { label: "Preços", sectionId: "precos" },
  { label: "FAQ", sectionId: "faq" },
];

export function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const scrollToSection = (sectionId: string) => {
    // If not on landing page, navigate first
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 dark:bg-[#1a1f2e]/95 backdrop-blur-sm border-b border-border dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/lovable-uploads/80412b3c-5edc-43b9-ab6d-a607dcdc2156.png" 
              alt="Foguete" 
              width={48}
              height={48}
              loading="eager"
              fetchPriority="high"
              className="h-12 w-auto dark:hidden" 
            />
            <img 
              src={logoLight} 
              alt="Foguete" 
              width={48}
              height={48}
              loading="lazy"
              className="h-12 w-auto hidden dark:block" 
            />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.sectionId}
                onClick={() => scrollToSection(link.sectionId)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button 
                onClick={() => navigate("/dashboard")} 
                className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                Ir para Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/auth")}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Entrar
                </Button>
                <Button 
                  onClick={() => navigate("/auth?mode=signup")} 
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg"
                >
                  Comece Grátis
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-foreground hover:bg-accent"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border dark:border-white/10 animate-fade-in bg-background dark:bg-[#1a1f2e]">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.sectionId}
                  onClick={() => scrollToSection(link.sectionId)}
                  className="px-4 py-3 rounded-lg text-left font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-4 border-t border-border dark:border-white/10 mt-2">
                {isAuthenticated ? (
                  <Button 
                    onClick={() => navigate("/dashboard")} 
                    className="w-full gap-2 bg-red-600 hover:bg-red-700"
                  >
                    Ir para Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/auth")} 
                      className="w-full"
                    >
                      Entrar
                    </Button>
                    <Button 
                      onClick={() => navigate("/auth?mode=signup")} 
                      className="w-full gap-2 bg-red-600 hover:bg-red-700"
                    >
                      Comece Grátis
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default PublicNavbar;