import { Crown, ExternalLink, RefreshCw, Flame, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function SubscriptionPopover() {
  const navigate = useNavigate();
  const { subscription, isLoading, daysRemaining, isActive, isTrial, isCancelled, isExpired } = useSubscriptionStatus();

  const displayDays = Math.max(0, daysRemaining);

  // Configuração baseada no status
  const getConfig = () => {
    if (isExpired) {
      return {
        circleColor: "border-destructive bg-destructive/10",
        textColor: "text-destructive",
        crownColor: "text-destructive",
        statusText: "Expirado",
        statusBg: "bg-destructive/10 text-destructive",
        daysLabel: "Acesso bloqueado",
        buttonText: "Renovar Agora",
        buttonIcon: Flame,
        buttonVariant: "destructive" as const,
      };
    }

    if (isCancelled && daysRemaining > 0) {
      return {
        circleColor: "border-warning bg-warning/10",
        textColor: "text-warning",
        crownColor: "text-warning",
        statusText: "Cancelada",
        statusBg: "bg-warning/10 text-warning",
        daysLabel: "de acesso restantes",
        buttonText: "Reativar",
        buttonIcon: RefreshCw,
        buttonVariant: "default" as const,
      };
    }

    if (isTrial) {
      const isUrgent = displayDays <= 3;
      return {
        circleColor: isUrgent ? "border-warning bg-warning/10" : "border-primary bg-primary/10",
        textColor: isUrgent ? "text-warning" : "text-primary",
        crownColor: isUrgent ? "text-warning" : "text-primary",
        statusText: "Trial Gratuito",
        statusBg: isUrgent ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary",
        daysLabel: "de teste",
        buttonText: "Escolher Plano",
        buttonIcon: Gift,
        buttonVariant: "default" as const,
      };
    }

    // Ativo
    const isUrgent = displayDays <= 7;
    return {
      circleColor: isUrgent ? "border-warning bg-warning/10" : "border-success bg-success/10",
      textColor: isUrgent ? "text-warning" : "text-success",
      crownColor: isUrgent ? "text-warning" : "text-success",
      statusText: "Ativo",
      statusBg: isUrgent ? "bg-warning/10 text-warning" : "bg-success/10 text-success",
      daysLabel: "até renovação",
      buttonText: "Gerenciar Plano",
      buttonIcon: ExternalLink,
      buttonVariant: "outline" as const,
    };
  };

  const config = getConfig();

  const getPlanName = () => {
    if (isTrial) return "Período de Teste";
    if (!subscription?.billing_frequency) {
      if (subscription?.type === "platform") return "Plano Foguetinho";
      return "Plano";
    }
    switch (subscription.billing_frequency) {
      case "monthly": return "Plano Mensal";
      case "semiannual": return "Plano Semestral";
      case "annual": return "Plano Anual";
      default: return "Plano";
    }
  };

  const getDateText = () => {
    if (!subscription?.next_billing_date) return null;
    const dateStr = format(new Date(subscription.next_billing_date), "dd 'de' MMMM", { locale: ptBR });
    
    if (isExpired) return null;
    if (isCancelled) return `Acesso até: ${dateStr}`;
    if (isTrial) return `Trial expira em: ${dateStr}`;
    return `Renova em: ${dateStr}`;
  };

  const ButtonIcon = config.buttonIcon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full transition-colors"
          title="Seu Plano"
        >
          <Crown className={cn("h-5 w-5", config.crownColor)} />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-72 p-0" align="end">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
          <Crown className={cn("h-5 w-5", config.crownColor)} />
          <span className="font-semibold">Seu Plano</span>
        </div>

        {/* Conteúdo principal */}
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Círculo com dias restantes */}
              <div className="flex flex-col items-center py-2">
                <div className={cn(
                  "w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center transition-colors",
                  config.circleColor
                )}>
                  {isExpired ? (
                    <span className={cn("text-2xl font-bold", config.textColor)}>!</span>
                  ) : (
                    <>
                      <span className={cn("text-2xl font-bold", config.textColor)}>
                        {displayDays}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {displayDays === 1 ? "dia" : "dias"}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Label abaixo do círculo */}
                <span className={cn("text-xs mt-2", config.textColor)}>
                  {isExpired ? "Acesso bloqueado" : config.daysLabel}
                </span>
              </div>

              {/* Nome do plano e status */}
              <div className="text-center space-y-2">
                <p className="font-medium">{getPlanName()}</p>
                <span className={cn(
                  "inline-block px-3 py-1 rounded-full text-xs font-semibold",
                  config.statusBg
                )}>
                  {config.statusText}
                </span>
                {getDateText() && (
                  <p className="text-xs text-muted-foreground">
                    {getDateText()}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Botão de ação */}
        <div className="p-4 border-t">
          <Button 
            className="w-full gap-2" 
            variant={config.buttonVariant}
            onClick={() => navigate("/planos")}
          >
            <ButtonIcon className="h-4 w-4" />
            {config.buttonText}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
