import { Star, MessageCircle, Users, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { TestimonialsGrid } from "@/components/TestimonialsGrid";

const stats = [
  { icon: Users, value: "500+", label: "Clientes Ativos" },
  { icon: Star, value: "4.9", label: "Avaliação Média" },
  { icon: TrendingUp, value: "98%", label: "Satisfação" },
  { icon: Calendar, value: "10k+", label: "Agendamentos/Mês" }
];

export default function Depoimentos() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      
      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/554899075189?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* Hero Section - CSS animation */}
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-6">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                4.9 de avaliação média
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              O que nossos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
                clientes dizem
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Descubra como o Foguete Gestão está transformando negócios em todo o Brasil. 
              Histórias reais de sucesso de empreendedores como você.
            </p>
          </div>

          {/* Stats - CSS animation */}
          <div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="bg-card rounded-xl p-4 border border-border text-center shadow-sm"
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid - CSS animation */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <TestimonialsGrid />
          </div>
        </div>
      </section>

      {/* CTA Section - CSS animation */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div 
            className="bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-3xl p-8 md:p-12 border border-primary/30 text-center animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Pronto para ter sua história de sucesso?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Junte-se a centenas de empreendedores que já transformaram seus negócios com o Foguete Gestão.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?mode=signup")} 
                className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-semibold px-8"
              >
                Começar Agora
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/recursos")}>
                Ver Recursos
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
