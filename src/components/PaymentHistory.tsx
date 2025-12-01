import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Receipt, Clock, CheckCircle2, XCircle, CreditCard, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentHistoryProps {
  userId?: string;
}

export const PaymentHistory = ({ userId }: PaymentHistoryProps) => {
  const { data: transactions } = useQuery({
    queryKey: ["payment-history", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "income")
        .like("description", "%Assinatura%")
        .order("transaction_date", { ascending: false })
        .limit(10);

      return data || [];
    },
    enabled: !!userId,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Receipt className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Pago</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "failed":
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string | null) => {
    if (!method) return <Receipt className="w-4 h-4 text-muted-foreground" />;
    
    if (method.toLowerCase().includes("pix")) {
      return <Smartphone className="w-4 h-4 text-primary" />;
    }
    return <CreditCard className="w-4 h-4 text-primary" />;
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return "Não especificado";
    
    const normalized = method.toLowerCase();
    if (normalized.includes("pix")) return "PIX";
    if (normalized.includes("credit") || normalized.includes("credito")) return "Cartão de Crédito";
    if (normalized.includes("debit") || normalized.includes("debito")) return "Cartão de Débito";
    
    return method;
  };

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>Acompanhe todos os pagamentos da sua assinatura</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum pagamento registrado ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Histórico de Pagamentos
        </CardTitle>
        <CardDescription>Últimas transações da sua assinatura</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(transaction.status || "pending")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">
                        {transaction.description || "Pagamento de assinatura"}
                      </p>
                      {getStatusBadge(transaction.status || "pending")}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getPaymentMethodIcon(transaction.payment_method)}
                        <span>{formatPaymentMethod(transaction.payment_method)}</span>
                      </div>
                      <span>•</span>
                      <span>
                        {format(
                          new Date(transaction.transaction_date || transaction.created_at),
                          "dd 'de' MMM 'de' yyyy",
                          { locale: ptBR }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-lg">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(transaction.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
