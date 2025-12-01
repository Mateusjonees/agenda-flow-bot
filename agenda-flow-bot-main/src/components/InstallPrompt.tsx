import { useState, useEffect } from "react";
import { X, Download, Apple, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface InstallPromptProps {
  onInstall: () => void;
  isInstallable: boolean;
}

export const InstallPrompt = ({ onInstall, isInstallable }: InstallPromptProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Mostrar prompt apenas em mobile e se não foi fechado anteriormente
    const wasDismissed = localStorage.getItem('installPromptDismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if ((isIOSDevice || isAndroidDevice) && !wasDismissed && !isStandalone) {
      // Delay de 2 segundos para não ser intrusivo
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  const handleInstall = () => {
    onInstall();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md bg-card border-2 border-primary shadow-2xl animate-scale-in">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Foguete" className="w-12 h-12 rounded-lg" />
              <div>
                <h3 className="font-bold text-lg">Instale o Foguete</h3>
                <p className="text-sm text-muted-foreground">
                  Acesso rápido e funciona offline
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Android com botão de instalação direto */}
          {isAndroid && isInstallable && (
            <div className="space-y-3">
              <Button 
                onClick={handleInstall}
                className="w-full"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Instalar App
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Toque no botão acima para instalar
              </p>
            </div>
          )}

          {/* Android sem prompt automático */}
          {isAndroid && !isInstallable && (
            <div className="space-y-3">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-3">
                  <Chrome className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Como instalar:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Toque no menu (⋮) do navegador</li>
                      <li>Selecione "Instalar app" ou "Adicionar à tela inicial"</li>
                      <li>Confirme a instalação</li>
                    </ol>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleDismiss}
                variant="outline"
                className="w-full"
              >
                Entendi
              </Button>
            </div>
          )}

          {/* iOS */}
          {isIOS && (
            <div className="space-y-3">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-3">
                  <Apple className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Como instalar no iPhone:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Toque no ícone de compartilhar <span className="inline-flex items-center justify-center w-4 h-4 bg-primary/20 rounded text-[10px]">⬆</span></li>
                      <li>Role para baixo e toque em "Adicionar à Tela Inicial"</li>
                      <li>Toque em "Adicionar" no canto superior direito</li>
                    </ol>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleDismiss}
                variant="outline"
                className="w-full"
              >
                Entendi
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Download className="w-3 h-3" />
            <span>Funciona offline • Carregamento rápido</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
