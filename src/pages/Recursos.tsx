import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import FeatureGrid from "@/components/landing/FeatureGrid";
import { SimpleButton } from "@/components/ui/simple-button";
import { useNavigate } from "react-router-dom";

export default function Recursos() {
  const navigate = useNavigate();

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
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </a>

      {/* Hero - CSS animation instead of framer-motion */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Recursos Completos
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Tudo que você precisa para{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                crescer seu negócio
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas para automatizar, organizar e escalar sua operação. 
              Do agendamento ao financeiro, tudo em um só lugar.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <FeatureGrid />

      {/* CTA Section - CSS animation */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-3xl p-12 border border-orange-500/20 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4">
              Pronto para decolar?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Comece agora mesmo e transforme a gestão do seu negócio. 
              Teste grátis por 7 dias, sem compromisso.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SimpleButton size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Começar Grátis
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </SimpleButton>
              <SimpleButton size="lg" variant="outline" onClick={() => navigate("/precos")}>
                Ver Preços
              </SimpleButton>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
