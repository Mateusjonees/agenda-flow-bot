import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Mail, RefreshCw, Wrench } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MaintenancePageProps {
  message?: string;
  estimatedReturn?: string;
  showNotificationSignup?: boolean;
}

const Maintenance = ({ 
  message = "Estamos realizando manutenção programada no sistema",
  estimatedReturn,
  showNotificationSignup = true 
}: MaintenancePageProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!estimatedReturn) return;

    const updateCountdown = () => {
      const now = new Date();
      const returnDate = new Date(estimatedReturn);
      const secondsLeft = differenceInSeconds(returnDate, now);

      if (secondsLeft <= 0) {
        setTimeRemaining("Em breve");
        return;
      }

      const hours = Math.floor(secondsLeft / 3600);
      const minutes = Math.floor((secondsLeft % 3600) / 60);
      const seconds = secondsLeft % 60;

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [estimatedReturn]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Aqui você pode integrar com um serviço de email
      console.log("Email inscrito para notificação:", email);
      setSubscribed(true);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-32 w-auto"
              />
              <div className="absolute -top-2 -right-2">
                <Badge variant="outline" className="bg-background animate-pulse">
                  <Wrench className="h-3 w-3 mr-1" />
                  Manutenção
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              Sistema em Manutenção
            </CardTitle>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {message}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {estimatedReturn && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Retorno Previsto</p>
                      <p className="text-lg font-semibold">
                        {format(new Date(estimatedReturn), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  {timeRemaining && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Tempo restante</p>
                      <p className="text-2xl font-bold text-primary tabular-nums">
                        {timeRemaining}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="mt-0.5">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium mb-1">O que estamos fazendo?</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Melhorias de performance</li>
                  <li>• Atualizações de segurança</li>
                  <li>• Implementação de novas funcionalidades</li>
                </ul>
              </div>
            </div>

            {showNotificationSignup && !subscribed && (
              <Card className="bg-accent/50">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <p className="font-medium">Quer ser notificado quando voltarmos?</p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex-1"
                      />
                      <Button type="submit">
                        Notificar-me
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {subscribed && (
              <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Mail className="h-5 w-5" />
                    <p className="font-medium">
                      Perfeito! Você será notificado em {email} quando o sistema voltar.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={handleReload}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Pedimos desculpas pelo inconveniente.</p>
            <p className="mt-1">Em caso de urgência, entre em contato pelo suporte.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Maintenance;
