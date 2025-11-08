import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Rocket, 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart3, 
  Star,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import logo from "@/assets/logo.png";

const Landing = () => {
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
      navigate("/auth");
    }
  };

  const features = [
    {
      icon: Calendar,
      title: "Agendamentos Inteligentes",
      description: "Gerencie seus horários de forma eficiente com calendário visual e lembretes automáticos"
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Histórico completo, cartão fidelidade e comunicação automatizada com WhatsApp"
    },
    {
      icon: DollarSign,
      title: "Controle Financeiro",
      description: "Acompanhe receitas, despesas e fluxo de caixa em tempo real"
    },
    {
      icon: BarChart3,
      title: "Relatórios Detalhados",
      description: "Analytics completo para tomar decisões baseadas em dados"
    },
    {
      icon: Star,
      title: "Pós-venda Automático",
      description: "Solicite avaliações e envie cupons automaticamente após cada serviço"
    },
    {
      icon: Sparkles,
      title: "Propostas Profissionais",
      description: "Crie e envie propostas profissionais com acompanhamento de status"
    }
  ];

  const benefits = [
    "Sem instalação - 100% online",
    "Interface intuitiva e moderna",
    "Suporte técnico dedicado",
    "Atualizações constantes",
    "Segurança de dados garantida",
    "Relatórios em tempo real"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Foguete" className="h-10 w-auto" />
            <span className="text-xl font-bold text-foreground">Foguete</span>
          </div>
          <Button onClick={handleGetStarted} className="gap-2">
            {isAuthenticated ? "Ir para Dashboard" : "Acessar Sistema"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <div className="bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm font-medium text-primary mb-6">
              🚀 Sistema de Gestão Empresarial Completo
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Decole seu negócio com
            <span className="block text-primary mt-2">gestão profissional</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema completo para salões, clínicas, barbearias e prestadores de serviço. 
            Gerencie agendamentos, clientes, finanças e muito mais em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="h-14 px-8 text-base gap-2"
            >
              {isAuthenticated ? "Acessar Dashboard" : "Começar Agora"}
              <Rocket className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-14 px-8 text-base"
            >
              Ver Funcionalidades
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-lg text-muted-foreground">
              Funcionalidades completas para transformar sua gestão
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Por que escolher o Foguete?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pronto para decolar?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de empresários que já transformaram sua gestão com o Foguete
            </p>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="h-14 px-8 text-base gap-2"
            >
              {isAuthenticated ? "Ir para Dashboard" : "Criar Minha Conta Grátis"}
              <Rocket className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Foguete" className="h-8 w-auto" />
              <span className="text-sm text-muted-foreground">
                © 2025 Foguete. Todos os direitos reservados.
              </span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
