import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Repeat, Calendar, DollarSign, CheckCircle, XCircle, Clock, FileCheck, Receipt, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface CustomerSubscriptionsProps {
  customerId: string;
}

interface Subscription {
  id: string;
  status: string;
  start_date: string;
  next_billing_date: string | null;
  last_billing_date: string | null;
  created_at: string;
  subscription_plans: {
    name: string;
    price: number;
    billing_frequency: string;
  } | null;
}

export const CustomerSubscriptions = ({ customerId }: CustomerSubscriptionsProps) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, [customerId]);

  const fetchSubscriptions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans (
          name,
          price,
          billing_frequency
        )
      `)
      .eq("user_id", user.id)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSubscriptions(data as any);
    }
    setLoading(false);
  };

  const handleViewDocument = async (subscriptionId: string, documentType: "contract" | "receipt") => {
    setGenerating(`${documentType}-${subscriptionId}`);
    try {
      const { data, error } = await supabase.functions.invoke("generate-subscription-document", {
        body: { subscriptionId, documentType },
      });

      if (error) throw error;

      const blob = new Blob([data], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast({
        title: "Documento gerado!",
        description: `${documentType === "contract" ? "Contrato" : "Comprovante"} aberto em nova aba.`,
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o documento.",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any; className?: string }> = {
      active: { label: "Ativa", variant: "default", icon: CheckCircle, className: "bg-green-500 hover:bg-green-600" },
      trial: { label: "Teste", variant: "secondary", icon: Clock },
      cancelled: { label: "Cancelada", variant: "destructive", icon: XCircle },
      suspended: { label: "Suspensa", variant: "outline", icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: "outline", icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getBillingFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: "Mensal",
      quarterly: "Trimestral",
      semiannual: "Semestral",
      annual: "Anual",
    };
    return labels[frequency] || frequency;
  };

  const getDaysUntilNextBilling = (nextBillingDate: string | null) => {
    if (!nextBillingDate) return null;
    
    const now = new Date();
    const next = new Date(nextBillingDate);
    const diffTime = next.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  if (loading) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Carregando assinaturas...
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Repeat className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhuma assinatura registrada ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((subscription) => {
        const daysUntilBilling = getDaysUntilNextBilling(subscription.next_billing_date);
        const isActive = subscription.status === "active";
        const isTrial = subscription.status === "trial";
        
        return (
          <Card key={subscription.id} className={`hover:shadow-md transition-all ${
            isActive ? "border-green-200 bg-green-50/50" : 
            isTrial ? "border-blue-200 bg-blue-50/50" : ""
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Repeat className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">
                      {subscription.subscription_plans?.name || "Plano"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {subscription.subscription_plans && getBillingFrequencyLabel(subscription.subscription_plans.billing_frequency)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(subscription.status)}
                  {subscription.subscription_plans && (
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(subscription.subscription_plans.price)}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Informações de datas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Data de Início</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(subscription.start_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                
                {subscription.next_billing_date && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Próxima Cobrança</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(subscription.next_billing_date), "dd/MM/yyyy", { locale: ptBR })}
                      {daysUntilBilling !== null && daysUntilBilling >= 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({daysUntilBilling} {daysUntilBilling === 1 ? "dia" : "dias"})
                        </span>
                      )}
                    </p>
                  </div>
                )}
                
                {subscription.last_billing_date && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Última Cobrança</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {format(new Date(subscription.last_billing_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {/* Alerta de renovação próxima */}
              {daysUntilBilling !== null && daysUntilBilling >= 0 && daysUntilBilling <= 7 && isActive && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Renovação em {daysUntilBilling} {daysUntilBilling === 1 ? "dia" : "dias"}
                  </p>
                </div>
              )}

              {/* Botões de documentos */}
              <div className="flex gap-2 flex-wrap pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewDocument(subscription.id, "contract")}
                  disabled={generating === `contract-${subscription.id}`}
                  className="gap-2 flex-1"
                >
                  {generating === `contract-${subscription.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileCheck className="w-4 h-4" />
                  )}
                  Contrato
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewDocument(subscription.id, "receipt")}
                  disabled={generating === `receipt-${subscription.id}`}
                  className="gap-2 flex-1"
                >
                  {generating === `receipt-${subscription.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Receipt className="w-4 h-4" />
                  )}
                  Comprovante
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
