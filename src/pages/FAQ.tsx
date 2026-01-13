import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-lg font-semibold">Perguntas Frequentes</h1>
          <div className="w-24" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <Badge className="px-4 py-2 mb-6 bg-accent/10 text-accent border-accent/30">
              <Sparkles className="w-4 h-4 mr-2" />
              FAQ
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              Perguntas <span className="text-gradient-primary">Frequentes</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Encontre respostas para as dúvidas mais comuns sobre o Foguete
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`} 
                className="glass rounded-xl px-6 border-0 shadow-sm"
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

          {/* Contact Section */}
          <div className="text-center mt-16 p-8 glass rounded-2xl">
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
    </div>
  );
};

export default FAQ;
