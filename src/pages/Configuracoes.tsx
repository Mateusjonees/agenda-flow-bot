import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, Star, Gift, Link as LinkIcon, Upload, Camera, Lock, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
const Configuracoes = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Estados para fidelidade
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [loyaltyStampsRequired, setLoyaltyStampsRequired] = useState(10);
  const [loyaltyPointsPerVisit, setLoyaltyPointsPerVisit] = useState(1);

  // Estado para cupons de retorno
  const [couponEnabled, setCouponEnabled] = useState(false); // Desativado por padrão

  // Estados para informações do negócio
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [instagramLink, setInstagramLink] = useState("");
  const [defaultSlotDuration, setDefaultSlotDuration] = useState(60);
  const [bufferTime, setBufferTime] = useState(0);

  // Estrutura para armazenar horários de cada dia
  interface DaySchedule {
    isActive: boolean;
    startTime: string;
    endTime: string;
  }
  const [schedules, setSchedules] = useState<Record<number, DaySchedule>>({
    0: {
      isActive: false,
      startTime: "09:00",
      endTime: "18:00"
    },
    // Domingo
    1: {
      isActive: true,
      startTime: "09:00",
      endTime: "18:00"
    },
    // Segunda
    2: {
      isActive: true,
      startTime: "09:00",
      endTime: "18:00"
    },
    // Terça
    3: {
      isActive: true,
      startTime: "09:00",
      endTime: "18:00"
    },
    // Quarta
    4: {
      isActive: true,
      startTime: "09:00",
      endTime: "18:00"
    },
    // Quinta
    5: {
      isActive: true,
      startTime: "09:00",
      endTime: "18:00"
    },
    // Sexta
    6: {
      isActive: true,
      startTime: "09:00",
      endTime: "14:00"
    } // Sábado
  });

  // Estados para alteração de senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Buscar dados do usuário e configurações
  const {
    data: user
  } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      return user;
    }
  });
  const {
    data: settings
  } = useQuery({
    queryKey: ["business-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const {
        data
      } = await supabase.from("business_settings").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user
  });

  // Buscar configurações do cartão fidelidade
  const {
    data: loyaltySettings
  } = useQuery({
    queryKey: ["loyalty-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const {
        data
      } = await supabase.from("loyalty_cards").select("stamps_required").eq("user_id", user.id).limit(1).single();
      return data;
    },
    enabled: !!user
  });
  const {
    data: businessHours
  } = useQuery({
    queryKey: ["business-hours", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const {
        data
      } = await supabase.from("business_hours").select("*").eq("user_id", user.id).order("day_of_week");
      return data || [];
    },
    enabled: !!user
  });

  // Buscar assinatura do usuário
  const {
    data: subscription
  } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        // @ts-ignore - Temporary fix for type inference issue
        const response = await supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("type", "platform").order("created_at", {
          ascending: false
        }).limit(1);
        if (response.error) {
          console.error("Error fetching subscription:", response.error);
          return null;
        }
        return response.data?.[0] || null;
      } catch (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }
    },
    enabled: !!user
  });

  // Atualizar estado quando os dados forem carregados
  useEffect(() => {
    // Não precisamos mais deste useEffect pois as configs vêm do business_settings
  }, []);

  // Atualizar estados com dados das configurações
  useEffect(() => {
    if (settings) {
      setBusinessName(settings.business_name || "");
      setBusinessType(settings.business_type || "");
      setPhone(settings.whatsapp_number || "");
      setEmail(settings.email || "");
      setAddress(settings.address || "");
      setCpfCnpj(settings.cpf_cnpj || "");
      setGoogleReviewLink(settings.google_review_link || "");
      setInstagramLink(settings.instagram_link || "");
      setDefaultSlotDuration(settings.default_slot_duration || 60);
      setBufferTime(settings.buffer_time || 0);
      setLoyaltyEnabled(settings.loyalty_enabled ?? true);
      setCouponEnabled(settings.coupon_enabled ?? false); // Desativado por padrão
      setLoyaltyStampsRequired(settings.loyalty_stamps_required || 10);
      setLoyaltyPointsPerVisit(settings.loyalty_points_per_visit || 1);
    }
  }, [settings]);

  // Atualizar horários quando carregados
  useEffect(() => {
    if (businessHours && businessHours.length > 0) {
      const loadedSchedules: Record<number, DaySchedule> = {};
      businessHours.forEach((hour: any) => {
        loadedSchedules[hour.day_of_week] = {
          isActive: hour.is_active,
          startTime: hour.start_time,
          endTime: hour.end_time
        };
      });
      setSchedules(loadedSchedules);
    }
  }, [businessHours]);

  // Mutation para fazer upload da imagem
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Usuário não autenticado");
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      // Upload para o storage
      const {
        error: uploadError
      } = await supabase.storage.from("avatars").upload(fileName, file, {
        upsert: true
      });
      if (uploadError) throw uploadError;

      // Obter URL pública
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Atualizar ou criar configurações
      const {
        error: updateError
      } = await supabase.from("business_settings").upsert({
        user_id: user.id,
        profile_image_url: publicUrl,
        business_name: settings?.business_name || "Meu Negócio"
      }, {
        onConflict: "user_id"
      });
      if (updateError) throw updateError;
      return publicUrl;
    },
    onSuccess: () => {
      toast.success("Foto de perfil atualizada com sucesso!");
      queryClient.invalidateQueries({
        queryKey: ["business-settings"]
      });
      queryClient.invalidateQueries({
        queryKey: ["profile-image"]
      });
    },
    onError: error => {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao atualizar foto de perfil");
    }
  });

  // Mutation para salvar configurações do cartão fidelidade
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Atualizar business_settings
      const {
        error: settingsError
      } = await supabase.from("business_settings").upsert({
        user_id: user.id,
        business_name: businessName,
        business_type: businessType,
        whatsapp_number: phone,
        email: email,
        address: address,
        cpf_cnpj: cpfCnpj,
        google_review_link: googleReviewLink,
        instagram_link: instagramLink,
        default_slot_duration: defaultSlotDuration,
        buffer_time: bufferTime,
        loyalty_enabled: loyaltyEnabled,
        coupon_enabled: couponEnabled,
        loyalty_stamps_required: loyaltyStampsRequired,
        loyalty_points_per_visit: loyaltyPointsPerVisit,
        profile_image_url: settings?.profile_image_url
      }, {
        onConflict: "user_id"
      });
      if (settingsError) throw settingsError;

      // Atualizar todas as loyalty cards do usuário com as novas configurações
      const {
        error: loyaltyError
      } = await supabase.from("loyalty_cards").update({
        stamps_required: loyaltyStampsRequired
      }).eq("user_id", user.id);
      if (loyaltyError) throw loyaltyError;
    },
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      queryClient.invalidateQueries({
        queryKey: ["loyalty-settings"]
      });
      queryClient.invalidateQueries({
        queryKey: ["loyalty-cards"]
      });
      queryClient.invalidateQueries({
        queryKey: ["business-settings"]
      });
    },
    onError: error => {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    }
  });

  // Mutation para salvar horários de funcionamento
  const saveBusinessHoursMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Deletar horários existentes
      await supabase.from("business_hours").delete().eq("user_id", user.id);

      // Inserir novos horários
      const hoursToInsert = Object.entries(schedules).map(([day, schedule]) => ({
        user_id: user.id,
        day_of_week: Number(day),
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        is_active: schedule.isActive
      }));
      const {
        error
      } = await supabase.from("business_hours").insert(hoursToInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["business-hours"]
      });
    },
    onError: error => {
      console.error("Erro ao salvar horários:", error);
      throw error;
    }
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
  const handleSaveSettings = async () => {
    try {
      await saveSettingsMutation.mutateAsync();
      await saveBusinessHoursMutation.mutateAsync();
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    }
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
      const {
        error: signInError
      } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      if (signInError) {
        throw new Error("Senha atual incorreta");
      }

      // Alterar senha
      const {
        error
      } = await supabase.auth.updateUser({
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
    }
  });
  return <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">Configurações</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Configure as informações do seu negócio</p>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Foto de Perfil</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Adicione uma foto sua ou da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-primary/20">
              <AvatarImage src={settings?.profile_image_url || undefined} alt="Perfil" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-2xl">
                <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2 w-full sm:w-auto">
                <Upload className="w-4 h-4" />
                {uploading ? "Enviando..." : "Enviar Foto"}
              </Button>
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                JPG, PNG ou WEBP. Máximo 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Informações do Negócio</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Configure os dados principais do seu estabelecimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-3 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business-name">Nome do Negócio</Label>
              <Input id="business-name" placeholder="Meu Salão" value={businessName} onChange={e => setBusinessName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-type">Tipo de Negócio</Label>
              <Input id="business-type" placeholder="Salão de Beleza" value={businessType} onChange={e => setBusinessType(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="contato@meusalao.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpf-cnpj">CPF/CNPJ</Label>
              <Input id="cpf-cnpj" placeholder="000.000.000-00 ou 00.000.000/0000-00" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" placeholder="Rua Example, 123 - Bairro, Cidade - UF" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Horário de Funcionamento</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Defina os horários de atendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          <div className="space-y-3">
            {[{
            day: 1,
            name: "Segunda"
          }, {
            day: 2,
            name: "Terça"
          }, {
            day: 3,
            name: "Quarta"
          }, {
            day: 4,
            name: "Quinta"
          }, {
            day: 5,
            name: "Sexta"
          }, {
            day: 6,
            name: "Sábado"
          }, {
            day: 0,
            name: "Domingo"
          }].map(({
            day,
            name
          }) => <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 min-w-[100px] sm:w-24">
                  <Switch checked={schedules[day]?.isActive || false} onCheckedChange={checked => setSchedules({
                ...schedules,
                [day]: {
                  ...schedules[day],
                  isActive: checked
                }
              })} />
                  <p className="text-sm font-medium">{name}</p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 pl-8 sm:pl-0">
                  <Input type="time" value={schedules[day]?.startTime || "09:00"} onChange={e => setSchedules({
                ...schedules,
                [day]: {
                  ...schedules[day],
                  startTime: e.target.value
                }
              })} disabled={!schedules[day]?.isActive} className="w-[100px] sm:w-32 text-xs sm:text-sm" />
                  <span className="text-xs sm:text-sm text-muted-foreground">-</span>
                  <Input type="time" value={schedules[day]?.endTime || "18:00"} onChange={e => setSchedules({
                ...schedules,
                [day]: {
                  ...schedules[day],
                  endTime: e.target.value
                }
              })} disabled={!schedules[day]?.isActive} className="w-[100px] sm:w-32 text-xs sm:text-sm" />
                </div>
              </div>)}
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
              <Input id="slot-duration" type="number" value={defaultSlotDuration} onChange={e => setDefaultSlotDuration(Number(e.target.value))} min="15" max="240" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer-time">Tempo entre agendamentos (minutos)</Label>
              <Input id="buffer-time" type="number" value={bufferTime} onChange={e => setBufferTime(Number(e.target.value))} min="0" max="60" />
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
            <Input id="google-review" type="url" placeholder="https://g.page/r/..." value={googleReviewLink} onChange={e => setGoogleReviewLink(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Link para avaliação no Google Meu Negócio
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instagram-review" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Link do Instagram
            </Label>
            <Input id="instagram-review" type="url" placeholder="https://instagram.com/seunegocio" value={instagramLink} onChange={e => setInstagramLink(e.target.value)} />
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
        <CardContent className="space-y-6">
          {/* Toggle para ativar/desativar fidelidade */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="loyalty-enabled" className="text-base font-medium">Ativar Programa de Fidelidade</Label>
              <p className="text-sm text-muted-foreground">
                Recompense seus clientes por cada atendimento finalizado
              </p>
            </div>
            <Switch id="loyalty-enabled" checked={loyaltyEnabled} onCheckedChange={setLoyaltyEnabled} />
          </div>

          {loyaltyEnabled && <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="loyalty-stamps">Carimbos necessários</Label>
                  <Input id="loyalty-stamps" type="number" value={loyaltyStampsRequired} onChange={e => setLoyaltyStampsRequired(Number(e.target.value))} min="2" max="20" />
                  <p className="text-xs text-muted-foreground">
                    Quantos atendimentos para ganhar uma recompensa
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="loyalty-points">Pontos por atendimento</Label>
                  <Input id="loyalty-points" type="number" value={loyaltyPointsPerVisit} onChange={e => setLoyaltyPointsPerVisit(Number(e.target.value))} min="1" max="10" />
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
            </>}
        </CardContent>
      </Card>

      

      <Separator />

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
                <Input id="current-password" type="password" placeholder="Digite sua senha atual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input id="new-password" type="password" placeholder="Digite a nova senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input id="confirm-password" type="password" placeholder="Confirme a nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <Button onClick={() => changePasswordMutation.mutate()} disabled={!currentPassword || !newPassword || !confirmPassword || changePasswordMutation.isPending} variant="secondary" className="w-full">
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
        <Button className="gap-2" onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending}>
          <Save className="w-4 h-4" />
          {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>;
};
export default Configuracoes;