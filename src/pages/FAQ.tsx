import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Como funciona o período de teste?",
      answer: "Você tem 7 dias grátis para testar todas as funcionalidades sem compromisso. Não precisa cadastrar cartão de crédito.",
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim! Você pode cancelar quando quiser, sem multas ou taxas. Seu acesso continua até o fim do período pago.",
    },
    {
      question: "Os dados estão seguros?",
      answer: "Absolutamente! Usamos criptografia de ponta e backups diários. Seus dados ficam em servidores seguros na nuvem.",
    },
    {
      question: "Preciso instalar algum programa?",
      answer: "Não! O Foguete funciona 100% online. Acesse de qualquer navegador, computador, tablet ou celular.",
    },
    {
      question: "Tem limite de agendamentos?",
      answer: "Não! Todos os planos têm agendamentos ilimitados para você crescer sem preocupações.",
    },
    {
      question: "Como funciona o suporte?",
      answer: "Oferecemos suporte via email, chat e WhatsApp. Planos Semestral e Anual têm suporte prioritário.",
    },
    {
      question: "Quais formas de pagamento são aceitas?",
      answer: "Aceitamos PIX e cartão de crédito (via Mercado Pago). O PIX oferece aprovação instantânea.",
    },
    {
      question: "Posso usar no celular?",
      answer: "Sim! O sistema é responsivo e funciona perfeitamente em celulares, tablets e computadores. Você também pode instalar como app.",
    },
    {
      question: "Como faço para migrar meus dados?",
      answer: "Nossa equipe de suporte pode ajudar na migração. Entre em contato pelo WhatsApp e agendaremos uma sessão de importação.",
    },
    {
      question: "Quantos funcionários posso cadastrar?",
      answer: "No momento, o sistema é para uso individual do proprietário. Funcionalidade multi-usuário está em desenvolvimento.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex-1 pt-32">
        <div className="max-w-3xl mx-auto">
          {/* Header Section - CSS animation instead of framer-motion */}
          <div className="text-center mb-12 animate-fade-in">
            <Badge className="px-4 py-2 mb-6 bg-accent/10 text-accent border-accent/30">
              <Sparkles className="w-4 h-4 mr-2" />
              FAQ
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              Perguntas <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Frequentes</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Encontre respostas para as dúvidas mais comuns sobre o Foguete
            </p>
          </div>

          {/* FAQ Accordion - CSS animation */}
          <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`} 
                  className="bg-card/50 rounded-xl px-6 border border-border shadow-sm"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Section - CSS animation */}
          <div 
            className="text-center mt-16 p-8 bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-2xl border border-orange-500/20 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <h3 className="text-xl font-bold text-foreground mb-2">Ainda tem dúvidas?</h3>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está pronta para ajudar você
            </p>
            <Button 
              className="gap-2 h-12 px-6" 
              onClick={() => window.open("https://wa.me/554899075189", "_blank")}
            >
              <MessageCircle className="w-4 h-4" />
              Falar com Suporte
            </Button>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default FAQ;
