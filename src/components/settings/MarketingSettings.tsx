import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Star, Gift, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MarketingSettingsProps {
  user: any;
  settings: any;
  googleReviewLink: string;
  setGoogleReviewLink: (value: string) => void;
  instagramLink: string;
  setInstagramLink: (value: string) => void;
  loyaltyEnabled: boolean;
  setLoyaltyEnabled: (value: boolean) => void;
  loyaltyStampsRequired: number;
  setLoyaltyStampsRequired: (value: number) => void;
  loyaltyPointsPerVisit: number;
  setLoyaltyPointsPerVisit: (value: number) => void;
  couponEnabled: boolean;
  setCouponEnabled: (value: boolean) => void;
}

export const MarketingSettings = ({
  user,
  settings,
  googleReviewLink,
  setGoogleReviewLink,
  instagramLink,
  setInstagramLink,
  loyaltyEnabled,
  setLoyaltyEnabled,
  loyaltyStampsRequired,
  setLoyaltyStampsRequired,
  loyaltyPointsPerVisit,
  setLoyaltyPointsPerVisit,
  couponEnabled,
  setCouponEnabled,
}: MarketingSettingsProps) => {
  const queryClient = useQueryClient();

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error: settingsError } = await supabase.from("business_settings").upsert({
        user_id: user.id,
        google_review_link: googleReviewLink,
        instagram_link: instagramLink,
        loyalty_enabled: loyaltyEnabled,
        coupon_enabled: couponEnabled,
        loyalty_stamps_required: loyaltyStampsRequired,
        loyalty_points_per_visit: loyaltyPointsPerVisit,
        profile_image_url: settings?.profile_image_url,
        business_name: settings?.business_name
      }, { onConflict: "user_id" });
      if (settingsError) throw settingsError;

      const { error: loyaltyError } = await supabase
        .from("loyalty_cards")
        .update({ stamps_required: loyaltyStampsRequired })
        .eq("user_id", user.id);
      if (loyaltyError) throw loyaltyError;
    },
    onSuccess: () => {
      toast.success("Configurações de marketing salvas!");
      queryClient.invalidateQueries({ queryKey: ["loyalty-settings"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-cards"] });
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    },
    onError: (error) => {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    }
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Star className="w-5 h-5 text-yellow-400" />
            Pós-venda e Avaliações
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Configure os links para avaliações e feedback automático</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-review" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Link de Avaliação Google
            </Label>
            <Input
              id="google-review"
              type="url"
              placeholder="https://g.page/r/..."
              value={googleReviewLink}
              onChange={(e) => setGoogleReviewLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Link para avaliação no Google Meu Negócio
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instagram-review" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Link do Instagram
            </Label>
            <Input
              id="instagram-review"
              type="url"
              placeholder="https://instagram.com/seunegocio"
              value={instagramLink}
              onChange={(e) => setInstagramLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Perfil do Instagram do seu negócio
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Automação de Pós-venda:</strong>
                <p className="mt-1">
                  24 horas após cada serviço concluído, seus clientes receberão automaticamente:
                </p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Pedido de feedback com estrelas</li>
                  <li>Links para avaliação no Google e Instagram</li>
                  <li>Cupom de retorno (10% de desconto)</li>
                  <li>Status da carteirinha fidelidade</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Gift className="w-5 h-5 text-primary" />
            Programa de Fidelidade
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Configure a carteirinha fidelidade do seu negócio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="loyalty-enabled" className="text-base font-medium">Ativar Programa de Fidelidade</Label>
              <p className="text-sm text-muted-foreground">
                Recompense seus clientes por cada atendimento finalizado
              </p>
            </div>
            <Switch id="loyalty-enabled" checked={loyaltyEnabled} onCheckedChange={setLoyaltyEnabled} />
          </div>

          {loyaltyEnabled && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="loyalty-stamps">Carimbos necessários</Label>
                  <Input
                    id="loyalty-stamps"
                    type="number"
                    value={loyaltyStampsRequired}
                    onChange={(e) => setLoyaltyStampsRequired(Number(e.target.value))}
                    min="2"
                    max="20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Quantos atendimentos para ganhar uma recompensa
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="loyalty-points">Pontos por atendimento</Label>
                  <Input
                    id="loyalty-points"
                    type="number"
                    value={loyaltyPointsPerVisit}
                    onChange={(e) => setLoyaltyPointsPerVisit(Number(e.target.value))}
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pontos ganhos a cada atendimento finalizado
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <Gift className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm space-y-2">
                    <strong className="text-foreground text-base">Como funciona:</strong>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>A cada atendimento finalizado, o cliente ganha automaticamente {loyaltyPointsPerVisit} {loyaltyPointsPerVisit === 1 ? 'carimbo' : 'carimbos'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Quando atingir {loyaltyStampsRequired} carimbos, o cartão é zerado e o cliente ganha uma visita grátis! 🎉</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>O sistema notifica você quando um cartão for completado</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>
          <Save className="w-4 h-4" />
          {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Marketing"}
        </Button>
      </div>
    </div>
  );
};
