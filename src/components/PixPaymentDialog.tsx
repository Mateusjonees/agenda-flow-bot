import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useConfetti } from "@/hooks/useConfetti";
import { useNavigate } from "react-router-dom";

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  amount: number;
  chargeId?: string;
  onPaymentConfirmed?: () => void;
}

export const PixPaymentDialog = ({
  open,
  onOpenChange,
  qrCode,
  qrCodeBase64,
  ticketUrl,
  amount,
  chargeId,
  onPaymentConfirmed
}: PixPaymentDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const { toast } = useToast();
  const { fireSuccess } = useConfetti();
  const navigate = useNavigate();

  // Real-time subscription para monitorar mudanças no status do pagamento
  useEffect(() => {
    if (!chargeId || !open) return;

    console.log("[PixPaymentDialog] Setting up realtime listener for charge:", chargeId);

    const channel = supabase
      .channel(`pix-payment-${chargeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pix_charges',
          filter: `id=eq.${chargeId}`
        },
        (payload) => {
          console.log("[PixPaymentDialog] Received realtime update:", payload);
          if (payload.new && payload.new.status === 'paid') {
            handlePaymentSuccess();
          }
        }
      )
      .subscribe((status) => {
        console.log("[PixPaymentDialog] Subscription status:", status);
      });

    return () => {
      console.log("[PixPaymentDialog] Cleaning up realtime listener");
      supabase.removeChannel(channel);
    };
  }, [chargeId, open]);

  // Reset estado quando dialog abre
  useEffect(() => {
    if (open) {
      setPaymentConfirmed(false);
    }
  }, [open]);

  const handlePaymentSuccess = () => {
    console.log("[PixPaymentDialog] Payment confirmed!");
    setPaymentConfirmed(true);
    fireSuccess();
    
    toast({
      title: "🎉 Pagamento Confirmado!",
      description: "Sua assinatura foi ativada com sucesso!",
    });

    // Callback para componente pai
    onPaymentConfirmed?.();

    // Auto-fechar e redirecionar após 6 segundos para dar tempo do usuário ver
    setTimeout(() => {
      onOpenChange(false);
      navigate("/dashboard");
    }, 6000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole o código no seu aplicativo de pagamento",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const handleVerifyPayment = async () => {
    if (!chargeId) {
      toast({
        title: "Erro",
        description: "ID do pagamento não encontrado",
        variant: "destructive"
      });
      return;
    }

    setVerifying(true);
    try {
      console.log("[PixPaymentDialog] Manually verifying payment for charge:", chargeId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Sessão não encontrada");
      }

      // Chamar edge function para verificar pagamentos pendentes
      const { data, error } = await supabase.functions.invoke("check-pending-pix", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw error;
      }

      console.log("[PixPaymentDialog] Verification result:", data);

      // Verificar se o pagamento específico foi confirmado
      const { data: charge } = await supabase
        .from('pix_charges')
        .select('status')
        .eq('id', chargeId)
        .single();

      if (charge?.status === 'paid') {
        handlePaymentSuccess();
      } else {
        toast({
          title: "Pagamento ainda pendente",
          description: "Aguarde alguns segundos e tente novamente",
        });
      }
    } catch (error: any) {
      console.error("[PixPaymentDialog] Error verifying payment:", error);
      toast({
        title: "Erro ao verificar",
        description: error.message || "Tente novamente em alguns segundos",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Pagamento PIX</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            {paymentConfirmed ? (
              <Badge className="bg-green-500 hover:bg-green-500 text-white gap-2 py-3 px-6 text-lg font-bold shadow-lg shadow-green-500/30">
                <CheckCircle2 className="h-6 w-6" />
                ✓ Concluído!
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-2 py-2 px-4 text-base animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aguardando Pagamento...
              </Badge>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Valor a pagar</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">
              R$ {amount.toFixed(2)}
            </p>
          </div>

          {!paymentConfirmed && (
            <>
              {qrCodeBase64 && (
                <div className="flex justify-center p-2 sm:p-4 bg-white rounded-lg">
                  <img
                    src={`data:image/png;base64,${qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 sm:w-64 sm:h-64 max-w-full"
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-medium">Código PIX Copia e Cola</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 p-2 sm:p-3 bg-muted rounded-md text-xs sm:text-sm break-all font-mono max-h-24 overflow-y-auto">
                    {qrCode}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="flex-shrink-0 w-full sm:w-auto"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-500 sm:mr-0" />
                        <span className="sm:hidden ml-2">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 sm:mr-0" />
                        <span className="sm:hidden ml-2">Copiar Código</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {ticketUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(ticketUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver comprovante completo
                </Button>
              )}

              {/* Botão de verificação manual */}
              {chargeId && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleVerifyPayment}
                  disabled={verifying}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Já paguei - Verificar Status
                    </>
                  )}
                </Button>
              )}

              <div className="bg-blue-50 dark:bg-blue-950 p-2 sm:p-3 rounded-md">
                <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                  <strong>Como pagar:</strong>
                </p>
                <ol className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 mt-1 sm:mt-2 space-y-0.5 sm:space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>

              <p className="text-xs text-center text-muted-foreground px-2">
                O pagamento será confirmado automaticamente em alguns segundos
              </p>
            </>
          )}

          {paymentConfirmed && (
            <div className="text-center py-6 animate-fade-in">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto relative z-10" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-6">
                🎉 Pagamento Confirmado!
              </p>
              <p className="text-lg text-muted-foreground mt-2">
                Sua assinatura foi ativada com sucesso.
              </p>
              <p className="text-sm text-muted-foreground mt-6 animate-pulse">
                Redirecionando para o dashboard...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
