import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, Wifi, WifiOff, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WhatsAppConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionChange?: (connected: boolean) => void;
}

type ConnectionStatus = "disconnected" | "connecting" | "qr_ready" | "connected" | "error";

export function WhatsAppConnectionDialog({ 
  open, 
  onOpenChange,
  onConnectionChange 
}: WhatsAppConnectionDialogProps) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check connection status when dialog opens
  useEffect(() => {
    if (open) {
      checkConnectionStatus();
    }
  }, [open]);

  // Poll for connection status when QR is ready
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === "qr_ready" && open) {
      interval = setInterval(() => {
        checkConnectionStatus();
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, open]);

  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: { action: "status" }
      });

      if (error) throw error;

      if (data.connected) {
        setStatus("connected");
        setInstanceName(data.instanceName);
        onConnectionChange?.(true);
      } else if (data.qrcode) {
        setStatus("qr_ready");
        setQrCode(data.qrcode);
      } else {
        setStatus("disconnected");
      }
    } catch (err: any) {
      console.error("Error checking status:", err);
      // Don't show error if just checking status
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setStatus("connecting");

    try {
      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: { action: "connect" }
      });

      if (error) throw error;

      if (data.qrcode) {
        setQrCode(data.qrcode);
        setStatus("qr_ready");
        setInstanceName(data.instanceName);
        toast.info("Escaneie o QR Code com seu WhatsApp");
      } else if (data.connected) {
        setStatus("connected");
        setInstanceName(data.instanceName);
        onConnectionChange?.(true);
        toast.success("WhatsApp conectado com sucesso!");
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message || "Erro ao conectar. Verifique as configurações da Evolution API.");
      setStatus("error");
      toast.error("Erro ao conectar WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke("evolution-api", {
        body: { action: "disconnect" }
      });

      if (error) throw error;

      setStatus("disconnected");
      setQrCode(null);
      setInstanceName(null);
      onConnectionChange?.(false);
      toast.success("WhatsApp desconectado");
    } catch (err: any) {
      console.error("Disconnect error:", err);
      toast.error("Erro ao desconectar");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQR = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: { action: "refresh-qr" }
      });

      if (error) throw error;

      if (data.qrcode) {
        setQrCode(data.qrcode);
        toast.info("QR Code atualizado");
      }
    } catch (err: any) {
      console.error("Refresh QR error:", err);
      toast.error("Erro ao atualizar QR Code");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return <Badge className="bg-success text-success-foreground"><Wifi className="h-3 w-3 mr-1" /> Conectado</Badge>;
      case "connecting":
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Conectando...</Badge>;
      case "qr_ready":
        return <Badge variant="secondary"><QrCode className="h-3 w-3 mr-1" /> Aguardando scan</Badge>;
      case "error":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" /> Erro</Badge>;
      default:
        return <Badge variant="outline"><WifiOff className="h-3 w-3 mr-1" /> Desconectado</Badge>;
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
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {instanceName && status === "connected" && (
              <span className="text-sm text-muted-foreground">({instanceName})</span>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          {/* QR Code Display */}
          {status === "qr_ready" && qrCode && (
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64 object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Abra o WhatsApp no seu celular, vá em<br />
                <strong>Configurações → Aparelhos conectados → Conectar aparelho</strong>
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshQR}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar QR Code
              </Button>
            </div>
          )}

          {/* Connected State */}
          {status === "connected" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
                <Wifi className="h-10 w-10 text-success" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Seu WhatsApp está conectado e pronto para uso!
              </p>
            </div>
          )}

          {/* Disconnected State */}
          {(status === "disconnected" || status === "error") && !loading && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <WifiOff className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Clique no botão abaixo para gerar o QR Code de conexão
              </p>
            </div>
          )}

          {/* Connecting State */}
          {status === "connecting" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          {status === "connected" ? (
            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <WifiOff className="h-4 w-4 mr-2" />}
              Desconectar
            </Button>
          ) : (
            <Button 
              onClick={handleConnect}
              disabled={loading || status === "qr_ready"}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
              Gerar QR Code
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
