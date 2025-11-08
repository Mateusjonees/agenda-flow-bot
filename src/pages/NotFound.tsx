import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, Home, ArrowLeft, Sparkles } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      <Card className="max-w-2xl w-full relative z-10 border-2" 
            style={{ boxShadow: 'var(--shadow-lg)' }}>
        <CardContent className="p-8 md:p-12">
          <div className="text-center space-y-6">
            {/* Logo with rocket animation */}
            <div className="flex justify-center mb-6 relative">
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="Foguete Gestão" 
                  className="h-24 w-auto relative z-10"
                />
                <div className="absolute inset-0 blur-2xl opacity-50"
                     style={{ background: 'var(--gradient-rocket)' }} />
              </div>
            </div>

            {/* 404 number with gradient */}
            <div className="relative">
              <h1 className="text-8xl md:text-9xl font-bold bg-clip-text text-transparent"
                  style={{ 
                    backgroundImage: 'var(--gradient-rocket)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                404
              </h1>
              <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-secondary animate-pulse" />
              <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-accent animate-pulse" 
                        style={{ animationDelay: '0.5s' }} />
            </div>

            {/* Message */}
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                <Rocket className="w-6 h-6 text-primary" />
                Ops! Página não encontrada
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
                Parece que esta página decolou para outra galáxia. 
                Vamos te levar de volta para a base!
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="lg"
                className="gap-2 group hover:border-primary/50 transition-all"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Voltar
              </Button>
              
              <Button
                onClick={() => navigate("/")}
                size="lg"
                className="gap-2 group relative overflow-hidden"
                style={{ 
                  background: 'var(--gradient-primary)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <Home className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Ir para Home</span>
                <div className="absolute inset-0 bg-primary-hover opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>

            {/* Fun footer */}
            <div className="pt-8 text-xs text-muted-foreground">
              <p>Código de erro: 404 • Página não encontrada</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
