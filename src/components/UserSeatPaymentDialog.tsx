import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, CheckCircle2, Loader2, Clock, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserSeatPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentData: {
    id: string;
    qr_code: string;
    qr_code_base64?: string;
    amount: number;
    pending_email: string;
    pending_name: string;
    expires_at: string;
  } | null;
  onPaymentConfirmed: () => void;
}

export function UserSeatPaymentDialog({
  open,
  onOpenChange,
  paymentData,
  onPaymentConfirmed,
}: UserSeatPaymentDialogProps) {
  const [isPaid, setIsPaid] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!open || !paymentData || isPaid) return;

    const checkPaymentStatus = async () => {
      setIsChecking(true);
      try {
        const { data, error } = await supabase
          .from("user_seat_payments")
          .select("status")
          .eq("id", paymentData.id)
          .single();

        if (error) throw error;

        if (data?.status === "paid") {
          setIsPaid(true);
          toast.success("Pagamento confirmado! Usuário criado com sucesso.");
          onPaymentConfirmed();
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      } finally {
        setIsChecking(false);
      }
    };

    // Check immediately
    checkPaymentStatus();

    // Then check every 5 seconds
    const interval = setInterval(checkPaymentStatus, 5000);

    return () => clearInterval(interval);
  }, [open, paymentData, isPaid, onPaymentConfirmed]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsPaid(false);
    }
  }, [open]);

  const copyToClipboard = async () => {
    if (!paymentData?.qr_code) return;
    
    try {
      await navigator.clipboard.writeText(paymentData.qr_code);
      toast.success("Código PIX copiado!");
    } catch (error) {
      toast.error("Erro ao copiar código");
    }
  };

  const formatExpiresAt = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!paymentData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pagamento PIX
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code para adicionar o usuário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg">
            {paymentData.qr_code_base64 ? (
              <img
                src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                alt="QR Code PIX"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-muted rounded">
                <QrCode className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-2 text-center">
            <p className="text-2xl font-bold">
              R$ {paymentData.amount.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-sm text-muted-foreground">
              Usuário: {paymentData.pending_name}
            </p>
            <p className="text-sm text-muted-foreground">
              Email: {paymentData.pending_email}
            </p>
          </div>

          {/* Expiration */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Expira às {formatExpiresAt(paymentData.expires_at)}</span>
          </div>

          {/* Copy Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4" />
            Copiar código PIX
          </Button>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 py-2">
            {isPaid ? (
              <Badge className="gap-2 bg-green-500">
                <CheckCircle2 className="h-4 w-4" />
                Pagamento Confirmado!
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-2">
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                Aguardando pagamento...
              </Badge>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            O usuário será criado automaticamente após a confirmação do pagamento.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
