import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle2, Sparkles, Calendar } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { differenceInDays } from "date-fns";

interface SubscriptionCountdownProps {
  compact?: boolean;
}

export const SubscriptionCountdown = ({ compact = false }: SubscriptionCountdownProps) => {
  const navigate = useNavigate();
  const { subscription, isLoading, isExpired, isTrial, daysRemaining } = useSubscriptionStatus();

  if (isLoading) return null;
  if (!subscription) return null;

  // Calcular dias restantes
  const nextBillingDate = subscription.next_billing_date 
    ? new Date(subscription.next_billing_date) 
    : null;
  
  const calculatedDaysRemaining = nextBillingDate 
    ? Math.max(0, differenceInDays(nextBillingDate, new Date()))
    : daysRemaining;

  // Determinar status visual
  const isUrgent = calculatedDaysRemaining <= 3;
  const isWarning = calculatedDaysRemaining <= 7 && calculatedDaysRemaining > 3;
  const isActive = subscription.status === 'active' && !isExpired;

  // Se expirado
  if (isExpired || subscription.status === 'expired') {
    return (
      <Card className="border-2 border-destructive bg-destructive/5 overflow-hidden">
        <CardContent className={compact ? "p-4" : "p-6"}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-destructive animate-pulse" />
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-destructive">
                Assinatura Expirada
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Seu acesso está em modo somente leitura. Renove para continuar usando todos os recursos.
              </p>
            </div>
            <Button 
              onClick={() => navigate("/planos")}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Renovar Agora
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se em trial
  if (isTrial || subscription.status === 'trial') {
    return (
      <Card className={`border-2 overflow-hidden ${
        isUrgent 
          ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20" 
          : "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
      }`}>
        <CardContent className={compact ? "p-4" : "p-6"}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Círculo com contador */}
            <div className="relative">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                isUrgent 
                  ? "bg-amber-500/20" 
                  : "bg-blue-500/20"
              }`}>
                <div className="text-center">
                  <span className={`text-3xl font-bold ${
                    isUrgent ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                  }`}>
                    {calculatedDaysRemaining}
                  </span>
                  <p className={`text-xs ${
                    isUrgent ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                  }`}>
                    {calculatedDaysRemaining === 1 ? "dia" : "dias"}
                  </p>
                </div>
              </div>
              {isUrgent && (
                <div className="absolute -top-1 -right-1">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                  </span>
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Badge variant="outline" className={isUrgent ? "border-amber-500 text-amber-600" : "border-blue-500 text-blue-600"}>
                  <Clock className="w-3 h-3 mr-1" />
                  Período de Teste
                </Badge>
              </div>
              <h3 className={`text-lg font-bold ${
                isUrgent ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300"
              }`}>
                {isUrgent 
                  ? calculatedDaysRemaining === 0 
                    ? "Último dia do trial!" 
                    : `Apenas ${calculatedDaysRemaining} ${calculatedDaysRemaining === 1 ? "dia" : "dias"} restantes!`
                  : `${calculatedDaysRemaining} dias restantes de teste`
                }
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isUrgent 
                  ? "Assine agora para não perder acesso aos seus dados."
                  : "Aproveite todos os recursos gratuitamente."
                }
              </p>
            </div>

            {/* Botão */}
            {isUrgent && (
              <Button 
                onClick={() => navigate("/planos")}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Assinar Agora
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se ativo (não trial)
  if (isActive) {
    return (
      <Card className={`border overflow-hidden ${
        isUrgent 
          ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
          : isWarning
            ? "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
            : "border-green-500 bg-green-50/50 dark:bg-green-950/20"
      }`}>
        <CardContent className={compact ? "p-4" : "p-6"}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Círculo com contador */}
            <div className="relative">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                isUrgent 
                  ? "bg-amber-500/20" 
                  : isWarning 
                    ? "bg-yellow-500/20" 
                    : "bg-green-500/20"
              }`}>
                <div className="text-center">
                  <span className={`text-2xl font-bold ${
                    isUrgent 
                      ? "text-amber-600 dark:text-amber-400" 
                      : isWarning 
                        ? "text-yellow-600 dark:text-yellow-400" 
                        : "text-green-600 dark:text-green-400"
                  }`}>
                    {calculatedDaysRemaining}
                  </span>
                  <p className={`text-xs ${
                    isUrgent 
                      ? "text-amber-600 dark:text-amber-400" 
                      : isWarning 
                        ? "text-yellow-600 dark:text-yellow-400" 
                        : "text-green-600 dark:text-green-400"
                  }`}>
                    {calculatedDaysRemaining === 1 ? "dia" : "dias"}
                  </p>
                </div>
              </div>
            </div>

            {/* Informações */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Badge variant="outline" className={
                  isUrgent 
                    ? "border-amber-500 text-amber-600" 
                    : isWarning 
                      ? "border-yellow-500 text-yellow-600" 
                      : "border-green-500 text-green-600"
                }>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Assinatura Ativa
                </Badge>
                {subscription.billing_frequency && (
                  <Badge variant="secondary" className="text-xs">
                    {subscription.billing_frequency === 'monthly' ? 'Mensal' 
                      : subscription.billing_frequency === 'semiannual' ? 'Semestral' 
                      : 'Anual'}
                  </Badge>
                )}
              </div>
              <h3 className={`text-lg font-semibold ${
                isUrgent 
                  ? "text-amber-700 dark:text-amber-300" 
                  : isWarning 
                    ? "text-yellow-700 dark:text-yellow-300" 
                    : "text-green-700 dark:text-green-300"
              }`}>
                {calculatedDaysRemaining} dias até a renovação
              </h3>
              {nextBillingDate && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <Calendar className="w-3 h-3" />
                  Próxima cobrança: {nextBillingDate.toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            {/* Botão para gerenciar */}
            {!compact && (
              <Button 
                variant="outline"
                onClick={() => navigate("/planos")}
              >
                Gerenciar Plano
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
