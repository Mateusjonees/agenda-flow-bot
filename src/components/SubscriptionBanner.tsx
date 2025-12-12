import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gift, Crown, AlertTriangle, XCircle, Clock } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { cn } from "@/lib/utils";

export function SubscriptionBanner() {
  const navigate = useNavigate();
  const { subscription, isLoading, isActive, isTrial, isExpired, daysRemaining } = useSubscriptionStatus();

  if (isLoading || !subscription) return null;

  // Define banner config based on status
  const getBannerConfig = () => {
    if (isTrial) {
      const isUrgent = daysRemaining <= 3;
      return {
        icon: Gift,
        message: daysRemaining <= 0 
          ? "Último dia do trial gratuito!" 
          : `${daysRemaining} ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'} de teste gratuito`,
        buttonText: "Escolher Plano",
        variant: isUrgent ? "warning" : "trial" as const,
        showButton: true,
      };
    }

    if (isExpired) {
      return {
        icon: XCircle,
        message: "Sua assinatura expirou",
        buttonText: "Renovar Agora",
        variant: "expired" as const,
        showButton: true,
      };
    }

    if (subscription.status === "cancelled" && daysRemaining > 0) {
      return {
        icon: AlertTriangle,
        message: `Assinatura cancelada • ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} de acesso restantes`,
        buttonText: "Reativar",
        variant: "warning" as const,
        showButton: true,
      };
    }

    if (subscription.status === "active") {
      const isExpiringSoon = daysRemaining <= 7;
      return {
        icon: isExpiringSoon ? Clock : Crown,
        message: `Plano ativo • ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} até renovação`,
        buttonText: "Gerenciar",
        variant: isExpiringSoon ? "expiring" : "active" as const,
        showButton: false,
      };
    }

    return null;
  };

  const config = getBannerConfig();
  if (!config) return null;

  const variantStyles = {
    trial: "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-primary",
    warning: "bg-gradient-to-r from-warning/15 to-warning/5 border-warning/30 text-warning-foreground",
    expired: "bg-gradient-to-r from-destructive/15 to-destructive/5 border-destructive/30 text-destructive",
    active: "bg-gradient-to-r from-success/10 to-success/5 border-success/20 text-success-foreground",
    expiring: "bg-gradient-to-r from-warning/10 to-warning/5 border-warning/20 text-warning-foreground",
  };

  const IconComponent = config.icon;

  return (
    <div 
      className={cn(
        "w-full px-4 py-2 border-b flex items-center justify-center gap-3 text-sm",
        variantStyles[config.variant]
      )}
    >
      <IconComponent className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium">{config.message}</span>
      {config.showButton && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs ml-2"
          onClick={() => navigate("/planos")}
        >
          {config.buttonText}
        </Button>
      )}
    </div>
  );
}
