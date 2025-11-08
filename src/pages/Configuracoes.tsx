import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, Star, Gift, Link as LinkIcon, Upload, Camera, Lock, CreditCard, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Configuracoes = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [stampsRequired, setStampsRequired] = useState(5);
  
  // Estados para informações do negócio
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  
  // Estados para alteração de senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Buscar dados do usuário e configurações
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["business-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("business_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Buscar configurações do cartão fidelidade
  const { data: loyaltySettings } = useQuery({
    queryKey: ["loyalty-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("loyalty_cards")
        .select("stamps_required")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Buscar assinatura do usuário
  const { data: subscription } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Atualizar estado quando os dados forem carregados
  useEffect(() => {
    if (loyaltySettings?.stamps_required) {
      setStampsRequired(loyaltySettings.stamps_required);
    }
  }, [loyaltySettings]);

  // Atualizar estados com dados das configurações
  useEffect(() => {
    if (settings) {
      setBusinessName(settings.business_name || "");
      setPhone(settings.whatsapp_number || "");
      setEmail(settings.email || "");
      setAddress(settings.address || "");
      setCpfCnpj(settings.cpf_cnpj || "");
    }
  }, [settings]);

  // Mutation para fazer upload da imagem
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Atualizar ou criar configurações
      const { error: updateError } = await supabase
        .from("business_settings")
        .upsert({
          user_id: user.id,
          profile_image_url: publicUrl,
          business_name: settings?.business_name || "Meu Negócio",
        }, {
          onConflict: "user_id"
        });

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      toast.success("Foto de perfil atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
      queryClient.invalidateQueries({ queryKey: ["profile-image"] });
    },
    onError: (error) => {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao atualizar foto de perfil");
    },
  });

  // Mutation para salvar configurações do cartão fidelidade
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Atualizar business_settings
      const { error: settingsError } = await supabase
        .from("business_settings")
        .upsert({
          user_id: user.id,
          business_name: businessName,
          whatsapp_number: phone,
          email: email,
          address: address,
          cpf_cnpj: cpfCnpj,
          profile_image_url: settings?.profile_image_url,
        }, {
          onConflict: "user_id"
        });

      if (settingsError) throw settingsError;

      // Atualizar todas as loyalty cards do usuário
      const { error: loyaltyError } = await supabase
        .from("loyalty_cards")
        .update({ stamps_required: stampsRequired })
        .eq("user_id", user.id);

      if (loyaltyError) throw loyaltyError;
    },
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["loyalty-settings"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-cards"] });
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    },
    onError: (error) => {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);
    try {
      await uploadImageMutation.mutateAsync(file);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate();
  };

  // Mutation para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!currentPassword) {
        throw new Error("Digite sua senha atual para confirmar");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("As senhas não coincidem");
      }
      
      if (newPassword.length < 6) {
        throw new Error("A senha deve ter no mínimo 6 caracteres");
      }

      // Validar senha atual
      if (!user?.email) throw new Error("Email não encontrado");
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Senha atual incorreta");
      }

      // Alterar senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao alterar senha");
    },
  });

  // Mutation para cancelar assinatura
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!user || !subscription) throw new Error("Assinatura não encontrada");

      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          next_billing_date: null,
        })
        .eq("id", subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assinatura cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cancelar assinatura");
    },
  });



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground">Configure as informações do seu negócio</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>
            Adicione uma foto sua ou da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={settings?.profile_image_url || undefined} alt="Perfil" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-2xl">
                <Camera className="h-10 w-10 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Enviando..." : "Enviar Foto"}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou WEBP. Máximo 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Negócio</CardTitle>
          <CardDescription>Configure os dados principais do seu estabelecimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business-name">Nome do Negócio</Label>
              <Input 
                id="business-name" 
                placeholder="Meu Salão" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-type">Tipo de Negócio</Label>
              <Input 
                id="business-type" 
                placeholder="Salão de Beleza"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone" 
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="contato@meusalao.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpf-cnpj">CPF/CNPJ</Label>
              <Input 
                id="cpf-cnpj" 
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input 
                id="address" 
                placeholder="Rua Example, 123 - Bairro, Cidade - UF"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de Funcionamento</CardTitle>
          <CardDescription>Defina os horários de atendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day) => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-24">
                  <p className="text-sm font-medium">{day}</p>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Input type="time" defaultValue="09:00" className="w-32" />
                  <span className="text-muted-foreground">até</span>
                  <Input type="time" defaultValue="18:00" className="w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Agendamento</CardTitle>
          <CardDescription>Personalize como os agendamentos funcionam</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slot-duration">Duração padrão (minutos)</Label>
              <Input id="slot-duration" type="number" defaultValue="60" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer-time">Tempo entre agendamentos (minutos)</Label>
              <Input id="buffer-time" type="number" defaultValue="0" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Pós-venda e Avaliações
          </CardTitle>
          <CardDescription>Configure os links para avaliações e feedback automático</CardDescription>
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
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Programa de Fidelidade
          </CardTitle>
          <CardDescription>Configure a carteirinha fidelidade do seu negócio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stamps-required">Número de carimbos necessários</Label>
            <Input 
              id="stamps-required" 
              type="number" 
              value={stampsRequired}
              onChange={(e) => setStampsRequired(Number(e.target.value))}
              min="2"
              max="20"
            />
            <p className="text-xs text-muted-foreground">
              Quantos serviços o cliente precisa realizar para ganhar uma recompensa (padrão: 5)
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Gift className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <strong className="text-foreground">Como funciona:</strong>
                <p className="mt-1 text-muted-foreground">
                  A cada serviço concluído, o cliente ganha automaticamente um carimbo no cartão fidelidade.
                  Quando atingir o número necessário, o cartão é zerado e o cliente tem direito a uma visita grátis! 🎉
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Minha Assinatura
            </CardTitle>
            <CardDescription>Gerencie sua assinatura e plano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-lg">
                    {subscription.subscription_plans?.name || "Plano Atual"}
                  </p>
                  <Badge variant={
                    subscription.status === "active" ? "default" :
                    subscription.status === "trial" ? "secondary" :
                    subscription.status === "cancelled" ? "destructive" :
                    "outline"
                  }>
                    {subscription.status === "active" ? "Ativo" :
                     subscription.status === "trial" ? "Trial" :
                     subscription.status === "cancelled" ? "Cancelado" :
                     subscription.status === "suspended" ? "Suspenso" :
                     subscription.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription.status === "trial" 
                    ? "Período de teste gratuito" 
                    : subscription.subscription_plans?.description || ""}
                </p>
                {subscription.next_billing_date && subscription.status !== "cancelled" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Próximo pagamento: {format(new Date(subscription.next_billing_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
                {subscription.status === "cancelled" && (
                  <p className="text-xs text-destructive mt-2">
                    Assinatura cancelada
                  </p>
                )}
              </div>
              {subscription.subscription_plans?.price && subscription.status !== "cancelled" && (
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(subscription.subscription_plans.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    /{subscription.subscription_plans.billing_frequency === "monthly" ? "mês" : "ano"}
                  </p>
                </div>
              )}
            </div>

            {subscription.status !== "cancelled" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Cancelar Assinatura
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza que deseja cancelar?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao cancelar sua assinatura, você perderá acesso a todos os recursos premium.
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelSubscriptionMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmar Cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Segurança da Conta
          </CardTitle>
          <CardDescription>Gerencie suas informações de acesso e segurança</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alteração de Senha */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <Label className="font-semibold">Alterar Senha</Label>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual *</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Digite a nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={() => changePasswordMutation.mutate()}
                disabled={!currentPassword || !newPassword || !confirmPassword || changePasswordMutation.isPending}
                variant="secondary"
                className="w-full"
              >
                {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
              </Button>
              <p className="text-xs text-muted-foreground">
                A senha deve ter no mínimo 6 caracteres
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          className="gap-2"
          onClick={handleSaveSettings}
          disabled={saveSettingsMutation.isPending}
        >
          <Save className="w-4 h-4" />
          {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default Configuracoes;
