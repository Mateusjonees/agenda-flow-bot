import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  amount: number;
}

export const PixPaymentDialog = ({
  open,
  onOpenChange,
  qrCode,
  qrCodeBase64,
  ticketUrl,
  amount
}: PixPaymentDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Pagamento PIX</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Valor a pagar</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">
              R$ {amount.toFixed(2)}
            </p>
          </div>

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
        </div>
      </DialogContent>
    </Dialog>
  );
};
