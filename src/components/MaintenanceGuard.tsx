import { ReactNode, useEffect, useState } from "react";

interface MaintenanceGuardProps {
  children: ReactNode;
}

export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const [MaintenancePage, setMaintenancePage] = useState<React.ComponentType<any> | null>(null);
  const [maintenanceData, setMaintenanceData] = useState<{ message: string; estimatedReturn: string } | null>(null);

  useEffect(() => {
    let channelRef: any = null;
    let supabaseRef: any = null;

    const timer = setTimeout(async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      supabaseRef = supabase;

      const checkMaintenance = async () => {
        try {
          const { data } = await supabase
            .from("business_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (data && (data as any).is_maintenance_mode) {
            const Maintenance = (await import("@/pages/Maintenance")).default;
            setMaintenancePage(() => Maintenance);
            setMaintenanceData({
              message: (data as any).maintenance_message || "",
              estimatedReturn: (data as any).maintenance_estimated_return || ""
            });
          } else {
            setMaintenancePage(null);
            setMaintenanceData(null);
          }
        } catch (error) {
          console.error("Erro ao verificar manutencao:", error);
        }
      };

      checkMaintenance();

      channelRef = supabase
        .channel('maintenance-settings-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'business_settings' }, checkMaintenance)
        .subscribe();
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (channelRef && supabaseRef) {
        supabaseRef.removeChannel(channelRef);
      }
    };
  }, []);

  if (MaintenancePage && maintenanceData) {
    return <MaintenancePage message={maintenanceData.message} estimatedReturn={maintenanceData.estimatedReturn} showNotificationSignup />;
  }

  return <>{children}</>;
};
