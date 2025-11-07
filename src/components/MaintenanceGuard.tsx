import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Maintenance from "@/pages/Maintenance";
import { LoadingState } from "./LoadingState";

interface MaintenanceGuardProps {
  children: ReactNode;
}

export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [estimatedReturn, setEstimatedReturn] = useState<string>("");

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
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao verificar modo manutenção:", error);
      }

      if (data && (data as any).is_maintenance_mode) {
        setIsMaintenanceMode(true);
        setMessage((data as any).maintenance_message || "");
        setEstimatedReturn((data as any).maintenance_estimated_return || "");
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

  if (isMaintenanceMode) {
    return (
      <Maintenance
        message={message || undefined}
        estimatedReturn={estimatedReturn || undefined}
        showNotificationSignup={true}
      />
    );
  }

  return <>{children}</>;
};
