import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Maintenance from "@/pages/Maintenance";
import { LoadingState } from "./LoadingState";

interface MaintenanceGuardProps {
  children: ReactNode;
}

interface MaintenanceSettings {
  is_maintenance_mode: boolean;
  maintenance_message: string | null;
  maintenance_estimated_return: string | null;
}

export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings | null>(null);

  useEffect(() => {
    checkMaintenanceMode();

    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel('maintenance-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_settings'
        },
        () => {
          checkMaintenanceMode();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      // Buscar configurações de manutenção de qualquer usuário (modo global)
      const { data, error } = await supabase
        .from("business_settings")
        .select("is_maintenance_mode, maintenance_message, maintenance_estimated_return")
        .eq("is_maintenance_mode", true)
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao verificar modo manutenção:", error);
      }

      if (data) {
        setIsMaintenanceMode(true);
        setMaintenanceSettings(data);
      } else {
        setIsMaintenanceMode(false);
      }
    } catch (error) {
      console.error("Erro ao verificar modo manutenção:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState showLogo message="Verificando status do sistema..." />;
  }

  if (isMaintenanceMode && maintenanceSettings) {
    return (
      <Maintenance
        message={maintenanceSettings.maintenance_message || undefined}
        estimatedReturn={maintenanceSettings.maintenance_estimated_return || undefined}
        showNotificationSignup={true}
      />
    );
  }

  return <>{children}</>;
};
