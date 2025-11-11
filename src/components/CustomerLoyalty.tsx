import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Award, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { useReadOnly } from "@/components/SubscriptionGuard";

interface LoyaltyCard {
  id: string;
  customer_id: string;
  current_stamps: number;
  stamps_required: number;
  total_points: number;
  total_visits: number;
  rewards_redeemed: number;
  last_visit_at: string | null;
  created_at: string;
}

interface CustomerLoyaltyProps {
  customerId: string;
}

export function CustomerLoyalty({ customerId }: CustomerLoyaltyProps) {
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isReadOnly } = useReadOnly();

  useEffect(() => {
    fetchLoyaltyCard();
  }, [customerId]);

  const fetchLoyaltyCard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("loyalty_cards")
      .select("*")
      .eq("customer_id", customerId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao carregar cartão fidelidade:", error);
    }

    setLoyaltyCard(data);
    setLoading(false);
  };

  const createLoyaltyCard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar configurações de fidelidade
    const { data: settings } = await supabase
      .from("business_settings")
      .select("loyalty_stamps_required, loyalty_points_per_visit")
      .eq("user_id", user.id)
      .single();

    const stampsRequired = settings?.loyalty_stamps_required || 10;

    const { data, error } = await supabase
      .from("loyalty_cards")
      .insert({
        customer_id: customerId,
        user_id: user.id,
        current_stamps: 0,
        stamps_required: stampsRequired,
        total_points: 0,
        total_visits: 0,
        rewards_redeemed: 0,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o cartão fidelidade.",
        variant: "destructive",
      });
      return;
    }

    setLoyaltyCard(data);
    toast({
      title: "Cartão criado!",
      description: "Cartão fidelidade criado com sucesso.",
    });
  };

  const addStamp = async () => {
    if (!loyaltyCard) return;

    const newStamps = loyaltyCard.current_stamps + 1;
    const isComplete = newStamps >= loyaltyCard.stamps_required;

    const { error } = await supabase
      .from("loyalty_cards")
      .update({
        current_stamps: isComplete ? 0 : newStamps,
        total_visits: loyaltyCard.total_visits + 1,
        rewards_redeemed: isComplete ? loyaltyCard.rewards_redeemed + 1 : loyaltyCard.rewards_redeemed,
        last_visit_at: new Date().toISOString(),
      })
      .eq("id", loyaltyCard.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar selo.",
        variant: "destructive",
      });
      return;
    }

    if (isComplete) {
      toast({
        title: "🎉 Recompensa completa!",
        description: "O cliente completou o cartão fidelidade!",
      });
    } else {
      toast({
        title: "Selo adicionado!",
        description: `Cliente agora tem ${newStamps} de ${loyaltyCard.stamps_required} selos.`,
      });
    }

    fetchLoyaltyCard();
  };

  const removeStamp = async () => {
    if (!loyaltyCard || loyaltyCard.current_stamps === 0) return;

    const { error } = await supabase
      .from("loyalty_cards")
      .update({
        current_stamps: loyaltyCard.current_stamps - 1,
      })
      .eq("id", loyaltyCard.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover selo.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Selo removido",
      description: "Um selo foi removido do cartão.",
    });

    fetchLoyaltyCard();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!loyaltyCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Cartão Fidelidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este cliente ainda não possui um cartão fidelidade.
          </p>
          <Button onClick={createLoyaltyCard} className="w-full" disabled={isReadOnly}>
            <Gift className="w-4 h-4 mr-2" />
            Criar Cartão Fidelidade
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progress = (loyaltyCard.current_stamps / loyaltyCard.stamps_required) * 100;

  return (
    <div className="space-y-4">
      {/* Cartão Principal */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Cartão Fidelidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progresso dos Selos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold">
                {loyaltyCard.current_stamps} / {loyaltyCard.stamps_required} selos
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Visual dos Selos */}
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: loyaltyCard.stamps_required }).map((_, index) => (
              <div
                key={index}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                  index < loyaltyCard.current_stamps
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border bg-muted/30"
                }`}
              >
                {index < loyaltyCard.current_stamps && (
                  <Award className="w-4 h-4" />
                )}
              </div>
            ))}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <Button
              onClick={addStamp}
              className="flex-1"
              disabled={isReadOnly}
            >
              <Gift className="w-4 h-4 mr-2" />
              Adicionar Selo
            </Button>
            <Button
              onClick={removeStamp}
              variant="outline"
              disabled={isReadOnly || loyaltyCard.current_stamps === 0}
            >
              Remover
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Visitas</p>
                <p className="text-2xl font-bold">{loyaltyCard.total_visits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recompensas</p>
                <p className="text-2xl font-bold">{loyaltyCard.rewards_redeemed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última Visita</p>
                <p className="text-sm font-semibold">
                  {loyaltyCard.last_visit_at
                    ? format(new Date(loyaltyCard.last_visit_at), "dd/MM/yyyy", { locale: ptBR })
                    : "Nunca"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
