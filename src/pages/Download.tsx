import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Monitor, Download as DownloadIcon, Check, Apple, Chrome } from "lucide-react";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/useConfetti";

const Download = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop">("desktop");
  const { fireCelebration } = useConfetti();

  useEffect(() => {
    // Detectar tipo de dispositivo
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setDeviceType(isMobile ? "mobile" : "desktop");

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listener para evento de instalação PWA
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listener para quando o app for instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      fireCelebration();
      toast.success("🎉 App Instalado com Sucesso!", {
        description: "O Foguete foi instalado no seu dispositivo!",
        duration: 5000,
      });
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [fireCelebration]);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast.error("Instalação não disponível", {
        description: "Use o menu do navegador para instalar o app.",
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success("Instalando...", {
        description: "O app está sendo instalado!",
      });
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleDownloadAPK = () => {
    toast.info("APK em Desenvolvimento", {
      description: "A versão APK nativa estará disponível em breve. Por enquanto, use a instalação pelo navegador!",
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <div className="flex items-center justify-center mb-6">
            <img src="/logo.png" alt="Foguete" className="w-24 h-24 sm:w-32 sm:h-32" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Baixe o Foguete
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Instale nosso app e tenha acesso rápido ao melhor sistema de gestão empresarial
          </p>
        </div>

        {/* Status Card */}
        {isInstalled && (
          <Card className="border-green-500 bg-green-500/5">
            <CardContent className="flex items-center gap-3 pt-6">
              <Check className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-600">App Instalado!</p>
                <p className="text-sm text-muted-foreground">
                  O Foguete já está instalado no seu dispositivo
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Download Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Mobile Installation */}
          <Card className={`${deviceType === "mobile" ? "border-primary shadow-lg" : ""}`}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Celular</CardTitle>
                  <CardDescription>iPhone & Android</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Instalação Rápida (Recomendado)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Instale direto do navegador, funciona offline
                </p>
                {deviceType === "mobile" && isInstallable && !isInstalled && (
                  <Button 
                    onClick={handleInstallPWA}
                    className="w-full"
                    size="lg"
                  >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Instalar Agora
                  </Button>
                )}
                {deviceType === "mobile" && !isInstallable && !isInstalled && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                      Para instalar:<br />
                      • <strong>iPhone:</strong> Toque em <Apple className="inline w-4 h-4" /> (Compartilhar) → "Adicionar à Tela Inicial"<br />
                      • <strong>Android:</strong> Toque no menu <Chrome className="inline w-4 h-4" /> → "Instalar app"
                    </p>
                  </div>
                )}
                {deviceType === "desktop" && (
                  <p className="text-xs text-amber-600 bg-amber-500/10 p-3 rounded-lg">
                    ⚠️ Acesse pelo celular para instalar a versão mobile
                  </p>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <DownloadIcon className="w-4 h-4" />
                  Download APK (Em breve)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Arquivo APK para instalação direta no Android
                </p>
                <Button 
                  onClick={handleDownloadAPK}
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Baixar APK (Em desenvolvimento)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Installation */}
          <Card className={`${deviceType === "desktop" ? "border-primary shadow-lg" : ""}`}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Monitor className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Computador</CardTitle>
                  <CardDescription>Windows, Mac & Linux</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Instalação pelo Navegador
                </h3>
                <p className="text-sm text-muted-foreground">
                  Funciona como um app desktop nativo
                </p>
                {deviceType === "desktop" && isInstallable && !isInstalled && (
                  <Button 
                    onClick={handleInstallPWA}
                    className="w-full"
                    size="lg"
                  >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Instalar no PC
                  </Button>
                )}
                {deviceType === "desktop" && !isInstallable && !isInstalled && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                      Para instalar:<br />
                      • <strong>Chrome/Edge:</strong> Clique no ícone de instalação na barra de endereço<br />
                      • <strong>Firefox:</strong> Use o menu → "Instalar site como app"<br />
                      • <strong>Safari (Mac):</strong> Arquivo → "Adicionar à Dock"
                    </p>
                  </div>
                )}
                {deviceType === "mobile" && (
                  <p className="text-xs text-amber-600 bg-amber-500/10 p-3 rounded-lg">
                    ⚠️ Acesse pelo computador para instalar a versão desktop
                  </p>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                <h3 className="font-semibold">✨ Recursos no PC</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Funciona offline
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Notificações desktop
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Acesso rápido sem abrir navegador
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Por que instalar?</CardTitle>
            <CardDescription>Vantagens do app instalado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Acesso Rápido</h3>
                <p className="text-sm text-muted-foreground">
                  Abra direto da tela inicial
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Funciona Offline</h3>
                <p className="text-sm text-muted-foreground">
                  Use mesmo sem internet
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Carregamento Rápido</h3>
                <p className="text-sm text-muted-foreground">
                  Performance otimizada
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Notificações</h3>
                <p className="text-sm text-muted-foreground">
                  Receba alertas importantes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Precisa de ajuda com a instalação?
              </p>
              <Button variant="outline" onClick={() => window.location.href = "/"}>
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Download;
