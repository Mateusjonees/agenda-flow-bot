import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import FeatureGrid from "@/components/landing/FeatureGrid";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Recursos() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      
      {/* Botão WhatsApp Flutuante */}
      <a
        href="https://wa.me/5511999999999"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <FeatureGrid />

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-3xl p-12 border border-orange-500/20"
          >
            <h2 className="text-3xl font-bold mb-4">
              Pronto para decolar?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Comece agora mesmo e transforme a gestão do seu negócio. 
              Teste grátis por 7 dias, sem compromisso.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Começar Grátis
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/precos")}>
                Ver Preços
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
