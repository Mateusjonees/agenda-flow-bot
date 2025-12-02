import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, QrCode, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { evolutionApi } from "@/lib/evolutionApi";

interface ConnectWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWhatsAppDialog({ open, onOpenChange }: ConnectWhatsAppDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const handleConnect = async () => {
    setLoading(true);
    setConnectionStatus('connecting');
    
    try {
      // Buscar informações da instância (incluindo QR Code se disponível)
      const response = await evolutionApi.getQrCode();
      
      console.log('Response completa:', response);
      
      if (response && response.qrcode) {
        const qrCodeData = response.qrcode.base64 || response.qrcode.code;
        
        if (qrCodeData) {
          setQrCode(qrCodeData.startsWith('data:image') ? qrCodeData : `data:image/png;base64,${qrCodeData}`);
          toast({
            title: "✅ QR Code gerado!",
            description: "Escaneie com seu WhatsApp para conectar.",
          });

        // Verificar status da conexão a cada 3 segundos
        const checkInterval = setInterval(async () => {
          try {
            const status = await evolutionApi.getInstanceStatus();
            
            if (status.state === 'open') {
              setConnectionStatus('connected');
              clearInterval(checkInterval);
              toast({
                title: "🎉 WhatsApp conectado!",
                description: "Sua instância está pronta para enviar mensagens.",
              });
              
              // Fechar modal após 2 segundos
              setTimeout(() => {
                onOpenChange(false);
                setQrCode(null);
                setConnectionStatus('disconnected');
              }, 2000);
            }
          } catch (error) {
            console.error('Erro ao verificar status:', error);
          }
        }, 3000);

        // Limpar intervalo após 2 minutos (timeout do QR Code)
        setTimeout(() => {
          clearInterval(checkInterval);
          if (connectionStatus !== 'connected') {
            setConnectionStatus('disconnected');
            setQrCode(null);
            toast({
              title: "⏱️ QR Code expirou",
              description: "Clique novamente para gerar um novo código.",
              variant: "destructive",
            });
          }
        }, 120000);
        
      } else {
        throw new Error('QR Code não disponível. A instância pode já estar conectada.');
      }
    } catch (error: any) {
      console.error('Erro ao conectar WhatsApp:', error);
      toast({
        title: "❌ Erro ao gerar QR Code",
        description: error.message || "Verifique se a Evolution API está rodando.",
        variant: "destructive",
      });
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code abaixo com seu WhatsApp para conectar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!qrCode && connectionStatus === 'disconnected' && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                Clique no botão abaixo para gerar o QR Code
              </p>
              <Button onClick={handleConnect} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar QR Code
                  </>
                )}
              </Button>
            </div>
          )}

          {qrCode && connectionStatus === 'connecting' && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">📱 Como conectar:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong></li>
                  <li>Toque em <strong>Aparelhos conectados</strong></li>
                  <li>Toque em <strong>Conectar um aparelho</strong></li>
                  <li>Aponte seu celular para esta tela para escanear o código</li>
                </ol>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aguardando escaneamento...
              </div>
            </div>
          )}

          {connectionStatus === 'connected' && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <p className="font-medium text-lg">WhatsApp Conectado!</p>
                <p className="text-sm text-muted-foreground">
                  Sua instância está pronta para enviar mensagens.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
