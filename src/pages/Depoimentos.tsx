import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageCircle, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Depoimentos() {
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
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              O que nossos{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                clientes dizem
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Milhares de empreendedores já transformaram seus negócios com o Foguete. 
              Veja o que eles têm a dizer.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: "10K+", label: "Clientes Ativos" },
              { value: "4.9", label: "Avaliação Média" },
              { value: "98%", label: "Satisfação" },
              { value: "500K+", label: "Agendamentos/Mês" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

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
              Faça parte dessa história
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Junte-se a milhares de empreendedores que já estão crescendo com o Foguete.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Começar Agora
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/recursos")}>
                Ver Recursos
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
