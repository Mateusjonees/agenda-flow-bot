import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoLight from "@/assets/logo.png";

export function PublicNavbar() {
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background dark:bg-[#1a1f2e] border-b border-border dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => navigate("/")}
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

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button 
                onClick={() => navigate("/dashboard")} 
                size="sm"
                className="gap-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Dashboard
                <ArrowRight className="w-3 h-3" />
              </Button>
            ) : (
              <Button 
                onClick={() => navigate("/auth?mode=signup")} 
                size="sm"
                className="gap-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Comece Grátis
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}