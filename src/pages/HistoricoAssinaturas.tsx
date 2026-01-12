import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, addDays, addMonths, parseISO } from "date-fns";
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
  ArrowRight,
  Sparkles,
  History,
  CalendarDays,
  Wallet,
  RefreshCw,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";

interface SubscriptionEvent {
  id: string;
  date: string;
  type: "payment" | "renewal" | "activation" | "cancellation" | "upgrade" | "downgrade";
  planName: string;
  billingFrequency: string;
  amount: number;
  status: string;
  daysAdded: number;
  previousEndDate?: string;
  newEndDate?: string;
  paymentMethod?: string;
  ticketUrl?: string;
}

const HistoricoAssinaturas = () => {
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);

  // Buscar usuário atual
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Buscar assinatura atual
  const { data: currentSubscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ["current-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .is("customer_id", null) // Assinatura da plataforma
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Buscar todas as cobranças PIX pagas
  const { data: pixCharges = [], isLoading: loadingPix } = useQuery({
    queryKey: ["all-pix-charges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pix_charges")
        .select("*")
        .eq("user_id", user.id)
        .is("appointment_id", null) // Apenas pagamentos de plataforma
        .order("created_at", { ascending: true }); // Ordem cronológica

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Processar eventos de assinatura
  const subscriptionEvents: SubscriptionEvent[] = pixCharges
    .filter((charge: any) => charge.status === "paid")
    .map((charge: any, index: number) => {
      const metadata = charge.metadata || {};
      const planName = metadata.planName || "Plano";
      const billingFrequency = metadata.billingFrequency || "monthly";
      
      // Calcular dias adicionados baseado no plano
      let daysAdded = 31;
      if (billingFrequency === "semiannual" || metadata.months === 6) {
        daysAdded = 180;
      } else if (billingFrequency === "annual" || metadata.months === 12) {
        daysAdded = 365;
      } else if (metadata.months) {
        daysAdded = metadata.months * 30;
      }

      // Estimar datas de período
      const paymentDate = charge.paid_at || charge.created_at;
      const previousEndDate = index === 0 ? paymentDate : undefined;
      const newEndDate = format(
        addDays(parseISO(paymentDate), daysAdded),
        "yyyy-MM-dd'T'HH:mm:ss"
      );

      return {
        id: charge.id,
        date: paymentDate,
        type: index === 0 ? "activation" : "renewal",
        planName,
        billingFrequency: billingFrequency === "monthly" ? "Mensal" :
                          billingFrequency === "semiannual" ? "Semestral" : "Anual",
        amount: charge.amount,
        status: charge.status,
        daysAdded,
        previousEndDate,
        newEndDate,
        paymentMethod: "PIX",
        ticketUrl: metadata.ticket_url,
      } as SubscriptionEvent;
    });

  // Calcular estatísticas
  const totalPaid = subscriptionEvents.reduce((sum, event) => sum + event.amount, 0);
  const totalDaysAdded = subscriptionEvents.reduce((sum, event) => sum + event.daysAdded, 0);
  const renewalsCount = subscriptionEvents.filter(e => e.type === "renewal").length;

  // Dias restantes
  const daysRemaining = currentSubscription?.next_billing_date
    ? Math.max(0, differenceInDays(parseISO(currentSubscription.next_billing_date), new Date()))
    : 0;

  const handleDownloadReceipt = async (chargeId: string) => {
    setDownloadingReceipt(chargeId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-payment-receipt', {
        body: { 
          paymentId: chargeId,
          paymentType: 'pix'
        }
      });

      if (error) throw error;

      if (!data.html) {
        throw new Error("Erro ao gerar recibo");
      }

      // Criar iframe para impressão
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Erro ao criar documento");

      iframeDoc.open();
      iframeDoc.write(data.html);
      iframeDoc.close();

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
          toast.success("Recibo gerado! Use Ctrl+P para salvar como PDF");
        }, 500);
      };
    } catch (error: any) {
      console.error("Error downloading receipt:", error);
      toast.error(error.message || "Erro ao gerar recibo");
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "activation":
        return <Sparkles className="h-4 w-4 text-green-500" />;
      case "renewal":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "upgrade":
        return <ArrowUpRight className="h-4 w-4 text-purple-500" />;
      case "cancellation":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "activation":
        return "Ativação";
      case "renewal":
        return "Renovação";
      case "upgrade":
        return "Upgrade";
      case "downgrade":
        return "Downgrade";
      case "cancellation":
        return "Cancelamento";
      default:
        return "Pagamento";
    }
  };

  const isLoading = loadingSubscription || loadingPix;

  return (
    <div className="space-y-6">
      <PageBreadcrumb />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Assinaturas</h1>
        <p className="text-muted-foreground">
          Acompanhe todas as suas renovações, valores pagos e dias acumulados
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dias Restantes</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{daysRemaining}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentSubscription?.next_billing_date 
                    ? `Até ${format(parseISO(currentSubscription.next_billing_date), "dd/MM/yyyy", { locale: ptBR })}`
                    : "Sem assinatura ativa"
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalPaid)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Desde o início
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dias Acumulados</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDaysAdded}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de dias adquiridos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Renovações</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{renewalsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {renewalsCount === 0 ? "Primeira assinatura" : `${renewalsCount} renovação(ões)`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Atual */}
          {currentSubscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Status Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={currentSubscription.status === "active" ? "default" : "secondary"}>
                      {currentSubscription.status === "active" ? "Ativa" : 
                       currentSubscription.status === "trial" ? "Trial" :
                       currentSubscription.status === "cancelled" ? "Cancelada" : "Expirada"}
                    </Badge>
                    <span className="text-sm font-medium">
                      Plano {currentSubscription.plan_name || "Mensal"}
                    </span>
                  </div>
                  
                  {currentSubscription.next_billing_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Próxima renovação: {format(parseISO(currentSubscription.next_billing_date), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  )}

                  {currentSubscription.payment_method && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      {currentSubscription.payment_method === "pix" ? "PIX" : "Cartão de Crédito"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline de Eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Linha do Tempo
              </CardTitle>
              <CardDescription>
                Histórico completo de pagamentos e renovações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionEvents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum pagamento registrado ainda</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/planos"}>
                    Ver Planos
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Timeline Visual */}
                  <div className="relative">
                    {subscriptionEvents.slice().reverse().map((event, index) => (
                      <div key={event.id} className="relative pl-8 pb-8 last:pb-0">
                        {/* Linha vertical */}
                        {index < subscriptionEvents.length - 1 && (
                          <div className="absolute left-3 top-8 bottom-0 w-px bg-border" />
                        )}
                        
                        {/* Círculo do evento */}
                        <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary">
                          {getEventIcon(event.type)}
                        </div>

                        {/* Conteúdo do evento */}
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {getEventLabel(event.type)}
                                </Badge>
                                <span className="font-semibold">{event.planName}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {event.billingFrequency}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                {format(parseISO(event.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                              </div>

                              <div className="flex items-center gap-4 text-sm mt-2">
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <ArrowRight className="h-3 w-3" />
                                  <span>+{event.daysAdded} dias</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  <span>{event.paymentMethod}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className="text-xl font-bold text-primary">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(event.amount)}
                              </span>
                              
                              <div className="flex gap-2">
                                {event.ticketUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(event.ticketUrl!, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Comprovante
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadReceipt(event.id)}
                                  disabled={downloadingReceipt === event.id}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  {downloadingReceipt === event.id ? "..." : "Recibo"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabela Detalhada */}
          {subscriptionEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Detalhamento de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptionEvents.slice().reverse().map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          {format(parseISO(event.date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.type)}
                            {getEventLabel(event.type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{event.billingFrequency}</Badge>
                        </TableCell>
                        <TableCell className="text-green-600 dark:text-green-400 font-medium">
                          +{event.daysAdded}
                        </TableCell>
                        <TableCell>{event.paymentMethod}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(event.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Linha de Total */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">
                        +{totalDaysAdded} dias
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(totalPaid)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default HistoricoAssinaturas;
