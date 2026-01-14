import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface BusinessSettingsProps {
  user: any;
  settings: any;
  businessName: string;
  setBusinessName: (value: string) => void;
  businessType: string;
  setBusinessType: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  cpfCnpj: string;
  setCpfCnpj: (value: string) => void;
}

export const BusinessSettings = ({
  user,
  settings,
  businessName,
  setBusinessName,
  businessType,
  setBusinessType,
  phone,
  setPhone,
  email,
  setEmail,
  address,
  setAddress,
  cpfCnpj,
  setCpfCnpj,
}: BusinessSettingsProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Usuário não autenticado");
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("business_settings")
        .upsert({
          user_id: user.id,
          profile_image_url: publicUrl,
          business_name: settings?.business_name || "Meu Negócio"
        }, { onConflict: "user_id" });
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
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("business_settings").upsert({
        user_id: user.id,
        business_name: businessName,
        business_type: businessType,
        whatsapp_number: phone,
        email: email,
        address: address,
        cpf_cnpj: cpfCnpj,
        profile_image_url: settings?.profile_image_url
      }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Informações do negócio salvas!");
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    },
    onError: (error) => {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

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

  return (
    <div className="space-y-4 sm:space-y-6">
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

      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>
          <Save className="w-4 h-4" />
          {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Informações"}
        </Button>
      </div>
    </div>
  );
};
