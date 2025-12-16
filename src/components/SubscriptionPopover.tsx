import { Crown, ExternalLink, Lock, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const READ_ONLY_KEY = "readOnlyMode";

export function SubscriptionPopover() {
  const navigate = useNavigate();
  const { subscription, isLoading, daysRemaining, isActive, isTrial, isExpired } = useSubscriptionStatus();
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  // Carregar estado do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(READ_ONLY_KEY);
    if (saved === "true") {
      setReadOnlyMode(true);
    }
  }, []);

  // Salvar estado no localStorage e disparar evento para outros componentes
  const handleReadOnlyToggle = (checked: boolean) => {
    setReadOnlyMode(checked);
    localStorage.setItem(READ_ONLY_KEY, checked ? "true" : "false");
    // Disparar evento customizado para o SubscriptionGuard
    window.dispatchEvent(new CustomEvent("readOnlyModeChanged", { detail: checked }));
  };

  // Determinar cores baseado no status
  const getStatusColor = () => {
    if (isExpired || readOnlyMode) return "text-destructive";
    if (daysRemaining <= 3) return "text-destructive";
    if (daysRemaining <= 7) return "text-warning";
    return "text-primary";
  };

  const getCircleColor = () => {
    if (isExpired || readOnlyMode) return "border-destructive bg-destructive/10";
    if (daysRemaining <= 3) return "border-destructive bg-destructive/10";
    if (daysRemaining <= 7) return "border-warning bg-warning/10";
    return "border-primary bg-primary/10";
  };

  const getStatusText = () => {
    if (readOnlyMode) return "Modo Leitura";
    if (isExpired) return "Expirado";
    if (isTrial) return "Trial";
    if (isActive) return "Ativo";
    return "Indefinido";
  };

  const getPlanName = () => {
    if (!subscription?.billing_frequency) return "Plano";
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "h-9 w-9 rounded-full transition-colors",
            readOnlyMode && "bg-destructive/10"
          )}
          title="Seu Plano"
        >
          <Crown className={cn(
            "h-5 w-5",
            readOnlyMode ? "text-destructive" : "text-warning"
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
                    {readOnlyMode ? "🔒" : (daysRemaining > 0 ? daysRemaining : 0)}
                  </span>
                  {!readOnlyMode && (
                    <span className="text-xs text-muted-foreground">
                      {daysRemaining === 1 ? "dia" : "dias"}
                    </span>
                  )}
                </div>
              </div>

              {/* Status e plano */}
              <div className="text-center space-y-1">
                <p className="font-medium">{getPlanName()}</p>
                <p className={cn("text-sm font-medium", getStatusColor())}>
                  {getStatusText()}
                </p>
                {getNextBillingDate() && !readOnlyMode && !isExpired && (
                  <p className="text-xs text-muted-foreground">
                    {isTrial ? "Trial expira em" : "Renova em"}: {getNextBillingDate()}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modo Leitura Toggle */}
        <div className="px-4 py-3 border-t bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {readOnlyMode ? (
                <Lock className="h-4 w-4 text-destructive" />
              ) : (
                <Unlock className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Modo Leitura</p>
                <p className="text-xs text-muted-foreground">Simular expiração</p>
              </div>
            </div>
            <Switch
              checked={readOnlyMode}
              onCheckedChange={handleReadOnlyToggle}
            />
          </div>
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
