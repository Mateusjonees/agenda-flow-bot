import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoLight from "@/assets/logo.png";

interface NavLink {
  label: string;
  path: string;
}

const navLinks: NavLink[] = [
  { label: "Início", path: "/" },
  { label: "Recursos", path: "/recursos" },
  { label: "Depoimentos", path: "/depoimentos" },
  { label: "Preços", path: "/precos" },
  { label: "FAQ", path: "/faq" },
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

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background dark:bg-[#1a1f2e] border-b border-border dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => handleNavigation("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/lovable-uploads/80412b3c-5edc-43b9-ab6d-a607dcdc2156.png" 
              alt="Foguete" 
              className="h-16 w-auto dark:hidden" 
            />
            <img 
              src={logoLight} 
              alt="Foguete" 
              className="h-16 w-auto hidden dark:block" 
            />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavigation(link.path)}
                className={`px-2 py-2 text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
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

          {/* Mobile Menu Button */}
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border dark:border-white/10 animate-fade-in bg-background dark:bg-[#1a1f2e]">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => handleNavigation(link.path)}
                  className={`px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    isActive(link.path)
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
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