import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Clock, Megaphone, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { BusinessSettings } from "@/components/settings/BusinessSettings";
import { OperatingSettings } from "@/components/settings/OperatingSettings";
import { MarketingSettings } from "@/components/settings/MarketingSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { useIsMobile } from "@/hooks/use-mobile";

interface DaySchedule {
  isActive: boolean;
  startTime: string;
  endTime: string;
}

const Configuracoes = () => {
  const isMobile = useIsMobile();

  // Estados para fidelidade
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [loyaltyStampsRequired, setLoyaltyStampsRequired] = useState(10);
  const [loyaltyPointsPerVisit, setLoyaltyPointsPerVisit] = useState(1);
  const [couponEnabled, setCouponEnabled] = useState(false);

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
  const [schedules, setSchedules] = useState<Record<number, DaySchedule>>({
    0: { isActive: false, startTime: "09:00", endTime: "18:00" },
    1: { isActive: true, startTime: "09:00", endTime: "18:00" },
    2: { isActive: true, startTime: "09:00", endTime: "18:00" },
    3: { isActive: true, startTime: "09:00", endTime: "18:00" },
    4: { isActive: true, startTime: "09:00", endTime: "18:00" },
    5: { isActive: true, startTime: "09:00", endTime: "18:00" },
    6: { isActive: true, startTime: "09:00", endTime: "14:00" },
  });

  // Buscar dados do usuário e configurações
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
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
    enabled: !!user
  });

  const { data: businessHours } = useQuery({
    queryKey: ["business-hours", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("business_hours")
        .select("*")
        .eq("user_id", user.id)
        .order("day_of_week");
      return data || [];
    },
    enabled: !!user
  });

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
      setCouponEnabled(settings.coupon_enabled ?? false);
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

  const tabs = [
    { value: "negocio", label: "Meu Negócio", icon: Building2 },
    { value: "funcionamento", label: "Funcionamento", icon: Clock },
    { value: "marketing", label: "Marketing", icon: Megaphone },
    { value: "conta", label: "Conta", icon: Shield },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
          Configurações
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure as informações do seu negócio
        </p>
      </div>

      <Tabs defaultValue="negocio" className="w-full" orientation={isMobile ? "horizontal" : "vertical"}>
        <div className={`flex ${isMobile ? "flex-col" : "flex-row gap-6"}`}>
          <TabsList className={`${
            isMobile 
              ? "w-full grid grid-cols-4 h-auto p-1" 
              : "flex flex-col h-fit w-48 p-1 shrink-0"
          } bg-muted/50`}>
            {tabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={`${
                  isMobile 
                    ? "flex flex-col items-center gap-1 py-2 px-1 text-xs" 
                    : "flex items-center gap-2 justify-start px-3 py-2.5 w-full"
                } data-[state=active]:bg-background data-[state=active]:shadow-sm`}
              >
                <Icon className={`${isMobile ? "h-4 w-4" : "h-4 w-4"}`} />
                <span className={isMobile ? "text-[10px] leading-tight" : "text-sm"}>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className={`${isMobile ? "mt-4" : ""} flex-1 min-w-0`}>
            <TabsContent value="negocio" className="mt-0">
              <BusinessSettings
                user={user}
                settings={settings}
                businessName={businessName}
                setBusinessName={setBusinessName}
                businessType={businessType}
                setBusinessType={setBusinessType}
                phone={phone}
                setPhone={setPhone}
                email={email}
                setEmail={setEmail}
                address={address}
                setAddress={setAddress}
                cpfCnpj={cpfCnpj}
                setCpfCnpj={setCpfCnpj}
              />
            </TabsContent>

            <TabsContent value="funcionamento" className="mt-0">
              <OperatingSettings
                user={user}
                settings={settings}
                schedules={schedules}
                setSchedules={setSchedules}
                defaultSlotDuration={defaultSlotDuration}
                setDefaultSlotDuration={setDefaultSlotDuration}
                bufferTime={bufferTime}
                setBufferTime={setBufferTime}
              />
            </TabsContent>

            <TabsContent value="marketing" className="mt-0">
              <MarketingSettings
                user={user}
                settings={settings}
                googleReviewLink={googleReviewLink}
                setGoogleReviewLink={setGoogleReviewLink}
                instagramLink={instagramLink}
                setInstagramLink={setInstagramLink}
                loyaltyEnabled={loyaltyEnabled}
                setLoyaltyEnabled={setLoyaltyEnabled}
                loyaltyStampsRequired={loyaltyStampsRequired}
                setLoyaltyStampsRequired={setLoyaltyStampsRequired}
                loyaltyPointsPerVisit={loyaltyPointsPerVisit}
                setLoyaltyPointsPerVisit={setLoyaltyPointsPerVisit}
                couponEnabled={couponEnabled}
                setCouponEnabled={setCouponEnabled}
              />
            </TabsContent>

            <TabsContent value="conta" className="mt-0">
              <AccountSettings user={user} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default Configuracoes;
