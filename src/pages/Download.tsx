import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Monitor, Download as DownloadIcon, Check, Apple, Chrome, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/useConfetti";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useNavigate } from "react-router-dom";

const Download = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop">("desktop");
  const [showPrompt, setShowPrompt] = useState(false);
  const { fireCelebration } = useConfetti();
  const navigate = useNavigate();

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
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listener para quando o app for instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      fireCelebration();
      toast.success("🎉 App Instalado com Sucesso!", {
        description: "O Foguete foi instalado no seu dispositivo!",
        duration: 5000,
      });
      
      // Redirecionar para dashboard após instalação
      setTimeout(() => {
        navigate("/");
      }, 3000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [fireCelebration, navigate]);

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
    toast.info("APK Nativo", {
      description: "O PWA (instalação direta) já oferece todas as funcionalidades! O APK nativo só é necessário para publicar na Google Play Store.",
      duration: 6000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      {/* Install Prompt Automático */}
      {showPrompt && (
        <InstallPrompt 
          onInstall={handleInstallPWA} 
          isInstallable={isInstallable}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <div className="flex items-center justify-center mb-6">
            <img src="/logo.png" alt="Foguete" className="w-24 h-24 sm:w-32 sm:h-32 animate-scale-in" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-fade-in">
            Baixe o Foguete
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            Instale nosso app e tenha acesso rápido ao melhor sistema de gestão empresarial
          </p>
        </div>

        {/* CTA Destacado Mobile */}
        {deviceType === "mobile" && !isInstalled && (
          <Card className="border-primary bg-primary/5 shadow-lg animate-fade-in">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">Instale Agora - É Rápido!</h2>
                  <p className="text-sm text-muted-foreground">
                    Funciona offline e carrega na velocidade da luz ⚡
                  </p>
                </div>
              </div>
              {isInstallable ? (
                <Button 
                  onClick={handleInstallPWA}
                  className="w-full"
                  size="lg"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Instalar App Agora
                </Button>
              ) : (
                <div className="bg-background p-4 rounded-lg space-y-3">
                  <p className="text-sm font-medium">📱 Como instalar:</p>
                  {/iPhone|iPad|iPod/i.test(navigator.userAgent) ? (
                    <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                      <li>Toque em <Apple className="inline w-4 h-4 mx-1" /> (Compartilhar) na parte inferior</li>
                      <li>Role e toque em "Adicionar à Tela Inicial"</li>
                      <li>Toque em "Adicionar"</li>
                    </ol>
                  ) : (
                    <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                      <li>Toque no menu <Chrome className="inline w-4 h-4 mx-1" /> (⋮) do navegador</li>
                      <li>Selecione "Instalar app"</li>
                      <li>Confirme a instalação</li>
                    </ol>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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

              {deviceType === "desktop" && (
                <div className="pt-4 border-t space-y-2">
                  <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                    <DownloadIcon className="w-4 h-4" />
                    APK Nativo (Opcional)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    O PWA já oferece todas as funcionalidades. O APK só é necessário para Google Play Store.
                  </p>
                  <Button 
                    onClick={handleDownloadAPK}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    Mais informações
                  </Button>
                </div>
              )}
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

        {/* APK Generation Guide - Apenas Desktop */}
        {deviceType === "desktop" && (
          <Card className="border-muted bg-muted/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <DownloadIcon className="w-5 h-5" />
                APK Nativo (Avançado - Apenas para Google Play Store)
              </CardTitle>
              <CardDescription>
                O PWA já funciona perfeitamente como app. Esta seção é apenas para quem deseja publicar na Play Store.
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Exporte o projeto para Github</strong>
                  <p className="text-muted-foreground">Use o botão "Export to Github" e faça git clone</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Instale as dependências</strong>
                  <code className="block mt-1 bg-muted p-2 rounded text-xs">npm install</code>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <strong>Adicione a plataforma Android</strong>
                  <code className="block mt-1 bg-muted p-2 rounded text-xs">npx cap add android</code>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <strong>Faça o build e sincronize</strong>
                  <code className="block mt-1 bg-muted p-2 rounded text-xs">npm run build && npx cap sync android</code>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">5</span>
                <div>
                  <strong>Abra no Android Studio</strong>
                  <code className="block mt-1 bg-muted p-2 rounded text-xs">npx cap open android</code>
                  <p className="text-muted-foreground mt-1">No Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">6</span>
                <div>
                  <strong>Disponibilize o APK</strong>
                  <p className="text-muted-foreground">
                    O APK estará em <code className="bg-muted px-1 rounded text-xs">android/app/build/outputs/apk/debug/app-debug.apk</code>
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Hospede em: GitHub Releases, Google Drive, Dropbox, ou seu próprio servidor
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">7</span>
                <div>
                  <strong>Atualize o link de download</strong>
                  <p className="text-muted-foreground">
                    No arquivo <code className="bg-muted px-1 rounded text-xs">src/pages/Download.tsx</code>, 
                    substitua a URL na função <code className="bg-muted px-1 rounded text-xs">handleDownloadAPK</code> 
                    pela URL do seu APK hospedado
                  </p>
                </div>
              </li>
            </ol>
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-primary mb-2">
                ⚠️ Recomendação: Use o PWA
              </p>
              <p className="text-xs text-muted-foreground">
                O PWA (Progressive Web App) já instalado oferece a mesma experiência de um app nativo, funciona offline, recebe atualizações automáticas e não requer todo esse processo técnico. O APK nativo só é realmente necessário se você planeja publicar o app na Google Play Store.
              </p>
            </div>
          </CardContent>
        </Card>
        )}

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
