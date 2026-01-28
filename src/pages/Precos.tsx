import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import PricingSection from "@/components/landing/PricingSection";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageCircle, Check, Shield } from "lucide-react";

export default function Precos() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      
      {/* Botão WhatsApp Flutuante */}
      <a
        href="https://wa.me/554899075189?text=Olá,%20gostaria%20de%20conhecer%20o%20Foguete%20Gestão"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* Hero - CSS animation */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Planos Flexíveis
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Escolha o plano{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                ideal para você
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e escale conforme seu negócio cresce. 
              Sem surpresas, sem taxas escondidas.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <PricingSection onGetStarted={handleGetStarted} />

      {/* Garantias - CSS animation */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-muted/30 rounded-2xl p-8 md:p-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold">Garantia Total</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "7 dias de teste grátis em todos os planos",
                "Cancele a qualquer momento sem multa",
                "Suporte prioritário por WhatsApp",
                "Migração gratuita dos seus dados",
                "Treinamento incluso para sua equipe",
                "Atualizações constantes sem custo extra",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Link - CSS animation */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-4">Ainda tem dúvidas?</h2>
            <p className="text-muted-foreground mb-6">
              Confira nossa página de perguntas frequentes ou entre em contato conosco.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate("/faq")}>
                Ver FAQ
              </Button>
              <Button onClick={() => window.open("https://wa.me/554899075189", "_blank")} className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Falar com Suporte
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
