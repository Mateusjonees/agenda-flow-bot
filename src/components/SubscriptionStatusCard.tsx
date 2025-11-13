import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface SubscriptionStatusCardProps {
  subscription: {
    status: string;
    plan_name?: string | null;
    billing_frequency?: string | null;
    payment_method?: string | null;
    next_billing_date?: string | null;
  } | null;
  compact?: boolean;
}

const getBillingFrequencyLabel = (frequency: string | null | undefined) => {
  if (!frequency) return "";
  const labels = {
    monthly: "Mensal",
    semiannual: "Semestral",
    annual: "Anual",
  };
  return labels[frequency as keyof typeof labels] || frequency;
};

const getMonthlyValue = (frequency: string | null | undefined) => {
  if (!frequency) return 97;
  const values = {
    monthly: 97,
    semiannual: 83.14,
    annual: 83.14,
  };
  return values[frequency as keyof typeof values] || 97;
};

const getStatusBadge = (status: string, nextBillingDate?: string | null) => {
  // Se cancelado mas ainda tem acesso (next_billing_date no futuro)
  if (status === 'cancelled' && nextBillingDate) {
    const accessUntil = new Date(nextBillingDate);
    if (accessUntil > new Date()) {
      return (
        <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-700 border-amber-300">
          <Clock className="h-3 w-3" />
          Acesso até {format(accessUntil, "dd/MM/yy", { locale: ptBR })}
        </Badge>
      );
    }
  }

  const config = {
    active: { label: "Ativo", variant: "default" as const, icon: CheckCircle2 },
    trial: { label: "Trial", variant: "secondary" as const, icon: Clock },
    cancelled: { label: "Cancelado", variant: "destructive" as const, icon: XCircle },
    expired: { label: "Expirado", variant: "destructive" as const, icon: XCircle },
  };

  const statusConfig = config[status as keyof typeof config] || config.active;
  const Icon = statusConfig.icon;

  return (
    <Badge variant={statusConfig.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {statusConfig.label}
    </Badge>
  );
};

const getPaymentMethodLabel = (method: string | null | undefined) => {
  if (!method) return "Não definido";
  return method === "pix" ? "PIX" : "Cartão de Crédito";
};

export function SubscriptionStatusCard({ subscription, compact = false }: SubscriptionStatusCardProps) {
  const navigate = useNavigate();

  if (!subscription || subscription.status === "trial") {
    return (
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className={compact ? "pb-3" : ""}>
          <div className="flex items-center justify-between">
            <CardTitle className={compact ? "text-lg" : "text-xl"}>
              🎁 Período de Teste
            </CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Trial
            </Badge>
          </div>
        </CardHeader>
        <CardContent className={compact ? "pt-0" : ""}>
          <p className="text-sm text-muted-foreground mb-4">
            Escolha um plano para ter acesso completo a todos os recursos.
          </p>
          <Button onClick={() => navigate("/planos")} className="w-full">
            Escolher Plano
          </Button>
        </CardContent>
      </Card>
    );
  }

  const planName = subscription.plan_name || getBillingFrequencyLabel(subscription.billing_frequency);
  const monthlyValue = getMonthlyValue(subscription.billing_frequency);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className={compact ? "pb-3" : ""}>
        <div className="flex items-center justify-between">
          <CardTitle className={compact ? "text-lg" : "text-xl"}>
            Meu Plano Atual
          </CardTitle>
          {getStatusBadge(subscription.status, subscription.next_billing_date)}
        </div>
      </CardHeader>
      <CardContent className={`space-y-3 ${compact ? "pt-0" : ""}`}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Plano</p>
            <p className="font-semibold">{planName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor/mês</p>
            <p className="font-semibold">R$ {monthlyValue.toFixed(2)}</p>
          </div>
        </div>

        {subscription.next_billing_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Próxima cobrança:</span>
            <span className="font-medium">
              {format(new Date(subscription.next_billing_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
        )}

        {subscription.payment_method && (
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Método:</span>
            <span className="font-medium">
              {getPaymentMethodLabel(subscription.payment_method)}
            </span>
          </div>
        )}

        {!compact && (
          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate("/planos")} 
                variant="outline"
                className="flex-1"
              >
                Alterar Plano
              </Button>
              <Button 
                onClick={() => navigate("/planos")} 
                variant="default"
                className="flex-1"
              >
                Gerenciar
              </Button>
            </div>
            <Button 
              onClick={() => navigate("/historico-pagamentos")} 
              variant="ghost"
              size="sm"
              className="w-full text-xs"
            >
              Ver Histórico de Pagamentos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
