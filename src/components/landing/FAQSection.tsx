import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

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
];

const FAQSection = () => {
  const { trackContact } = useFacebookPixel();

  const handleSupportClick = () => {
    trackContact('whatsapp_faq');
    window.open("https://wa.me/554899075189", "_blank");
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-accent/10 text-accent border border-accent/30 rounded-full text-sm font-medium">
              <span>✨</span>
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Perguntas <span className="text-gradient-primary">Frequentes</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Encontre respostas para as dúvidas mais comuns
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`} 
                className="bg-card/50 backdrop-blur-sm rounded-xl px-6 border border-border shadow-sm"
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

          <div className="text-center mt-12 p-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border border-primary/20">
            <h3 className="text-xl font-bold text-foreground mb-2">Ainda tem dúvidas?</h3>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está pronta para ajudar você
            </p>
            <Button 
              className="gap-2 h-12 px-6" 
              onClick={handleSupportClick}
            >
              <span>💬</span>
              Falar com Suporte
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
