import { Crown, ExternalLink } from "lucide-react";
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
  const { subscription, isLoading, daysRemaining, isActive, isTrial, isExpired } = useSubscriptionStatus();

  // Calcular dias restantes diretamente da subscription
  const calculatedDays = subscription?.next_billing_date
    ? Math.ceil((new Date(subscription.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : daysRemaining;

  const displayDays = calculatedDays > 0 ? calculatedDays : 0;

  // Determinar cores baseado no status
  const getStatusColor = () => {
    if (isExpired) return "text-destructive";
    if (displayDays <= 3) return "text-destructive";
    if (displayDays <= 7) return "text-warning";
    return "text-primary";
  };

  const getCircleColor = () => {
    if (isExpired) return "border-destructive bg-destructive/10";
    if (displayDays <= 3) return "border-destructive bg-destructive/10";
    if (displayDays <= 7) return "border-warning bg-warning/10";
    return "border-primary bg-primary/10";
  };

  const getStatusText = () => {
    if (isExpired) return "Expirado";
    if (isTrial) return "Trial";
    if (subscription?.status === "active") return "Ativo";
    return "Indefinido";
  };

  const getPlanName = () => {
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

  const getNextBillingDate = () => {
    if (!subscription?.next_billing_date) return null;
    return format(new Date(subscription.next_billing_date), "dd 'de' MMMM", { locale: ptBR });
  };

  // Texto para dias restantes
  const getDaysText = () => {
    if (displayDays === 0) return "Último dia!";
    if (displayDays === 1) return "1 dia";
    return `${displayDays} dias`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full transition-colors"
          title="Seu Plano"
        >
          <Crown className={cn(
            "h-5 w-5",
            isExpired ? "text-destructive" : "text-warning"
          )} />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-72 p-0" align="end">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
          <Crown className="h-5 w-5 text-warning" />
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
                  getCircleColor()
                )}>
                  <span className={cn("text-2xl font-bold", getStatusColor())}>
                    {displayDays}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {displayDays === 1 ? "dia" : "dias"}
                  </span>
                </div>
              </div>

              {/* Status e plano */}
              <div className="text-center space-y-1">
                <p className="font-medium">{getPlanName()}</p>
                <p className={cn("text-sm font-medium", getStatusColor())}>
                  {getStatusText()}
                </p>
                {getNextBillingDate() && !isExpired && (
                  <p className="text-xs text-muted-foreground">
                    {isTrial ? "Trial expira em" : "Renova em"}: {getNextBillingDate()}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Botão Gerenciar */}
        <div className="p-4 border-t">
          <Button 
            className="w-full gap-2" 
            onClick={() => navigate("/planos")}
          >
            <ExternalLink className="h-4 w-4" />
            Gerenciar Plano
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
