import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Calendar, TrendingUp, Users, Package, DollarSign, FileText, ClipboardList, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Marcar onboarding como completo
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Salvar no localStorage que o onboarding foi completado
        localStorage.setItem("onboarding_completed", "true");
        
        toast.success("Bem-vindo ao Foguete Gestão! 🚀");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Erro ao completar onboarding:", error);
      toast.error("Erro ao iniciar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    navigate("/dashboard");
  };

  const steps = [
    {
      title: "Bem-vindo ao Foguete Gestão! 🚀",
      description: "Sua plataforma completa de gestão empresarial",
      icon: Sparkles,
      content: (
        <div className="space-y-6 text-center">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-2xl shadow-lg border border-primary/20 w-fit mx-auto">
            <img src={logo} alt="Foguete Gestão" className="h-24 w-auto mx-auto" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              7 dias de teste grátis
            </h3>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Experimente todos os recursos da plataforma sem compromisso. 
              Sem cartão de crédito necessário!
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <Calendar className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Seu período de teste começa agora e termina em 7 dias
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Recursos Principais",
      description: "Tudo que você precisa em um só lugar",
      icon: TrendingUp,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-3">
              <div className="bg-primary/10 p-3 rounded-lg w-fit">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Agendamentos</h4>
              <p className="text-sm text-muted-foreground">
                Gerencie compromissos, horários e notifique clientes automaticamente
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-3">
              <div className="bg-primary/10 p-3 rounded-lg w-fit">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">CRM Completo</h4>
              <p className="text-sm text-muted-foreground">
                Cadastro de clientes, histórico e gestão de relacionamento
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-3">
              <div className="bg-primary/10 p-3 rounded-lg w-fit">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Gestão Financeira</h4>
              <p className="text-sm text-muted-foreground">
                Controle receitas, despesas e acompanhe seu fluxo de caixa
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-3">
              <div className="bg-primary/10 p-3 rounded-lg w-fit">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Controle de Estoque</h4>
              <p className="text-sm text-muted-foreground">
                Gerencie produtos, entradas e saídas de estoque
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-3">
              <div className="bg-primary/10 p-3 rounded-lg w-fit">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Propostas</h4>
              <p className="text-sm text-muted-foreground">
                Crie e envie propostas profissionais para seus clientes
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-3">
              <div className="bg-primary/10 p-3 rounded-lg w-fit">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Relatórios</h4>
              <p className="text-sm text-muted-foreground">
                Análises e insights para tomar melhores decisões
              </p>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      title: "Comece Agora!",
      description: "Sua jornada começa aqui",
      icon: Sparkles,
      content: (
        <div className="space-y-6 text-center max-w-2xl mx-auto">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">
              Tudo pronto para você começar!
            </h3>
            <p className="text-lg text-muted-foreground">
              Aproveite os próximos 7 dias para explorar todos os recursos e 
              ver como o Foguete Gestão pode transformar seu negócio.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20 text-left">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Acesso total por 7 dias</p>
                <p className="text-sm text-muted-foreground">
                  Teste todos os recursos sem limitações
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20 text-left">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Sem cartão de crédito</p>
                <p className="text-sm text-muted-foreground">
                  Experimente gratuitamente, sem compromisso
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20 text-left">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Suporte por email</p>
                <p className="text-sm text-muted-foreground">
                  Nossa equipe está pronta para ajudar você
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Após o período de teste, escolha o plano que melhor se adapta ao seu negócio.
            </p>
            <Button
              onClick={handleComplete}
              disabled={loading}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {loading ? "Carregando..." : "Começar Agora"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pular introdução
            </button>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Card */}
        <Card className="border-2 border-primary/20 shadow-2xl">
          <CardContent className="p-6 sm:p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-2xl w-fit mx-auto mb-4">
                <StepIcon className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-muted-foreground text-lg">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              {currentStepData.content}
            </div>

            {/* Navigation */}
            {currentStep < steps.length - 1 && (
              <div className="flex gap-3 justify-between">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  disabled={currentStep === 0}
                  className="flex-1 sm:flex-initial"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
