import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, X, ArrowRight, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => handleNavigation("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Foguete
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavigation(link.path)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
              <Button onClick={() => navigate("/dashboard")} className="gap-2">
                Ir para Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Entrar
                </Button>
                <Button onClick={() => navigate("/auth")} className="gap-2">
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
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => handleNavigation(link.path)}
                  className={`px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    isActive(link.path)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-4 border-t border-border mt-2">
                {isAuthenticated ? (
                  <Button onClick={() => navigate("/dashboard")} className="w-full gap-2">
                    Ir para Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">
                      Entrar
                    </Button>
                    <Button onClick={() => navigate("/auth")} className="w-full gap-2">
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
