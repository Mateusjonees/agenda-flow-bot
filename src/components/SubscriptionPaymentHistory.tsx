import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  CreditCard, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  Receipt,
  TrendingUp,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface PixCharge {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  description: string;
  paid_at: string | null;
  expires_at: string;
  metadata: any;
}

interface FinancialTransaction {
  id: string;
  created_at: string;
  transaction_date: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  payment_method: string;
}

export function SubscriptionPaymentHistory() {
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  // Buscar cobranças PIX da plataforma
  const { data: pixCharges = [], isLoading: loadingPix } = useQuery({
    queryKey: ["platform-pix-charges"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("pix_charges")
        .select("*")
        .eq("user_id", user.id)
        .is("appointment_id", null) // Apenas pagamentos de plataforma
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PixCharge[];
    },
  });

  // Buscar transações financeiras relacionadas à assinatura
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["subscription-transactions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "income")
        .ilike("description", "%assinatura%")
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      return data as FinancialTransaction[];
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      paid: { label: "Pago", variant: "default", icon: CheckCircle2 },
      pending: { label: "Pendente", variant: "secondary", icon: Clock },
      expired: { label: "Expirado", variant: "destructive", icon: XCircle },
      cancelled: { label: "Cancelado", variant: "outline", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleDownloadInvoice = async (chargeId: string) => {
    setDownloadingInvoice(chargeId);
    try {
      const payment = allPayments.find(p => p.id === chargeId);
      if (!payment) {
        toast.error("Pagamento não encontrado");
        return;
      }

      // Chamar edge function para gerar o recibo
      const { data, error } = await supabase.functions.invoke('generate-payment-receipt', {
        body: { 
          paymentId: chargeId,
          paymentType: payment.type
        }
      });

      if (error) throw error;

      if (!data.html) {
        throw new Error("Erro ao gerar recibo");
      }

      // Criar um iframe oculto para renderizar e imprimir o HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Erro ao criar documento");
      }

      iframeDoc.open();
      iframeDoc.write(data.html);
      iframeDoc.close();

      // Aguardar o carregamento e imprimir
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          
          // Remover iframe após alguns segundos
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
          
          toast.success("Recibo gerado! Use Ctrl+P ou Cmd+P para salvar como PDF");
        }, 500);
      };

    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      toast.error(error.message || "Erro ao gerar recibo");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  // Combinar e ordenar todos os pagamentos
  const allPayments = [
    ...pixCharges.map(charge => ({
      id: charge.id,
      date: charge.paid_at || charge.created_at,
      amount: charge.amount,
      status: charge.status,
      method: "PIX",
      description: charge.description || "Assinatura Plataforma",
      type: "pix" as const,
      ticketUrl: charge.metadata?.ticket_url || null,
      mpPaymentId: charge.metadata?.mp_payment_id || null,
    })),
    ...transactions.map(transaction => ({
      id: transaction.id,
      date: transaction.transaction_date,
      amount: transaction.amount,
      status: transaction.status,
      method: transaction.payment_method || "N/A",
      description: transaction.description,
      type: "transaction" as const,
      ticketUrl: null,
      mpPaymentId: null,
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPaid = allPayments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const isLoading = loadingPix || loadingTransactions;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando histórico...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Acumulado desde o início
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Realizados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allPayments.filter(p => p.status === "paid").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allPayments.filter(p => p.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>
            Todos os pagamentos relacionados à sua assinatura da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPayments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pagamento registrado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allPayments.map((payment, index) => (
                <div key={payment.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="font-semibold">{payment.description}</h4>
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(payment.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          {payment.method}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(payment.amount))}
                        </p>
                      </div>

                      {payment.status === "paid" && (
                        <div className="flex gap-2">
                          {payment.ticketUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(payment.ticketUrl!, '_blank')}
                              title="Abrir comprovante do Mercado Pago"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Nota MP
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(payment.id)}
                            disabled={downloadingInvoice === payment.id}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {downloadingInvoice === payment.id ? "Gerando..." : "Recibo"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
