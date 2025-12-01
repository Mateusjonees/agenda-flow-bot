import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Package, 
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

const ONBOARDING_STORAGE_KEY = "foguete_onboarding_completed";

interface Step {
  title: string;
  description: string;
  icon: React.ElementType;
  tips: string[];
}

const steps: Step[] = [
  {
    title: "Bem-vindo ao Foguete! 🚀",
    description: "Vamos fazer um tour rápido pelas principais funcionalidades do sistema.",
    icon: CheckCircle2,
    tips: [
      "Este tutorial leva apenas 2 minutos",
      "Você pode pular e acessar novamente nas configurações",
      "Vamos começar!"
    ]
  },
  {
    title: "Agendamentos",
    description: "Gerencie todos os seus compromissos em um só lugar com calendário visual e lembretes automáticos.",
    icon: Calendar,
    tips: [
      "Arraste e solte para reagendar",
      "Confirmação automática via WhatsApp",
      "Visualize por dia, semana ou mês"
    ]
  },
  {
    title: "Clientes",
    description: "Mantenha um cadastro completo dos seus clientes com histórico de atendimentos e fidelidade.",
    icon: Users,
    tips: [
      "Histórico completo de serviços",
      "Cartão fidelidade automático",
      "Documentos e anexos organizados"
    ]
  },
  {
    title: "Financeiro",
    description: "Controle total das suas finanças com relatórios detalhados e fluxo de caixa.",
    icon: DollarSign,
    tips: [
      "Receitas e despesas organizadas",
      "Fechamento diário simplificado",
      "Gráficos e relatórios em tempo real"
    ]
  },
  {
    title: "Estoque",
    description: "Gerencie produtos e materiais com controle de entrada e saída automático.",
    icon: Package,
    tips: [
      "Alertas de estoque baixo",
      "Histórico de movimentações",
      "Integração com vendas"
    ]
  },
  {
    title: "Propostas",
    description: "Crie e envie propostas profissionais com acompanhamento de status.",
    icon: FileText,
    tips: [
      "Templates personalizáveis",
      "Envio automático por WhatsApp",
      "Conversão automática em agendamento"
    ]
  }
];

export const OnboardingTutorial = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasCompletedOnboarding) {
      // Delay para dar tempo da página carregar
      setTimeout(() => setOpen(true), 1000);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{step.title}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Passo {currentStep + 1} de {steps.length}
                </p>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        <div className="space-y-6 py-4">
          <DialogDescription className="text-base leading-relaxed">
            {step.description}
          </DialogDescription>

          <div className="space-y-3">
            {step.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Pular Tutorial
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </Button>
            )}
            <Button onClick={handleNext} className="gap-2">
              {currentStep < steps.length - 1 ? (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Começar
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};